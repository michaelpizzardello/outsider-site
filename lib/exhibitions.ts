// lib/exhibitions.ts
import "server-only";
import { shopifyFetch } from "@/lib/shopify";
export { formatDates } from "@/lib/formatDates";

// ---------------- Types ----------------
export type FieldRef =
  | {
      __typename: "MediaImage";
      image: { url: string; width: number; height: number; altText: string | null };
    }
  | { __typename: "GenericFile"; url?: string; previewImage?: { url: string } }
  | { __typename: string };

export type Field = { key: string; type: string; value: unknown; reference: FieldRef | null };
export type Node = { handle: string; fields: Field[] };

export type ExhibitionCard = {
  handle: string;
  title: string;
  artist?: string;
  location?: string;
  openingInfo?: string;
  start?: Date;
  end?: Date;
  hero?: { url: string; width?: number; height?: number; alt?: string };
  banner?: { url: string; width?: number; height?: number; alt?: string };
  summary?: string; // normalised from short_text / short-text / etc.
  isGroup?: boolean; // optional future flag from Shopify if you add one
  variant?: string; // exhibition template variant (minimal/standard/feature/announcement)
};

type HomeQuery = {
  exhibitions: { nodes: Node[] } | null;
};

// --------------- Query -----------------
const HOME_QUERY = /* GraphQL */ `
  query HomeData {
    exhibitions: metaobjects(type: "exhibitions", first: 20, reverse: true) {
      nodes {
        handle
        fields {
          key
          type
          value
          reference {
            __typename
            ... on MediaImage { image { url width height altText } }
            ... on GenericFile { url previewImage { url } }
          }
        }
      }
    }
  }
`;

// ------------- Helpers -----------------
function coerceToString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const anyv: any = v;
    if (typeof anyv.text === "string") return anyv.text;
    if (typeof anyv.value === "string") return anyv.value;
  }
  return undefined;
}

function text(fields: Field[], ...keys: string[]) {
  for (const k of keys) {
    const f = fields.find((x) => x.key === k);
    if (!f) continue;
    const s = coerceToString(f.value)?.trim();
    if (s) return s;
  }
}

function img(fields: Field[], ...keys: string[]) {
  for (const k of keys) {
    const f = fields.find((x) => x.key === k);
    if (!f) continue;
    const ref: any = f.reference;
    if (ref?.image?.url)
      return {
        url: ref.image.url,
        width: ref.image.width,
        height: ref.image.height,
        alt: ref.image.altText ?? undefined,
      };
    if (ref?.url) return { url: ref.url };
    if (ref?.previewImage?.url) return { url: ref.previewImage.url };
    const s = coerceToString(f.value);
    if (s && s.startsWith("http")) return { url: s };
  }
  return undefined;
}

function asDate(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(+d) ? undefined : d;
}

// ----- Title logic centralised -----
export function isGroupShow(
  ex: Pick<ExhibitionCard, "artist" | "isGroup" | "variant">
): boolean {
  if (ex?.isGroup === true) return true;

  const variant = ex?.variant?.trim().toLowerCase();
  if (variant && (variant.includes("group") || variant.includes("collective"))) {
    return true;
  }

  const artistValue = (ex?.artist ?? "").trim().toLowerCase();
  if (!artistValue) return false;

  const simpleMatches = [
    "group exhibition",
    "group show",
    "group",
    "various artists",
    "multiple artists",
  ];
  if (simpleMatches.includes(artistValue)) return true;

  if (
    artistValue.includes("group exhibition") ||
    artistValue.includes("group show")
  )
    return true;

  const multiArtistSeparators = [", ", " & ", " and ", " / ", "+", "/"];
  if (
    multiArtistSeparators.some((sep) => {
      if (!artistValue.includes(sep)) return false;
      const parts = artistValue.split(sep).map((part) => part.trim());
      return parts.filter(Boolean).length >= 2;
    })
  )
    return true;

  return false;
}

export function headingParts(
  ex: Pick<ExhibitionCard, "title" | "artist" | "isGroup" | "variant">
): { primary: string; secondary?: string; isGroup: boolean } {
  const group = isGroupShow(ex);
  const primary = group ? (ex.title || ex.artist || "") : (ex.artist || ex.title || "");
  const secondary = group ? ex.artist : ex.title;
  return { primary, secondary, isGroup: group };
}

