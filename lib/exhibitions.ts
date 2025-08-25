// lib/exhibitions.ts
import { shopifyFetch } from "@/lib/shopify";

// ---------------- Types ----------------
export type FieldRef =
  | { __typename: "MediaImage"; image: { url: string; width: number; height: number; altText: string | null } }
  | { __typename: "GenericFile"; url?: string; previewImage?: { url: string } }
  | { __typename: string };

export type Field = { key: string; type: string; value: string; reference: FieldRef | null };
export type Node = { handle: string; fields: Field[] };

export type ExhibitionCard = {
  handle: string;
  title: string;
  artist?: string;
  location?: string;
  start?: Date;
  end?: Date;
  hero?: { url: string; width?: number; height?: number; alt?: string };
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
function text(fields: Field[], ...keys: string[]) {
  for (const k of keys) {
    const f = fields.find((x) => x.key === k);
    if (f?.value) return f.value;
  }
}

function img(fields: Field[], ...keys: string[]) {
  for (const k of keys) {
    const f = fields.find((x) => x.key === k);
    if (!f) continue;
    const ref: any = f.reference;
    if (ref?.image?.url)
      return { url: ref.image.url, width: ref.image.width, height: ref.image.height, alt: ref.image.altText ?? undefined };
    if (ref?.url) return { url: ref.url };
    if (ref?.previewImage?.url) return { url: ref.previewImage.url };
    if (typeof f.value === "string" && f.value.startsWith("http")) return { url: f.value };
  }
  return undefined;
}

function asDate(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(+d) ? undefined : d;
}

export function formatDates(start?: Date, end?: Date) {
  if (!start && !end) return undefined;
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (start && end) return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
  if (start) return start.toLocaleDateString(undefined, opts);
  return end!.toLocaleDateString(undefined, opts);
}

function mapNode(n: Node): ExhibitionCard {
  return {
    handle: n.handle,
    title: text(n.fields, "title", "name") ?? n.handle,
    artist: text(n.fields, "artist", "artists", "artistName"),
    location: text(n.fields, "location", "subtitle"),
    start: asDate(text(n.fields, "startDate", "startdate", "start")),
    end: asDate(text(n.fields, "endDate", "enddate", "end")),
    hero:
      img(n.fields, "heroImage") ??
      img(n.fields, "heroimage") ??
      img(n.fields, "coverimage") ??
      img(n.fields, "coverImage"),
  };
}

// -------- Classification (current / upcoming / past) --------
export function classifyExhibitions(nodes: Node[]) {
  const today = Date.now();
  const ex = nodes.map(mapNode);

  const isCurrent = (e: ExhibitionCard) => {
    const s = e.start?.getTime();
    const ee = e.end?.getTime();
    // Current if started and (no end or not ended yet)
    return s !== undefined && s <= today && (ee === undefined || ee >= today);
  };

  const isUpcoming = (e: ExhibitionCard) => {
    const s = e.start?.getTime();
    return s !== undefined && s > today;
  };

  const isPast = (e: ExhibitionCard) => {
    const ee = e.end?.getTime();
    if (ee !== undefined) return ee < today;
    // If no end but has a start before today and isn't current, treat as past
    const s = e.start?.getTime();
    return s !== undefined && s < today && !isCurrent(e);
  };

  // pick a single current (if multiple, prefer the one with the latest start)
  const currentList = ex.filter(isCurrent).sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
  const current = currentList[0] ?? null;

  const upcoming = ex
    .filter((e) => e !== current && isUpcoming(e))
    .sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity)); // soonest first

  const past = ex
    .filter((e) => e !== current && isPast(e))
    .sort((a, b) => {
      const at = a.end?.getTime() ?? a.start?.getTime() ?? 0;
      const bt = b.end?.getTime() ?? b.start?.getTime() ?? 0;
      return bt - at; // most recent first
    });

  return { current, upcoming, past };
}

// --------------- Fetch -----------------
export async function fetchHomeExhibitions() {
  const data = await shopifyFetch<HomeQuery>(HOME_QUERY);
  return data.exhibitions?.nodes ?? [];
}
