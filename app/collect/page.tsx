import "server-only";

import Container from "@/components/layout/Container";
import CollectGrid from "@/components/collect/CollectGrid";
import { shopifyFetch } from "@/lib/shopify";
import PageSubheader from "@/components/layout/PageSubheader";

export const revalidate = 120;

type Money = { amount: string; currencyCode: string };

type ProductVariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
};

type MetaobjectField = { key?: string | null; value?: string | null } | null;

type MetaobjectReference =
  | {
      __typename: string;
      handle?: string | null;
      type?: string | null;
      fields?: MetaobjectField[] | null;
    }
  | null;

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  featuredImage?: { url: string; width?: number | null; height?: number | null; altText?: string | null } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  variants?: { nodes?: ProductVariantNode[] | null } | null;
  tags?: string[] | null;
  artistField?: {
    value?: string | null;
    reference?: MetaobjectReference;
  } | null;
  yearField?: { value?: string | null } | null;
  mediumField?: { value?: string | null } | null;
  dimensionsField?: { value?: string | null } | null;
  soldField?: { value?: string | null } | null;
  statusField?: { value?: string | null } | null;
};

type QueryResult = {
  products: { nodes: ProductNode[] } | null;
};

export type CollectArtwork = {
  id: string;
  handle: string;
  title: string;
  artist: string | null;
  year: string | null;
  medium: string | null;
  dimensions: string | null;
  price: Money | null;
  image: { url: string; width?: number | null; height?: number | null; altText?: string | null } | null;
  available: boolean;
  sold: boolean;
  status: string | null;
  variantId: string | null;
  quantityAvailable: number | null;
};

const QUERY = /* GraphQL */ `
  query CollectProducts($first: Int = 60) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        featuredImage { url width height altText }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 10) {
          nodes {
            id
            title
            availableForSale
            quantityAvailable
          }
        }
        tags
        artistField: metafield(namespace: "custom", key: "artist") {
          value
          reference {
            __typename
            ... on Metaobject {
              handle
              type
              fields { key value }
            }
          }
        }
        yearField: metafield(namespace: "custom", key: "year") { value }
        mediumField: metafield(namespace: "custom", key: "medium") { value }
        dimensionsField: metafield(namespace: "custom", key: "dimensions") { value }
        soldField: metafield(namespace: "custom", key: "sold") { value }
        statusField: metafield(namespace: "custom", key: "status") { value }
      }
    }
  }
`;

function norm(value?: string | null) {
  return value?.trim() || null;
}

function parseBoolean(value?: string | null) {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return ["true", "1", "yes", "sold"].includes(lower);
}

function pickVariant(nodes: ProductVariantNode[] | null | undefined) {
  if (!nodes?.length) return null;
  const available = nodes.find((variant) => variant.availableForSale);
  return available ?? nodes[0] ?? null;
}

function metaobjectFieldLookup(
  reference: MetaobjectReference | undefined | null,
  keys: string[]
): string | null {
  if (!reference || reference.__typename !== "Metaobject") return null;
  const fields = reference.fields ?? [];
  for (const key of keys) {
    const match = fields.find(
      (field) => field?.key?.toLowerCase() === key.toLowerCase()
    );
    if (match?.value) {
      const value = norm(match.value);
      if (value) return value;
    }
  }
  return null;
}

function getArtistName(node: ProductNode): string | null {
  const fromMeta = metaobjectFieldLookup(node.artistField?.reference, [
    "name",
    "full_name",
    "fullName",
    "title",
  ]);
  if (fromMeta) return fromMeta;
  const directValue = norm(node.artistField?.value);
  if (directValue) return directValue;
  return norm(node.vendor);
}

function mapProduct(node: ProductNode): CollectArtwork {
  const variant = pickVariant(node.variants?.nodes ?? []);
  const soldFlag = parseBoolean(node.soldField?.value);
  const status = norm(node.statusField?.value);
  const available = (variant?.availableForSale ?? node.availableForSale) && !soldFlag && status?.toLowerCase() !== "sold";
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    artist: getArtistName(node),
    year: norm(node.yearField?.value),
    medium: norm(node.mediumField?.value),
    dimensions: norm(node.dimensionsField?.value),
    price: node.priceRange?.minVariantPrice ?? null,
    image: node.featuredImage ?? null,
    available,
    sold: !available,
    status,
    variantId: variant?.id ?? null,
    quantityAvailable: variant?.quantityAvailable ?? null,
  };
}

export default async function CollectPage() {
  const data = await shopifyFetch<QueryResult>(QUERY, { first: 80 });
  const nodes = data.products?.nodes ?? [];
  const artworks = nodes.map(mapProduct).filter((artwork) => artwork.variantId);

  const mediums = Array.from(
    new Set(
      artworks
        .map((artwork) => artwork.medium)
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  const artists = Array.from(
    new Set(
      artworks
        .map((artwork) => artwork.artist)
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <main className="text-neutral-900" style={{ paddingTop: "var(--header-h, 76px)" }}>
      <PageSubheader
        title="Collect"
        description={
          <>
            <p>Contemporary works available directly from Outsider Gallery.</p>
            <p className="mt-4">
              Discover a curated selection of paintings, sculptures, and editions from our represented artists. Works are available to purchase online with secure checkout or by direct enquiry with our sales team.
            </p>
          </>
        }
      />

      <div
        className="bg-neutral-100"
        style={{ minHeight: "calc(100vh - var(--header-h, 76px))" }}
      >
        <section className="pt-10 pb-16 sm:pt-14 sm:pb-20">
          <Container className="max-w-5xl">
            <CollectGrid artworks={artworks} mediums={mediums} artists={artists} />
          </Container>
        </section>
      </div>
    </main>
  );
}