function mapNode(n: Node): ExhibitionCard {
  return {
    handle: n.handle,
    title: text(n.fields, "title", "name") ?? n.handle,
    artist: text(n.fields, "artist", "artists", "artistName"),
    location: text(n.fields, "address", "location", "subtitle"),
    openingInfo: text(n.fields, "opening_info", "openinginfo", "openingInfo"),
    start: asDate(text(n.fields, "startDate", "startdate", "start")),
    end: asDate(text(n.fields, "endDate", "enddate", "end")),
    // normalise short text variants into one field
    summary: text(n.fields, "short_text", "short-text", "shortText", "summary", "teaser", "description"),
    hero:
      img(n.fields, "heroImage") ??
      img(n.fields, "heroimage") ??
      img(n.fields, "coverimage") ??
      img(n.fields, "coverImage"),
    banner:
      img(n.fields, "banner_image") ??
      img(n.fields, "bannerImage") ??
      img(n.fields, "bannerimage"),
    variant: text(n.fields, "variant"),
    // if you later add a boolean field, map it here:
    // isGroup: text(n.fields, "is_group", "isGroup") === "true",
  };
}

// -------- Classification (current / upcoming / past) --------
export function classifyExhibitions(nodes: Node[]) {
  const today = Date.now();
  const ex = nodes.map(mapNode);

  const isCurrent = (e: ExhibitionCard) => {
    const s = e.start?.getTime();
    const ee = e.end?.getTime();
    return s !== undefined && s <= today && (ee === undefined || ee >= today);
  };

  const isUpcoming = (e: ExhibitionCard) => {
    const s = e.start?.getTime();
    return s !== undefined && s > today;
  };

  const isPast = (e: ExhibitionCard) => {
    const ee = e.end?.getTime();
    if (ee !== undefined) return ee < today;
    const s = e.start?.getTime();
    return s !== undefined && s < today && !isCurrent(e);
  };

  const currentList = ex
    .filter(isCurrent)
    .sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0));
  const current = currentList[0] ?? null;

  const upcoming = ex
    .filter((e) => e !== current && isUpcoming(e))
    .sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity));

  const past = ex
    .filter((e) => e !== current && isPast(e))
    .sort((a, b) => {
      const at = a.end?.getTime() ?? a.start?.getTime() ?? 0;
      const bt = b.end?.getTime() ?? b.start?.getTime() ?? 0;
      return bt - at;
    });

  return { current, upcoming, past };
}

// --------------- Fetch -----------------
export async function fetchHomeExhibitions() {
  const data = await shopifyFetch<HomeQuery>(HOME_QUERY);
  return data.exhibitions?.nodes ?? [];
}

// ---- Index data for /exhibitions ----
export async function listExhibitions({
  status,
  year,
  page = 1,
  pageSize = 12,
}: {
  status: "current" | "upcoming" | "past";
  year?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: ExhibitionCard[]; total: number; pageSize: number }> {
  // Reuse your existing fetch + mapping
  const nodes = await fetchHomeExhibitions();   // uses HOME_QUERY you already have
  const all = nodes.map(mapNode);

  const now = Date.now();

  const isCurrent = (e: ExhibitionCard) => {
    const s = e.start?.getTime();
    const ee = e.end?.getTime();
    return s !== undefined && s <= now && (ee === undefined || ee >= now);
  };
  const isUpcoming = (e: ExhibitionCard) => {
    const s = e.start?.getTime();
    return s !== undefined && s > now;
  };
  const isPast = (e: ExhibitionCard) => {
    const ee = e.end?.getTime();
    if (ee !== undefined) return ee < now;
    const s = e.start?.getTime();
    return s !== undefined && s < now && !isCurrent(e);
  };

  const statusOk = (e: ExhibitionCard) =>
    status === "current" ? isCurrent(e) : status === "upcoming" ? isUpcoming(e) : isPast(e);

  const yearOk = (e: ExhibitionCard) =>
    year
      ? e.start?.getFullYear() === Number(year) || e.end?.getFullYear() === Number(year)
      : true;

  const filtered = all.filter((e) => statusOk(e) && yearOk(e));

  // Sort: upcoming = start asc; past = end/then start desc; current = start asc
  filtered.sort((a, b) => {
    const as = a.start?.getTime() ?? 0;
    const bs = b.start?.getTime() ?? 0;
    const ae = a.end?.getTime() ?? as;
    const be = b.end?.getTime() ?? bs;

    if (status === "upcoming") return as - bs;
    if (status === "past") return be - ae;
    return as - bs; // current
  });

  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return { items, total, pageSize };
}
