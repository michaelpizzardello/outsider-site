import "server-only";

import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import { shopifyFetch } from "@/lib/shopify";

export const dynamic = "force-static";
export const revalidate = 60;

export const metadata = {
  title: "Artists — Outsider Gallery",
  description: "Artists represented by Outsider Gallery.",
};

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

type ArtistCard = {
  handle: string;
  label: string;
  coverUrl?: string;
  coverAlt?: string;
  sortKey: string;
};

function coverFromFields(fields: Field[]): Pick<ArtistCard, "coverUrl" | "coverAlt"> {
  const coverField = fields.find((field) => field.key === "coverimage");
  if (!coverField) return {};

  const ref = coverField.reference;

  if (ref && ref.__typename === "MediaImage" && "image" in ref && ref.image?.url) {
    return { coverUrl: ref.image.url, coverAlt: ref.image.altText ?? undefined };
  }

  if (ref && ref.__typename === "GenericFile") {
    if (ref.url) return { coverUrl: ref.url };
    if (ref.previewImage?.url) return { coverUrl: ref.previewImage.url };
  }

  if (coverField.value.startsWith("http")) {
    return { coverUrl: coverField.value };
  }

  return {};
}

function labelFromFields(fields: Field[], handle: string) {
  const entries = Object.fromEntries(fields.map((field) => [field.key, field.value]));
  return (entries.name as string) || (entries.title as string) || handle;
}

function sortKeyFromFields(fields: Field[], fallback: string) {
  const raw =
    fields.find((field) => field.key === "sortkey")?.value ||
    fields.find((field) => field.key === "name")?.value;
  return raw ?? fallback;
}

export default async function ArtistsIndex() {
  const data = await shopifyFetch<ArtistsQuery>(QUERY);
  const nodes = data?.metaobjects?.nodes ?? [];

  const artists: ArtistCard[] = nodes
    .map((node) => {
      const { coverUrl, coverAlt } = coverFromFields(node.fields);

      return {
        handle: node.handle,
        label: labelFromFields(node.fields, node.handle),
        coverUrl,
        coverAlt,
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
      <Container className="max-w-7xl">
        <header className="mt-10 md:mt-10 lg:mt-20 mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Artists</h1>
        </header>

        {artists.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">No artists to show yet.</p>
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
