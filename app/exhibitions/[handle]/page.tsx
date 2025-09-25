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

import { shopifyFetch } from "@/lib/shopify";
import type { ExhibitionCard } from "@/lib/exhibitions";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";
import { isGroupShow } from "@/lib/exhibitions";
import { extractLongCopy } from "@/lib/extractLongCopy"; // ← helper that picks/normalises long text

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
              }
              references(first: 50) {
                nodes {
                  __typename
                  ... on MediaImage { image { url width height altText } }
                  ... on GenericFile { url previewImage { url } }
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
    location: text(f, "location", "subtitle"),
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

function firstPortraitFromFields(fields: Field[]) {
  const f = fields.find((x) => x.key === "portrait");
  return f ? imageFromField(f) : undefined;
}

function extractBioHtmlFromArtistFields(fields: Field[]) {
  const bio = fields.find((x) => x.key === "bio");
  return bio ? extractLongCopy([bio] as any) : null;
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
        }
        references(first: 50) {
          nodes {
            __typename
            ... on MediaImage { image { url width height altText } }
            ... on GenericFile { url previewImage { url } }
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
          }
          references(first: 50) {
            nodes {
              __typename
              ... on MediaImage { image { url width height altText } }
              ... on GenericFile { url previewImage { url } }
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
  console.log("[exhibitions/[handle]] longTextHtml?", Boolean(longTextHtml), longTextHtml ? (longTextHtml.length + " chars") : "");

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
  const artistBioHtml = artistFields.length ? extractBioHtmlFromArtistFields(artistFields as any) : null;
  console.log(
    "[exhibitions/[handle]] artist",
    { artistHandle, artistName, hasPortrait: Boolean(portrait), hasBio: Boolean(artistBioHtml), bioLen: artistBioHtml?.length }
  );

  // 4) Render page blocks
  return (
    <>
      <CurrentExhibitionHero ex={ex} topLabel={top} buttonLabel={button} />

      <Details
        startDate={ex.start}
        endDate={ex.end}
        location={ex.location}
        longTextHtml={longTextHtml}
      />

      {/* Installation Views */}
      {installationImages.length > 0 && (
        <InstallationViews images={installationImages} />
      )}

      {/* Featured Works */}
      <FeaturedWorks exhibitionHandle={node.handle} fallbackArtist={ex.artist ?? null} />

      {/* About the Artist (suppressed for group shows) */}
      {!isGroupShow(ex) && (artistBioHtml || portrait) && (
        <AboutArtistWithPortrait
          name={artistName}
          bioHtml={artistBioHtml}
          handle={artistHandle}
          portrait={portrait ?? null}
        />
      )}
    </>
  );
}
