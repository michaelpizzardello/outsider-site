import "server-only";

import Container from "@/components/layout/Container";
import CollectGrid from "@/components/collect/CollectGrid";
import CollectBanner from "@/components/collect/CollectBanner";
import { shopifyFetch } from "@/lib/shopify";

export const revalidate = 120;

type Money = { amount: string; currencyCode: string };

type ProductVariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
};

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
  artistField?: { value?: string | null } | null;
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
        artistField: metafield(namespace: "custom", key: "artist") { value }
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

function mapProduct(node: ProductNode): CollectArtwork {
  const variant = pickVariant(node.variants?.nodes ?? []);
  const soldFlag = parseBoolean(node.soldField?.value);
  const status = norm(node.statusField?.value);
  const available = (variant?.availableForSale ?? node.availableForSale) && !soldFlag && status?.toLowerCase() !== "sold";
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    artist: norm(node.artistField?.value) ?? norm(node.vendor) ?? null,
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
    <main
      className="bg-white text-neutral-900"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      <section className="border-b border-neutral-200 bg-[var(--colors-grey-default,#f6f6f5)] py-16 sm:py-20 md:py-24">
        <Container className="grid gap-y-10 md:grid-cols-12 md:gap-x-14 lg:gap-x-20">
          <div className="md:col-span-7 lg:col-span-6">
            <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">Collect</p>
            <h1 className="mt-4 text-4xl font-light leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Contemporary works available directly from Outsider Gallery
            </h1>
          </div>
          <div className="md:col-span-5 lg:col-span-4 md:self-end">
            <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
              Discover a curated selection of paintings, sculptures, and editions from our represented artists. Works are available to purchase online with secure checkout or by direct enquiry with our sales team.
            </p>
            <p className="mt-5 text-sm uppercase tracking-[0.2em] text-neutral-500">
              Complimentary global shipping on orders over GBP 5,000.
            </p>
          </div>
        </Container>
      </section>

      <CollectBanner />

      <section className="py-16 sm:py-20">
        <Container>
          <CollectGrid artworks={artworks} mediums={mediums} artists={artists} />
        </Container>
      </section>
    </main>
  );
}
