// app/exhibitions/[handle]/page.tsx
// -----------------------------------------------------------------------------
// Exhibition detail route: /exhibitions/[handle]
//
// What this file does:
// 1) Fetch one Shopify Metaobject (type: "exhibitions") by handle
// 2) Build the same `ExhibitionCard` shape the home hero already uses (toCard)
// 3) Compute the phase label from dates (CURRENT / UPCOMING / PAST)
// 4) Render:
//      - <Header overlay />
//      - <CurrentExhibitionHero />
//      - <Details />  ← Dates / Location / Share + Read-more text
//      - <SiteFooter />
//
// Notes:
// • Long copy (main text) is selected via `extractLongCopy(...)` by FIELD TYPE,
//   so you don’t need to hard-code field keys. If you later standardise on a
//   single key (e.g. `essay`), you can swap the helper with a direct read.
// • This file stays a SERVER component. `Details` contains client children.
// -----------------------------------------------------------------------------

import "server-only";
import { notFound } from "next/navigation";

import CurrentExhibitionHero from "@/components/exhibitions/CurrentExhibitionHero";
import Details from "@/components/exhibition/Details";
import InstallationViews from "@/components/exhibition/InstallationViews";
import FeaturedWorks from "@/components/exhibition/FeaturedWorks";
import AboutArtistWithPortrait from "@/components/exhibition/AboutArtistWithPortrait";
import type { PortraitVideoSource } from "@/components/media/PortraitVideoPlayer";

import { shopifyFetch } from "@/lib/shopify";
import type { ExhibitionCard } from "@/lib/exhibitions";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";
import { isGroupShow } from "@/lib/exhibitions";
import { extractLongCopy } from "@/lib/extractLongCopy"; // ← helper that picks/normalises long text
import { isDraftStatus } from "@/lib/isDraftStatus";

export const revalidate = 60;
export const dynamic = "force-static";

