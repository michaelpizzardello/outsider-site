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
  artist?: string; // 👈 added
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
    const f = fields.find(x => x.key === k);
    if (f?.value) return f.value;
  }
}

function img(fields: Field[], ...keys: string[]) {
  for (const k of keys) {
    const f = fields.find(x => x.key === k);
    if (!f) continue;
    const ref: any = f.reference;
    if (ref?.image?.url) return { url: ref.image.url, width: ref.image.width, height: ref.image.height, alt: ref.image.altText ?? undefined };
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
    artist: text(n.fields, "artist", "artists", "artistName"), // 👈 mapped artist
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

export function classifyExhibitions(nodes: Node[]) {
  const today = new Date();
  const ex = nodes.map(mapNode);

  const current =
    ex.find(e => {
      const s = e.start ?? new Date(0);
      const ee = e.end ?? new Date(8640000000000000);
      return s <= today && today <= ee;
    }) ?? ex[0] ?? null;

  const upcoming = ex
    .filter(e => e !== current)
    .filter(e => (e.start ? e.start > today : true))
    .sort((a, b) => {
      const as = a.start ? +a.start : Infinity;
      const bs = b.start ? +b.start : Infinity;
      return as - bs;
    });

  return { current, upcoming };
}

export async function fetchHomeExhibitions() {
  const data = await shopifyFetch<HomeQuery>(HOME_QUERY);
  return data.exhibitions?.nodes ?? [];
}
