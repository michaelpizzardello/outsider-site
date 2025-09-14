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

import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import CurrentExhibitionHero from "@/components/CurrentExhibitionHero";
import Details from "@/components/exhibition/Details";

import { shopifyFetch } from "@/lib/shopify";
import type { ExhibitionCard } from "@/lib/exhibitions";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";
import { extractLongCopy } from "@/lib/extractLongCopy"; // ← helper that picks/normalises long text

export const revalidate = 60;
export const dynamic = "force-static";

// Query only what we actually need (keeps response small and fast).
const QUERY = /* GraphQL */ `
  query ExhibitionForHero($handle: MetaobjectHandleInput!) {
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
        }
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
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: unknown;
  reference: FieldRef | null;
};
type Node = { handle: string; fields: Field[] };

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

// ----------------------------------- Page ------------------------------------
export default async function ExhibitionPage({
  params,
}: {
  params: { handle: string };
}) {
  // 1) Fetch metaobject for this handle
  const data = await shopifyFetch<{ metaobject: Node | null }>(QUERY, {
    handle: { type: "exhibitions", handle: params.handle },
  });
  const node = data?.metaobject;
  if (!node) return notFound();

  // 2) Build the hero card + phase labels
  const ex = toCard(node);
  const { top, button } = heroLabels(labelFromDates(ex.start, ex.end));

  // 3) Pick/normalise the long copy (main text) from fields by TYPE (not name)
  //    - Prefers `rich_text` (converted to HTML)
  //    - Else any HTML-like value
  //    - Else the longest multi-line field as paragraphs
  const longTextHtml = extractLongCopy(node.fields as any);

  // 4) Render page blocks
  return (
    <>
      <Header overlay />

      <CurrentExhibitionHero ex={ex} topLabel={top} buttonLabel={button} />

      <Details
        startDate={ex.start}
        endDate={ex.end}
        location={ex.location}
        longTextHtml={longTextHtml}
      />

      <SiteFooter />
    </>
  );
}
