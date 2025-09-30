import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import PageSubheader from "@/components/layout/PageSubheader";
import { shopifyFetch } from "@/lib/shopify";

/**
 * Artists index route renders a grid of artist cards sourced from Shopify metaobjects.
 * Each card needs a cover image, display label, optional ordering metadata, and a flag
 * that indicates whether the artist is currently represented by the gallery.
 */
export const dynamic = "force-dynamic"; // Disable static caching; the roster changes often.

// -----------------------------------------------------------------------------
// Types & Shopify query plumbing
// -----------------------------------------------------------------------------

/** Metafield reference unions returned by Shopify. */
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

/** Raw metafield payload returned by the GraphQL API. */
type Field = {
  key: string;
  type: string;
  value: string;
  reference: FieldRef | null;
};

/** Minimal metaobject node shape for the artists list query. */
type Node = { handle: string; fields: Field[] };

/** GraphQL response envelope. */
type ArtistsQuery = {
  metaobjects: { nodes: Node[] } | null;
};

/** Normalised card data consumed by the UI. */
type ArtistCard = {
  handle: string;
  label: string;
  coverUrl: string | null;
  coverAlt: string | null;
  sortKey: string;
  represented: boolean;
  lastNameSortKey: string;
};

/**
 * Fetch every artist metaobject along with the fields we care about.
 * - `handle` becomes the slug for the artist detail page
 * - `fields` is a heterogeneous list that we normalise below
 */
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

// -----------------------------------------------------------------------------
// Helper utilities – unwrap metafields into UI-friendly data
// -----------------------------------------------------------------------------

/**
 * Determine the best available cover image for an artist.
 * Priority order:
 *   1. MediaImage reference (ideal: includes alt text)
 *   2. GenericFile preview image (Shopify renders this for many uploads)
 *   3. GenericFile direct URL (no alt text available)
 *   4. Raw string value when it looks like an HTTP URL
 */
function coverFromFields(fields: Field[]) {
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

/** Choose the nicest display label for the artist card. */
function labelFromFields(fields: Field[], handle: string) {
  const entries = fields.map((field) => [field.key, field.value] as const);
  const map = Object.fromEntries(entries) as Record<string, string>;
  return map.name || map.title || handle;
}

/**
 * Compute an ordering key so editors can re-sequence artists via metafields.
 * Recognises `sortkey`; otherwise defers to the display name or handle.
 */
function sortKeyFromFields(fields: Field[], fallback: string) {
  const explicit = fields.find((field) => field.key === "sortkey")?.value;
  const name = fields.find((field) => field.key === "name")?.value;
  return explicit?.trim() || name?.trim() || fallback;
}

/**
 * Generate a stable, case-insensitive key that sorts by last name first.
 * We append the full name as a tiebreaker so artists sharing a surname stay in order.
 */
function lastNameKey(label: string) {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 0) return label.trim().toLowerCase();
  const last = parts[parts.length - 1];
  return `${last.toLowerCase()} ${label.trim().toLowerCase()}`;
}

// -----------------------------------------------------------------------------
// Page component – fetch, normalise, and render the artist grid
// -----------------------------------------------------------------------------

export default async function ArtistsPage() {
  // Pull the raw metaobject list from Shopify.
  const data = await shopifyFetch<ArtistsQuery>(QUERY);
  const nodes = data?.metaobjects?.nodes ?? [];

  // Massage the raw fields into the flattened shape the UI expects.
  const artists: ArtistCard[] = nodes
    .map((node) => {
      const { url, alt } = coverFromFields(node.fields);
      const label = labelFromFields(node.fields, node.handle);
      const representedField = node.fields.find((field) => field.key === "represented");
      const represented = representedField?.value?.trim().toLowerCase() === "true";

      return {
        handle: node.handle,
        label,
        coverUrl: url,
        coverAlt: alt,
        sortKey: sortKeyFromFields(node.fields, node.handle),
        represented,
        lastNameSortKey: lastNameKey(label),
      };
    })
    .filter((artist) => artist.represented)
    .filter((artist) => Boolean(artist.coverUrl)) // Only show artists when we have imagery.
    .sort((a, b) => a.lastNameSortKey.localeCompare(b.lastNameSortKey));

  return (
    <main
      style={{ paddingTop: "var(--header-h, 76px)" }} // respect dynamic header height variable
    >
      {/* Section header reuses the shared subheader component */}
      <PageSubheader title="Artists" />

      {/* Full-bleed background section: spans body width while the inner container preserves gutters */}
      <section className="bg-neutral-100">
        <Container className="max-w-7xl pt-12 pb-12 sm:pt-16 sm:pb-14">
          {/* Empty state keeps layout simple when no artists exist */}
          {artists.length === 0 ? (
            <p className="py-20 text-center text-neutral-500">
              No artists to show yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {artists.map((artist) => (
                <article key={artist.handle} className="group">
                  <Link href={`/artists/${artist.handle}`} className="block">
                    <div className="relative aspect-square overflow-hidden">
                      {/* Image fill ensures responsive intrinsic ratio while enabling hover scale */}
                      <Image
                        src={artist.coverUrl!}
                        alt={artist.coverAlt ?? artist.label}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                      />
                    </div>

                    {/* Name lockup sits beneath the cover asset */}
                    <p className="mt-3 text-sm font-medium text-neutral-900 group-hover:underline sm:text-base">
                      {artist.label}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
