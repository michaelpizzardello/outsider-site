import "server-only";

import Image from "next/image";
import Link from "next/link";

import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import Container from "@/components/layout/Container";
import { shopifyFetch } from "@/lib/shopify";
import { headingParts, formatDates, type ExhibitionCard } from "@/lib/exhibitions";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";

type FieldRef =
  | {
      __typename: "MediaImage";
      image?: { url: string; width: number; height: number; altText: string | null } | null;
    }
  | { __typename: "GenericFile"; url?: string | null; previewImage?: { url: string | null } | null }
  | { __typename: "Metaobject"; handle?: string | null; type?: string | null }
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: unknown;
  reference: FieldRef | null;
  references?: { nodes?: FieldRef[] | null } | null;
};

type Node = {
  handle: string;
  fields: Field[];
};

type QueryResult = {
  metaobjects: { nodes: Node[] } | null;
};

type Props = {
  artistHandle: string;
  artistName: string;
};

const QUERY = /* GraphQL */ `
  query ArtistExhibitions($first: Int = 40) {
    metaobjects(type: "exhibitions", first: $first, reverse: true) {
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
            ... on Metaobject { handle type }
          }
          references(first: 20) {
            nodes {
              __typename
              ... on Metaobject { handle type }
            }
          }
        }
      }
    }
  }
`;

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const anyValue: any = value;
    if (typeof anyValue.value === "string") return anyValue.value;
    if (typeof anyValue.text === "string") return anyValue.text;
  }
  return undefined;
}

function text(fields: Field[], ...keys: string[]): string | undefined {
  for (const key of keys) {
    const field = fields.find((f) => f.key === key);
    if (!field) continue;
    const value = coerceString(field.value)?.trim();
    if (value) return value;
  }
  return undefined;
}

function imageFromFields(fields: Field[], ...keys: string[]) {
  for (const key of keys) {
    const field = fields.find((f) => f.key === key);
    if (!field) continue;
    const ref = field.reference;
    if (ref && ref.__typename === "MediaImage" && ref.image?.url) {
      return {
        url: ref.image.url,
        width: ref.image.width,
        height: ref.image.height,
        alt: ref.image.altText ?? undefined,
      };
    }
    if (ref && ref.__typename === "GenericFile") {
      if (ref.url) return { url: ref.url };
      if (ref.previewImage?.url) return { url: ref.previewImage.url };
    }
    const url = coerceString(field.value);
    if (url?.startsWith("http")) return { url };
  }
  return undefined;
}

function toDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

type ExhibitionWithRefs = ExhibitionCard & {
  artistHandles: string[];
  artistSearchText: string;
};

function mapNode(node: Node): ExhibitionWithRefs {
  const fields = node.fields;
  const title = text(fields, "title", "name") ?? node.handle;
  const artist = text(fields, "artist", "artists", "artistName");
  const location = text(fields, "location", "subtitle");
  const summary = text(fields, "short_text", "short-text", "shortText", "summary", "teaser");
  const start = toDate(text(fields, "startDate", "startdate", "start"));
  const end = toDate(text(fields, "endDate", "enddate", "end"));
  const hero =
    imageFromFields(fields, "heroImage") ??
    imageFromFields(fields, "heroimage") ??
    imageFromFields(fields, "coverimage") ??
    imageFromFields(fields, "coverImage");

  const groupFlagRaw = text(fields, "is_group", "isGroup");
  const isGroup = groupFlagRaw ? groupFlagRaw.trim().toLowerCase() === "true" : undefined;

  const artistHandles = new Set<string>();
  const pushHandle = (handle?: string | null) => {
    if (!handle) return;
    artistHandles.add(handle.trim().toLowerCase());
  };

  for (const field of fields) {
    if (!field?.key) continue;
    const keyLower = field.key.toLowerCase();
    if (!keyLower.includes("artist")) continue;

    const ref = field.reference;
    if (ref?.__typename === "Metaobject") pushHandle(ref.handle);

    const nodes = field.references?.nodes || [];
    for (const n of nodes ?? []) {
      if (n?.__typename === "Metaobject") pushHandle((n as any).handle);
    }
  }

  return {
    handle: node.handle,
    title,
    artist,
    location,
    start,
    end,
    summary,
    hero,
    isGroup,
    artistHandles: Array.from(artistHandles),
    artistSearchText: [artist, title]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase())
      .join(" | "),
  };
}

function statusFor(ex: ExhibitionCard): PickHeroLabel {
  const now = Date.now();
  const start = ex.start?.getTime();
  const end = ex.end?.getTime();
  if (start !== undefined && start <= now && (end === undefined || end >= now)) {
    return "CURRENT EXHIBITION";
  }
  if (start !== undefined && start > now) return "UPCOMING EXHIBITION";
  return "PAST EXHIBITION";
}

export default async function ArtistExhibitions({ artistHandle, artistName }: Props) {
  const data = await shopifyFetch<QueryResult>(QUERY, { first: 40 });
  const nodes = data.metaobjects?.nodes ?? [];
  if (!nodes.length) return null;

  const targetHandle = artistHandle.trim().toLowerCase();
  const targetName = artistName.trim().toLowerCase();

  const mapped = nodes.map(mapNode);

  const filtered = mapped.filter((ex) => {
    const handleMatch = ex.artistHandles.some((h) => h === targetHandle);
    if (handleMatch) return true;
    if (!targetName) return false;
    return ex.artistSearchText.includes(targetName);
  });

  if (!filtered.length) return null;

  const sorted = [...filtered].sort((a, b) => {
    const aTime = a.start ? a.start.getTime() : a.end ? a.end.getTime() : 0;
    const bTime = b.start ? b.start.getTime() : b.end ? b.end.getTime() : 0;
    return bTime - aTime;
  });

  return (
    <section className="w-full py-12 md:py-16">
      <Container>
        <h2 className="mb-8 text-2xl font-medium tracking-tight sm:text-3xl lg:mb-12 lg:text-4xl">Exhibitions</h2>
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-14 md:gap-y-16">
          {sorted.map((ex) => {
            const labels = heroLabels(statusFor(ex));
            const heading = headingParts({
              title: ex.title,
              artist: ex.artist,
              isGroup: ex.isGroup,
            });
            return (
              <article key={ex.handle} className="group">
                <Link href={`/exhibitions/${ex.handle}`} className="block">
                  {ex.hero?.url ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      <Image
                        src={ex.hero.url}
                        alt={ex.hero.alt ?? ex.title}
                        fill
                        sizes="(min-width:768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-neutral-100" />
                  )}

                  <div className="mt-4">
                    <ExhibitionLabel as="p">{labels.top}</ExhibitionLabel>
                    <h3 className="mt-2 text-base font-medium leading-snug">
                      <span className="block">{heading.primary}</span>
                      {heading.secondary && (
                        <span className="block text-neutral-500">{heading.secondary}</span>
                      )}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      {ex.start ? formatDates(ex.start, ex.end) : ex.summary ?? ""}
                    </p>
                    {ex.location ? (
                      <p className="text-sm text-neutral-500">{ex.location}</p>
                    ) : null}
                    <p className="mt-4 inline-flex items-center text-sm">
                      <span className="mr-2">→</span>
                      <span className="underline-offset-4 hover:underline">
                        {labels.button}
                      </span>
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
