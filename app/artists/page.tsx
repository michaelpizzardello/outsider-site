import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import PageSubheader from "@/components/layout/PageSubheader";
import { shopifyFetch } from "@/lib/shopify";

export const dynamic = "force-dynamic";

type FieldRef =
  | {
      __typename: "MediaImage";
      image: {
        url: string;
        width: number;
        height: number;
        altText: string | null;
      };
    }
  | {
      __typename: "GenericFile";
      url?: string;
      previewImage?: { url: string };
    }
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: string;
  reference: FieldRef | null;
};

type Node = { handle: string; fields: Field[] };

type ArtistsQuery = {
  metaobjects: { nodes: Node[] } | null;
};

type ArtistCard = {
  handle: string;
  label: string;
  coverUrl: string | null;
  coverAlt: string | null;
  sortKey: string;
};

const QUERY = /* GraphQL */ `
  query ArtistsList {
    metaobjects(type: "artist", first: 100) {
      nodes {
        handle
        fields {
          key
          type
          value
          reference {
            __typename
            ... on MediaImage {
              image { url width height altText }
            }
            ... on GenericFile {
              url
              previewImage { url }
            }
          }
        }
      }
    }
  }
`;

type CoverData = { url: string | null; alt: string | null };

function coverFromFields(fields: Field[]): CoverData {
  const field = fields.find((f) => f.key === "coverimage");
  if (!field) return { url: null, alt: null };

  const ref = field.reference;
  if (ref?.__typename === "MediaImage" && "image" in ref) {
    const image = ref.image;
    if (image?.url) {
      return { url: image.url, alt: image.altText ?? null };
    }
  }

  if (ref?.__typename === "GenericFile") {
    if (ref.previewImage?.url) {
      return { url: ref.previewImage.url, alt: null };
    }
    if (ref.url) {
      return { url: ref.url, alt: null };
    }
  }

  if (typeof field.value === "string" && field.value.startsWith("http")) {
    return { url: field.value, alt: null };
  }

  return { url: null, alt: null };
}

function labelFromFields(fields: Field[], handle: string) {
  const entries = fields.map((field) => [field.key, field.value] as const);
  const map = Object.fromEntries(entries) as Record<string, string>;
  return map.name || map.title || handle;
}

function sortKeyFromFields(fields: Field[], fallback: string) {
  const explicit = fields.find((field) => field.key === "sortkey")?.value;
  const name = fields.find((field) => field.key === "name")?.value;
  return explicit?.trim() || name?.trim() || fallback;
}

export default async function ArtistsPage() {
  const data = await shopifyFetch<ArtistsQuery>(QUERY);
  const nodes = data?.metaobjects?.nodes ?? [];

  const artists: ArtistCard[] = nodes
    .map((node) => {
      const { url, alt } = coverFromFields(node.fields);

      return {
        handle: node.handle,
        label: labelFromFields(node.fields, node.handle),
        coverUrl: url,
        coverAlt: alt,
        sortKey: sortKeyFromFields(node.fields, node.handle),
      };
    })
    .filter((artist) => Boolean(artist.coverUrl))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <main
      className="pb-16 sm:pb-20"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      <PageSubheader title="Artists" />

      <Container className="mt-12 sm:mt-16 max-w-7xl">
        {artists.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">
            No artists to show yet.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {artists.map((artist) => (
              <article key={artist.handle} className="group">
                <Link href={`/artists/${artist.handle}`} className="block">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={artist.coverUrl!}
                      alt={artist.coverAlt ?? artist.label}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                    />
                  </div>
                  <p className="mt-3 text-sm sm:text-base font-medium text-neutral-900 group-hover:underline">
                    {artist.label}
                  </p>
                </Link>
              </article>
            ))}
          </section>
        )}
      </Container>
    </main>
  );
}