// Query only what we actually need (keeps response small and fast).
const QUERY = /* GraphQL */ `
  query ExhibitionForHero(
    $handle: MetaobjectHandleInput!
    $firstProducts: Int = 80
    $mfNamespace: String = "custom"
    $mfKey: String = "exhibitions"
  ) {
    metaobject(handle: $handle) {
      handle
      fields {
        key
        type
        value
        reference {
          __typename
          ... on MediaImage {
            image {
              url
              width
              height
              altText
            }
          }
          ... on GenericFile {
            url
            previewImage {
              url
            }
          }
          ... on Video {
            sources {
              url
              mimeType
            }
            previewImage {
              url
              width
              height
              altText
            }
          }
          ... on Metaobject {
            handle
            type
            fields {
              key
              type
              value
              reference {
                __typename
                ... on MediaImage { image { url width height altText } }
                ... on GenericFile { url previewImage { url } }
                ... on Video {
                  sources { url mimeType }
                  previewImage { url }
                }
              }
              references(first: 50) {
                nodes {
                  __typename
                  ... on MediaImage { image { url width height altText } }
                  ... on GenericFile { url previewImage { url } }
                  ... on Video {
                    sources { url mimeType }
                    previewImage { url }
                  }
                }
              }
            }
          }
        }
        references(first: 50) {
          nodes {
            __typename
            ... on MediaImage {
              image { url width height altText }
            }
            ... on GenericFile {
              url
              previewImage { url }
            }
            ... on Video {
              sources { url mimeType }
              previewImage { url }
            }
            ... on Metaobject { handle type }
          }
        }
      }
    }

    products(first: $firstProducts, query: "status:active") {
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        featuredImage { url width height altText }
        metafield(namespace: $mfNamespace, key: $mfKey) {
          references(first: 50) {
            nodes {
              __typename
              ... on Metaobject { handle type }
            }
          }
        }
        year: metafield(namespace: "custom", key: "year") { value }
        medium: metafield(namespace: "custom", key: "medium") { value }
        dimensions: metafield(namespace: "custom", key: "dimensions") { value }
        artistName: metafield(namespace: "custom", key: "artist") { value }
        sold: metafield(namespace: "custom", key: "sold") { value }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;

// --------------------------- Types matching the query --------------------------
type FieldRef =
  | {
      __typename: "MediaImage";
      image?: {
        url: string;
        width: number;
        height: number;
        altText: string | null;
      };
    }
  | {
      __typename: "GenericFile";
      url?: string;
      previewImage?: { url: string | null } | null;
    }
  | {
      __typename: "Video";
      sources?: Array<{ url: string; mimeType?: string | null } | null> | null;
      previewImage?: {
        url: string | null;
        width?: number | null;
        height?: number | null;
        altText?: string | null;
      } | null;
    }
  | {
      __typename: "Metaobject";
      handle?: string;
      type?: string;
      fields?: Field[];
    }
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: unknown;
  reference: FieldRef | null;
  references?: { nodes: FieldRef[] } | FieldRef[] | null;
};
type Node = { handle: string; fields: Field[] };
type Product = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  featuredImage?: { url: string; width?: number; height?: number; altText?: string | null } | null;
  metafield?: {
    references?: { nodes?: Array<{ __typename: string; handle?: string; type?: string } | null> | null } | null;
  } | null;
  year?: { value?: string | null } | null;
  medium?: { value?: string | null } | null;
  dimensions?: { value?: string | null } | null;
  artistName?: { value?: string | null } | null;
  sold?: { value?: string | null } | null;
  priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } | null } | null;
};

// ---------------------- Safe readers for metaobject fields --------------------
/** Returns the first non-empty string value among the provided keys. */
function text(fields: Field[], ...keys: string[]) {
  for (const k of keys) {
    const f = fields.find((x) => x.key === k);
    const v = f?.value;
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object") {
      const anyv: any = v;
      if (typeof anyv.value === "string" && anyv.value.trim())
        return anyv.value.trim();
      if (typeof anyv.text === "string" && anyv.text.trim())
        return anyv.text.trim();
    }
  }
}

/** Parse ISO/date-ish string → Date (or undefined if invalid). */
function asDate(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Resolve an image from either MediaImage.image or GenericFile.previewImage. */
function img(fields: Field[], key: string) {
  const f = fields.find((x) => x.key === key);
  if (!f) return undefined;

  // Metaobject field referencing a MediaImage
  const mediaUrl = (f.reference as any)?.image?.url;
  if (mediaUrl) {
    return {
      url: mediaUrl as string,
      width: (f.reference as any)?.image?.width,
      height: (f.reference as any)?.image?.height,
      alt: (f.reference as any)?.image?.altText || "",
    };
  }

  // GenericFile with a preview image
  const previewUrl = (f.reference as any)?.previewImage?.url;
  if (previewUrl) return { url: previewUrl as string, alt: "" };
}

/** Build the card shape your hero already expects (keeps things consistent). */
function toCard(n: Node): ExhibitionCard {
  const f = n.fields;
  return {
    handle: n.handle,
    title: text(f, "title", "name") ?? n.handle,
    artist: text(f, "artist", "artists", "artistName"),
    location: text(f, "address", "location", "subtitle"),
    openingInfo: text(f, "opening_info", "openinginfo", "openingInfo"),
    start: asDate(text(f, "startDate", "startdate", "start")),
    end: asDate(text(f, "endDate", "enddate", "end")),
    summary: text(
      f,
      "short_text",
      "short-text",
      "shortText",
      "summary",
      "teaser",
      "description"
    ),
    // Same fallback chain as home so the hero stays in sync.
    hero:
      img(f, "heroImage") ??
      img(f, "heroimage") ??
      img(f, "coverimage") ??
      img(f, "coverImage"),
    variant: text(f, "variant"),
    status: text(f, "status", "state") ?? null,
  };
}

/** Inclusive end-of-day phase label derived ONLY from dates. */
function labelFromDates(start?: Date, end?: Date): PickHeroLabel {
  const nowMs = Date.now();

  const startDay =
    start !== undefined
      ? new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        ).getTime()
      : undefined;

  const endDay =
    end !== undefined
      ? new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate(),
          23,
          59,
          59,
          999
        ).getTime()
      : undefined;

  if (startDay !== undefined && nowMs < startDay) return "UPCOMING EXHIBITION";
  if (endDay !== undefined && nowMs > endDay) return "PAST EXHIBITION";
  return "CURRENT EXHIBITION";
}

// ----------------------- Extra readers for detail sections --------------------
function imageFromField(f: Field) {
  const ref: any = f.reference;
  if (ref?.image?.url) {
    return {
      url: ref.image.url as string,
      width: ref.image.width as number | undefined,
      height: ref.image.height as number | undefined,
      alt: ref.image.altText ?? undefined,
    };
  }
  if (ref?.previewImage?.url) return { url: ref.previewImage.url as string };
  if (ref?.url && typeof ref.url === "string" && ref.url.startsWith("http"))
    return { url: ref.url as string };
  if (typeof f.value === "string" && f.value.startsWith("http"))
    return { url: f.value };
}

function isProbablyVideo(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
}

function videoFromField(f?: Field): PortraitVideoSource | undefined {
  if (!f) return undefined;
  const ref: any = f.reference;

  if (ref?.__typename === "Video" && Array.isArray(ref.sources)) {
    const source = ref.sources.find((item: any) => item?.url);
    if (source?.url) {
      return {
        url: source.url as string,
        mimeType: source.mimeType ?? undefined,
        poster: ref.previewImage?.url
          ? {
              url: ref.previewImage.url as string,
              width:
                typeof ref.previewImage.width === "number"
                  ? (ref.previewImage.width as number)
                  : undefined,
              height:
                typeof ref.previewImage.height === "number"
                  ? (ref.previewImage.height as number)
                  : undefined,
              alt: ref.previewImage.altText ?? undefined,
            }
          : undefined,
      };
    }
  }

  if (ref?.__typename === "GenericFile") {
    const candidate =
      (typeof ref.url === "string" && ref.url) ||
      (typeof f.value === "string" && f.value.startsWith("http") ? f.value : null);
    if (candidate && isProbablyVideo(candidate)) {
      return {
        url: candidate,
        poster: ref.previewImage?.url
          ? {
              url: ref.previewImage.url as string,
            }
          : undefined,
      };
    }
  }

  if (typeof f.value === "string" && f.value.startsWith("http") && isProbablyVideo(f.value)) {
    return { url: f.value };
  }

  return undefined;
}

function imageFromRefNode(ref: any) {
  if (ref?.image?.url) {
    return {
      url: ref.image.url as string,
      width: ref.image.width as number | undefined,
      height: ref.image.height as number | undefined,
      alt: ref.image.altText ?? undefined,
    };
  }
  if (ref?.previewImage?.url) return { url: ref.previewImage.url as string };
  if (ref?.url && typeof ref.url === "string") return { url: ref.url as string };
  // If a Metaobject has an image-like field, try to derive the first image
  if (ref?.__typename === "Metaobject" && Array.isArray(ref.fields)) {
    // Only accept the explicit key used in your schema
    const imgField = (ref.fields as any[]).find((f: any) => f?.key === "portrait");
    if (imgField) return imageFromField(imgField as any);
  }
}

function collectInstallationImages(fields: Field[]) {
  // Prefer explicit list field: installShots (list of files or images)
  const install = fields.find((f) => /installshots/i.test(f.key));
  if (install?.references) {
    const nodes = Array.isArray((install.references as any)?.nodes)
      ? (install.references as any).nodes
      : Array.isArray(install.references)
      ? (install.references as any)
      : [];
    const fromList = nodes
      .map((r: any) => imageFromRefNode(r))
      .filter((x: any) => x && x.url);
    if (fromList.length) return fromList as any[];
  }

  // Fallback: any field that looks like installation imagery
  const images = fields
    .filter((f) => /install|installation|view|instal/i.test(f.key) && !/hero|cover/i.test(f.key))
    .map((f) => imageFromField(f))
    .filter((x): x is { url: string; width?: number; height?: number; alt?: string } => Boolean(x));
  return images;
}

function toString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const anyv: any = v;
    if (typeof anyv.text === "string") return anyv.text;
    if (typeof anyv.value === "string") return anyv.value;
  }
}

function collectFeaturedWorks(fields: Field[]): WorkItem[] {
  // Group by numeric suffix: work_1_image, work_1_title, etc.
  const groups = new Map<number, WorkItem & { _hasAny?: boolean }>();
  const re = /^(?:work|works|featuredwork|featured_work)[-_]?(\d+)[-_]?([a-z_]+)$/i;
  for (const f of fields) {
    const m = f.key.match(re);
    if (!m) continue;
    const idx = Number(m[1]);
    const prop = m[2].toLowerCase();
    const g = groups.get(idx) ?? {};

    if (prop.includes("image")) {
      const im = imageFromField(f);
      if (im) g.image = im;
    } else if (prop.includes("title") || prop === "name") {
      g.title = toString(f.value);
    } else if (prop.includes("year")) {
      g.year = toString(f.value);
    } else if (prop.includes("medium")) {
      g.medium = toString(f.value);
    } else if (prop.includes("dimension")) {
      g.dimensions = toString(f.value);
    } else if (prop.includes("caption")) {
      g.caption = toString(f.value);
    } else if (prop === "link" || prop === "url") {
      g.link = toString(f.value);
    }
    g._hasAny = true;
    groups.set(idx, g);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => {
      const { _hasAny, ...rest } = v as any;
      return rest as WorkItem;
    })
    .filter((w) => Boolean(w.image));
}

function collectFeaturedWorksFromProducts(
  products: Product[] | undefined,
  exhibitionHandle: string,
  fallbackArtist?: string | null
) {
  if (!products?.length) return [] as WorkItem[];

  const items: WorkItem[] = [];
  for (const p of products) {
    // filter: only products whose exhibitions metafield references this exhibition handle
    const refs = p?.metafield?.references?.nodes ?? [];
    const hasRef = refs?.some((r: any) => r?.__typename === "Metaobject" && r?.handle === exhibitionHandle);
    if (!hasRef) continue;

    // only show published/active products — Storefront shows only published; use availableForSale as a hint
    // You can remove this check if you want to display all regardless of inventory
    // if (!p.availableForSale) continue;

    const soldFlag = String(p.sold?.value ?? "").toLowerCase().trim();
    const isSold = soldFlag === "true" || soldFlag === "1" || soldFlag === "yes" || p.availableForSale === false;
    const price = p.priceRange?.minVariantPrice
      ? { amount: p.priceRange.minVariantPrice.amount, currencyCode: p.priceRange.minVariantPrice.currencyCode }
      : undefined;

    items.push({
      image: p.featuredImage ? { url: p.featuredImage.url, width: p.featuredImage.width, height: p.featuredImage.height, alt: p.featuredImage.altText ?? undefined } : undefined,
      title: p.title,
      year: p.year?.value ?? undefined,
      medium: p.medium?.value ?? undefined,
      dimensions: p.dimensions?.value ?? undefined,
      artist: p.artistName?.value ?? p.vendor ?? fallbackArtist ?? undefined,
      sold: isSold,
      price,
      // Link: if you add a product route later, use `/products/${p.handle}`
      // link: `/products/${p.handle}`,
    });
  }
  return items;
}

function extractArtistRef(fields: Field[]) {
  const norm = (s: string) => s.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const f = fields.find((x) => norm(x.key) === "artistref");
  if (!f) return null;
  const ref: any = f.reference;
  if (ref && ref.__typename === "Metaobject") return ref as { handle?: string; fields?: Field[] };
  const nodes: any[] = (f as any)?.references?.nodes ?? [];
  const first = nodes.find((n) => n && n.__typename === "Metaobject");
  return first || null;
}

type ArtistCandidate = {
  handle?: string | null;
  name?: string | null;
  fields?: Field[] | null;
  represented?: boolean | null;
};

function coerceStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object") {
    const anyValue: any = value;
    if (typeof anyValue.value === "string") return anyValue.value;
    if (typeof anyValue.text === "string") return anyValue.text;
  }
  return undefined;
}

function extractRepresentedFlag(
  fields: Field[] | null | undefined
): boolean | null {
  if (!fields?.length) return null;
  const entry = fields.find(
    (field) => field.key.toLowerCase() === "represented"
  );
  const raw = entry ? coerceStringValue(entry.value) : undefined;
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;
  if (["true", "1", "yes", "y"].includes(lower)) return true;
  if (["false", "0", "no", "n"].includes(lower)) return false;
  return null;
}

function isLikelyArtistName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower === "group exhibition" || lower === "group show") return false;
  if (trimmed.includes("gid://")) return false;
  if (/^\[[\s\S]*gid:\/\//i.test(trimmed)) return false;
  return true;
}

function splitArtistNames(value: unknown): string[] {
  const raw = coerceStringValue(value);
  if (!raw) return [];
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.replace(/^[•*\-]+\s*/, "").trim())
    .filter((part) => part && isLikelyArtistName(part));
}

function collectArtistCandidates(fields: Field[]): ArtistCandidate[] {
  const visit = (list: Field[], depth = 0): ArtistCandidate[] => {
    if (!Array.isArray(list) || !list.length) return [];
    if (depth > 3) return [];
    const bucket: ArtistCandidate[] = [];

    for (const field of list) {
      if (!field?.key) continue;
      const keyLower = field.key.toLowerCase();
      const isArtistish = keyLower.includes("artist") || keyLower.includes("member");
      if (!isArtistish) continue;

      for (const name of splitArtistNames(field.value)) {
        bucket.push({ name });
      }

      const ref = field.reference;
      if (ref && ref.__typename === "Metaobject") {
        const handle = ref.handle ?? null;
        let name: string | null = null;
        const refFields = Array.isArray((ref as any).fields)
          ? ((ref as any).fields as Field[])
          : null;
        const represented = extractRepresentedFlag(refFields);
        if (refFields?.length) {
          name =
            text(refFields, "name", "title") ??
            text(refFields, "full_name", "fullName", "label") ??
            null;
          bucket.push(...visit(refFields, depth + 1));
        }
        bucket.push({ handle, name, represented });
      }

      const referencesAny = field.references as any;
      const nodes: FieldRef[] = Array.isArray(referencesAny?.nodes)
        ? (referencesAny.nodes as FieldRef[])
        : Array.isArray(referencesAny)
        ? (referencesAny as FieldRef[])
        : [];
      for (const node of nodes) {
        if (node?.__typename === "Metaobject") {
          const meta = node as { handle?: string | null; type?: string | null; fields?: Field[] };
          bucket.push({
            handle: meta.handle ?? null,
            name: null,
            represented: extractRepresentedFlag(
              (meta as any)?.fields as Field[] | undefined
            ),
          });
          if (Array.isArray((meta as any)?.fields)) {
            bucket.push(...visit((meta as any).fields as Field[], depth + 1));
          }
        }
      }

      const nested = metaobjectFieldsForField(field);
      if (nested?.length) {
        bucket.push(...visit(nested, depth + 1));
      }
    }

    return bucket;
  };

  return visit(fields, 0);
}

function prettifyHandle(handle: string | null | undefined): string {
  if (!handle) return "";
  return handle
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

async function resolveGroupArtists(fields: Field[]): Promise<
  Array<{ name: string; handle?: string | null; represented?: boolean }>
> {
  const candidates = collectArtistCandidates(fields);
  const resolved: Array<{ name: string; handle?: string | null; represented?: boolean }> = [];
  const indexByHandle = new Map<string, number>();
  const indexByName = new Map<string, number>();
  const pendingHandles = new Map<string, { handle: string; represented?: boolean }>();

  const push = (name: string, handle?: string | null, represented?: boolean | null) => {
    const trimmed = name.trim();
    if (!trimmed || !isLikelyArtistName(trimmed)) return;
    const handleTrimmed = handle?.trim() ?? null;
    const handleKey = handleTrimmed ? handleTrimmed.toLowerCase() : null;
    const nameKey = trimmed.toLowerCase();

    if (handleKey) {
      const existingByHandle = indexByHandle.get(handleKey);
      if (existingByHandle !== undefined) {
        const existing = resolved[existingByHandle];
        if (!existing.name) existing.name = trimmed;
        if (!existing.handle) existing.handle = handleTrimmed;
        if (represented !== null && represented !== undefined) {
          existing.represented = represented;
        }
        return;
      }

      const existingByName = indexByName.get(nameKey);
      if (existingByName !== undefined) {
        const existing = resolved[existingByName];
        if (!existing.handle) existing.handle = handleTrimmed;
        if (represented !== null && represented !== undefined) {
          existing.represented = represented;
        }
        indexByHandle.set(handleKey, existingByName);
        if (!existing.name) existing.name = trimmed;
        return;
      }

      const entry = {
        name: trimmed,
        handle: handleTrimmed,
        represented: represented ?? undefined,
      };
      const idx = resolved.length;
      resolved.push(entry);
      indexByHandle.set(handleKey, idx);
      indexByName.set(nameKey, idx);
      return;
    }

    if (indexByName.has(nameKey)) return;
    const entry = { name: trimmed } as {
      name: string;
      handle?: string | null;
      represented?: boolean;
    };
    const idx = resolved.length;
    resolved.push(entry);
    indexByName.set(nameKey, idx);
  };

  for (const candidate of candidates) {
    const name = candidate.name?.trim();
    const handle = candidate.handle?.trim() ?? null;
    const represented =
      candidate.represented !== undefined && candidate.represented !== null
        ? Boolean(candidate.represented)
        : undefined;
    if (name) {
      push(name, handle, represented ?? null);
    } else if (handle) {
      const handleKey = handle.toLowerCase();
      if (!indexByHandle.has(handleKey)) {
        const existingPending = pendingHandles.get(handleKey);
        if (existingPending) {
          if (
            represented !== undefined &&
            existingPending.represented === undefined
          ) {
            existingPending.represented = represented;
          }
        } else {
          pendingHandles.set(handleKey, {
            handle,
            represented,
          });
        }
      }
    }
  }

  if (pendingHandles.size) {
    const results = await Promise.all(
      Array.from(pendingHandles.values()).map(async ({ handle, represented }) => {
        try {
          const data = await shopifyFetch<{ metaobject: Node | null }>(
            ARTIST_QUERY,
            { handle }
          );
          const meta = data?.metaobject;
          const name =
            meta?.fields
              ? text(meta.fields, "name", "title") ??
                text(meta.fields, "full_name", "fullName", "label") ??
                null
              : null;
          const representedFromFields = extractRepresentedFlag(meta?.fields ?? null);
          return { handle, name, represented: representedFromFields ?? represented };
        } catch (error) {
          console.warn("[exhibitions/[handle]] resolveGroupArtists fetch error", {
            handle,
            error,
          });
          return {
            handle,
            name: null as string | null,
            represented,
          };
        }
      })
    );

    for (const { handle, name, represented } of results) {
      const displayName = name?.trim() || prettifyHandle(handle);
      if (displayName) {
        push(displayName, handle, represented ?? null);
      }
    }
  }

  return resolved;
}

function firstPortraitFromFields(fields: Field[]) {
  const f = fieldByKeysCaseInsensitive(fields, ["portrait", "portrait_image", "portraitimage"]);
  return f ? imageFromField(f) : undefined;
}

function firstPortraitVideoFromFields(fields: Field[]) {
  const f = fieldByKeysCaseInsensitive(fields, ["video", "portrait_video", "artist_video"]);
  return f ? videoFromField(f) : undefined;
}

const HTML_TAG_REGEX = /<\s*[a-z][\s\S]*>/i;

function fieldByKeysCaseInsensitive(
  fields: Field[],
  keys: string[]
): Field | undefined {
  if (!keys.length) return undefined;
  const lower = keys.map((key) => key.toLowerCase());
  return fields.find((field) => lower.includes(field.key.toLowerCase()));
}

function metaobjectFieldsForField(field: Field): Field[] | null {
  const direct =
    field.reference && field.reference.__typename === "Metaobject"
      ? ((field.reference as any).fields as Field[] | undefined)
      : undefined;
  if (Array.isArray(direct) && direct.length) return direct;

  const referencesAny = field.references as any;
  const nodes: FieldRef[] = Array.isArray(referencesAny?.nodes)
    ? (referencesAny.nodes as FieldRef[])
    : Array.isArray(referencesAny)
    ? (referencesAny as FieldRef[])
    : [];

  for (const ref of nodes) {
    if (ref && ref.__typename === "Metaobject") {
      const fieldsArr = (ref as any).fields as Field[] | undefined;
      if (Array.isArray(fieldsArr) && fieldsArr.length) {
        return fieldsArr;
      }
    }
  }

  return null;
}

function paragraphsFromText(value: string) {
  return value
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => `<p>${segment.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function fieldContentToHtml(field: Field): string | null {
  const metaFields = metaobjectFieldsForField(field);
  if (metaFields?.length) {
    const fromMeta = extractLongCopy(metaFields as any);
    if (fromMeta) return fromMeta;
  }

  const fromSelf = extractLongCopy([field] as any);
  if (fromSelf) return fromSelf;

  if (typeof field.value === "string") {
    const trimmed = field.value.trim();
    if (!trimmed) return null;
    if (HTML_TAG_REGEX.test(trimmed)) return trimmed;
    const paragraphs = paragraphsFromText(trimmed);
    return paragraphs || `<p>${trimmed}</p>`;
  }

  return null;
}

function htmlFromFieldKeys(fields: Field[], keys: string[]) {
  const field = fieldByKeysCaseInsensitive(fields, keys);
  return field ? fieldContentToHtml(field) : null;
}

function extractBioHtmlFromArtistFields(fields: Field[]) {
  const shortBio = htmlFromFieldKeys(fields, [
    "short_bio",
    "shortbio",
    "bio_short",
    "shortBio",
    "bioShort",
  ]);
  if (shortBio) return shortBio;

  const mainBio = htmlFromFieldKeys(fields, [
    "bio",
    "long_bio",
    "bio_long",
    "biography",
    "bio_html",
  ]);
  if (mainBio) return mainBio;

  const fallback = fields.find((field) => /bio/i.test(field.key));
  return fallback ? fieldContentToHtml(fallback) : null;
}

// Fetch artist metaobject by handle (exact type: "artist")
const ARTIST_QUERY = /* GraphQL */ `
  query ArtistByHandle($handle: String!) {
    metaobject(handle: { type: "artist", handle: $handle }) {
      handle
      fields {
        key
        type
        value
        reference {
          __typename
          ... on MediaImage { image { url width height altText } }
          ... on GenericFile { url previewImage { url } }
          ... on Video {
            sources { url mimeType }
            previewImage { url width height altText }
          }
        }
        references(first: 50) {
          nodes {
            __typename
            ... on MediaImage { image { url width height altText } }
            ... on GenericFile { url previewImage { url } }
            ... on Video {
              sources { url mimeType }
              previewImage { url }
            }
          }
        }
      }
    }
  }
`;

const ARTIST_BY_ID_QUERY = /* GraphQL */ `
  query ArtistById($id: ID!) {
    node(id: $id) {
      __typename
      ... on Metaobject {
        handle
        fields {
          key
          type
          value
        reference {
          __typename
          ... on MediaImage { image { url width height altText } }
          ... on GenericFile { url previewImage { url } }
          ... on Video {
            sources { url mimeType }
            previewImage { url width height altText }
          }
        }
        references(first: 50) {
          nodes {
            __typename
            ... on MediaImage { image { url width height altText } }
            ... on GenericFile { url previewImage { url } }
            ... on Video {
              sources { url mimeType }
              previewImage { url }
            }
          }
        }
      }
    }
  }
  }
`;

// ----------------------------------- Page ------------------------------------
export default async function ExhibitionPage({
  params,
}: {
  params: { handle: string };
}) {
  console.log("[exhibitions/[handle]] params.handle=", params.handle);
  // 1) Fetch metaobject for this handle
  const data = await shopifyFetch<{
    metaobject: Node | null;
    products: { nodes: Product[] } | null;
  }>(QUERY, {
    handle: { type: "exhibitions", handle: params.handle },
    firstProducts: 80,
    mfNamespace: "custom",
    mfKey: "exhibitions",
  });
  const node = data?.metaobject;
  if (!node) return notFound();
  const statusField = node.fields.find(
    (field) => field.key.toLowerCase() === "status"
  );
  const statusValue =
    typeof statusField?.value === "string" ? statusField.value : undefined;
  if (isDraftStatus(statusValue)) return notFound();
  console.log(
    "[exhibitions/[handle]] loaded metaobject",
    node.handle,
    "fields:",
    node.fields?.length ?? 0
  );
  try {
    console.log(
      "[exhibitions/[handle]] exhibition field keys:",
      (node.fields || []).map((f:any) => ({
        key: f.key,
        type: f.type,
        ref: (f.reference as any)?.__typename || null,
        refs: Array.isArray((f.references as any)?.nodes)
          ? (f.references as any).nodes.map((n:any)=>n?.__typename)
          : null,
      }))
    );
    const arf = (node.fields || []).find((f:any)=>f.key === "artistRef");
    if (arf) {
      console.log("[exhibitions/[handle]] artistRef field present. singleRef=", Boolean((arf.reference as any)?.__typename), 
                  "listRefs=", Array.isArray((arf.references as any)?.nodes) ? (arf.references as any).nodes.length : 0);
    } else {
      console.log("[exhibitions/[handle]] artistRef field NOT present on exhibition");
    }
  } catch {}

  // 2) Build the hero card + phase labels
  const ex = toCard(node);
  if (isDraftStatus(ex.status)) return notFound();
  const { top, button } = heroLabels(labelFromDates(ex.start, ex.end));
  console.log("[exhibitions/[handle]] ex.title=", ex.title, 
              "artist=", ex.artist, 
              "isGroup=", isGroupShow(ex),
              "dates=", ex.start, ex.end);

  // 3) Pick/normalise the long copy (main text) from fields by TYPE (not name)
  //    - Prefers `rich_text` (converted to HTML)
  //    - Else any HTML-like value
  //    - Else the longest multi-line field as paragraphs
  const longTextHtml = extractLongCopy(node.fields as any);
  const richFieldsDebug = (node.fields as any[])
    .filter((f) => typeof f?.type === "string" && /rich/i.test(f.type || ""))
    .map((f) => ({
      key: f?.key,
      type: f?.type,
      hasValue: Boolean(f?.value),
    }));
  console.log("[exhibitions/[handle]] copy debug", {
    shortLen: ex.summary ? ex.summary.length : 0,
    shortSample: ex.summary ? ex.summary.slice(0, 120) : null,
    longLen: longTextHtml ? longTextHtml.length : 0,
    longSample: longTextHtml ? longTextHtml.slice(0, 160) : null,
    richFields: richFieldsDebug,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[exhibitions/[handle]] longTextHtml raw ->", longTextHtml);
  }

  // 3b) Additional sections
  const installationImages = collectInstallationImages(node.fields);
  console.log("[exhibitions/[handle]] install images:", installationImages.length);
  const artistRef = extractArtistRef(node.fields);
  console.log(
    "[exhibitions/[handle]] artistRef found:", Boolean(artistRef),
    artistRef ? { handle: (artistRef as any).handle } : null
  );

  let artistFields = (artistRef?.fields as Field[]) ?? [];
  let artistHandle: string | null = (artistRef as any)?.handle ?? null;
  // Try to derive handle from list refs or raw value if missing
  const arfField: any = (node.fields || []).find((f: any) => (f?.key || "").replace(/[^a-z0-9]/gi, "").toLowerCase() === "artistref");
  if (!artistHandle && arfField && Array.isArray(arfField?.references?.nodes)) {
    const firstNode = arfField.references.nodes.find((n: any) => n?.__typename === "Metaobject");
    artistHandle = firstNode?.handle ?? artistHandle;
  }
  if (!artistHandle && typeof arfField?.value === "string" && arfField.value.trim()) {
    artistHandle = arfField.value.trim();
  }

  if (artistFields?.length) {
    try {
      console.log("[exhibitions/[handle]] artist fields keys:", artistFields.map((f:any)=>f.key));
    } catch {}
  } else if (artistHandle) {
    try {
      if (/^gid:\/\//.test(artistHandle)) {
        const dataById = await shopifyFetch<{ node: Node | null }>(ARTIST_BY_ID_QUERY, { id: artistHandle });
        const mo = (dataById as any)?.node ?? null;
        if (mo && (mo as any).fields) {
          artistFields = (mo as any).fields as any;
          artistHandle = (mo as any).handle ?? artistHandle;
          console.log("[exhibitions/[handle]] fetched artist by id:", artistHandle, "fields:", artistFields.length);
        } else {
          console.log("[exhibitions/[handle]] artist id fetch returned null for:", artistHandle);
        }
      } else {
        const dataArtist = await shopifyFetch<{ metaobject: Node | null }>(ARTIST_QUERY, { handle: artistHandle });
        if (dataArtist?.metaobject) {
          artistFields = dataArtist.metaobject.fields;
          artistHandle = dataArtist.metaobject.handle;
          console.log("[exhibitions/[handle]] fetched artist by handle:", artistHandle, "fields:", artistFields.length);
        } else {
          console.log("[exhibitions/[handle]] artist handle resolved but fetch returned null:", artistHandle);
        }
      }
    } catch (e) {
      console.log("[exhibitions/[handle]] fetch artist by handle failed:", artistHandle, e);
    }
  }
  const artistName = text(artistFields as any, "name", "title") ?? ex.artist ?? undefined;
  const portrait = artistFields.length ? firstPortraitFromFields(artistFields as any) : undefined;
  const portraitVideo = artistFields.length
    ? firstPortraitVideoFromFields(artistFields as any)
    : undefined;
  const artistBioHtml = artistFields.length ? extractBioHtmlFromArtistFields(artistFields as any) : null;
  console.log(
    "[exhibitions/[handle]] artist",
    {
      artistHandle,
      artistName,
      hasPortrait: Boolean(portrait),
      hasVideo: Boolean(portraitVideo),
      hasBio: Boolean(artistBioHtml),
      bioLen: artistBioHtml?.length,
    }
  );

  const groupArtists = isGroupShow(ex)
    ? await resolveGroupArtists(node.fields)
    : [];

  const detailsSectionId = "exhibition-details";

  // 4) Render page blocks
  return (
    <>
      <CurrentExhibitionHero
        ex={ex}
        topLabel={top}
        buttonLabel={button}
        showCta={false}
        scrollTargetId={detailsSectionId}
      />

      <Details
        id={detailsSectionId}
        startDate={ex.start}
        endDate={ex.end}
        location={ex.location}
        openingInfo={ex.openingInfo ?? null}
        shortText={ex.summary ?? null}
        longTextHtml={longTextHtml}
        artists={
          groupArtists.length
            ? groupArtists.map((artist) => {
                const represented = artist.represented === true;
                return {
                  name: artist.name,
                  href:
                    represented && artist.handle
                      ? `/artists/${artist.handle}`
                      : undefined,
                  represented,
                };
              })
            : undefined
        }
      />

      {/* Installation Views */}
      {installationImages.length > 0 && (
        <InstallationViews images={installationImages} />
      )}

      {/* Featured Works */}
      <FeaturedWorks exhibitionHandle={node.handle} fallbackArtist={ex.artist ?? null} />

      {/* About the Artist (suppressed for group shows) */}
      {!isGroupShow(ex) && (artistBioHtml || portrait || portraitVideo) && (
        <AboutArtistWithPortrait
          name={artistName}
          bioHtml={artistBioHtml}
          handle={artistHandle}
          portrait={portrait ?? null}
          portraitVideo={portraitVideo ?? null}
        />
      )}
    </>
  );
}
