// app/exhibitions/[handle]/page.tsx
import "server-only";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import CurrentExhibitionHero from "@/components/CurrentExhibitionHero";
import { shopifyFetch } from "@/lib/shopify";
import type { ExhibitionCard } from "@/lib/exhibitions";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";
import Details from "@/components/exhibition/Details";

export const revalidate = 60;
export const dynamic = "force-static";

// SAME field shape your home hero relies on
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

function asDate(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function img(fields: Field[], key: string) {
  const f = fields.find((x) => x.key === key);
  if (!f) return undefined;
  const m = (f.reference as any)?.image?.url;
  if (m) {
    return {
      url: m as string,
      width: (f.reference as any)?.image?.width,
      height: (f.reference as any)?.image?.height,
      alt: (f.reference as any)?.image?.altText || "",
    };
  }
  const g = (f.reference as any)?.previewImage?.url;
  if (g) return { url: g as string, alt: "" };
}

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
    // EXACT same fallback order as on home:
    hero:
      img(f, "heroImage") ??
      img(f, "heroimage") ??
      img(f, "coverimage") ??
      img(f, "coverImage"),
  };
}

function labelFromDates(start?: Date, end?: Date): PickHeroLabel {
  const now = new Date();
  // Treat end as inclusive through end-of-day
  const startDay = start
    ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
    : undefined;
  const endDay = end
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
  const nowMs = now.getTime();

  if (startDay !== undefined && nowMs < startDay) return "UPCOMING EXHIBITION";
  if (endDay !== undefined && nowMs > endDay) return "PAST EXHIBITION";
  return "CURRENT EXHIBITION";
}

export default async function ExhibitionPage({
  params,
}: {
  params: { handle: string };
}) {
  const data = await shopifyFetch<{ metaobject: Node | null }>(QUERY, {
    handle: { type: "exhibitions", handle: params.handle },
  });
  const node = data?.metaobject;
  if (!node) return notFound();

  const ex = toCard(node);
  const { top, button } = heroLabels(labelFromDates(ex.start, ex.end));

  return (
    <>
      <Header overlay />
      <CurrentExhibitionHero ex={ex} topLabel={top} buttonLabel={button} />
      <Details
        startDate={ex.start}
        endDate={ex.end}
        location={ex.location}
        longTextHtml={ex.longTextHtml}
      />

      <SiteFooter />
    </>
  );
}
