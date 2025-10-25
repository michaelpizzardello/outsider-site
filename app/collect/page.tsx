import "server-only";

import Container from "@/components/layout/Container";
import CollectGrid from "@/components/collect/CollectGrid";
import { shopifyFetch } from "@/lib/shopify";
import PageSubheader from "@/components/layout/PageSubheader";
import { isDraftStatus } from "@/lib/isDraftStatus";

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
  exhibitions?: {
    reference?: MetaobjectReference;
    references?: {
      nodes?: Array<
        | {
            __typename: string;
            handle?: string | null;
            type?: string | null;
          }
        | null
      > | null;
    };
  } | null;
  artistField?: {
    value?: string | null;
    reference?: MetaobjectReference;
  } | null;
  yearField?: { value?: string | null } | null;
  mediumField?: { value?: string | null } | null;
  dimensionsField?: { value?: string | null } | null;
  soldField?: { value?: string | null } | null;
  statusField?: { value?: string | null; reference?: MetaobjectReference } | null;
  widthField?: { value?: string | null } | null;
  heightField?: { value?: string | null } | null;
  depthField?: { value?: string | null } | null;
};

type QueryResult = {
  products: { nodes: ProductNode[] } | null;
};

export type CollectArtwork = {
  id: string;
  handle: string;
  title: string;
  exhibitionHandle: string | null;
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
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
};

const QUERY = /* GraphQL */ `
  query CollectProducts($first: Int = 60) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true, query: "status:active") {
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        featuredImage { url width height altText }
        priceRange { minVariantPrice { amount currencyCode } }
        exhibitions: metafield(namespace: "custom", key: "exhibitions") {
          reference {
            __typename
            ... on Metaobject {
              handle
              type
            }
          }
          references(first: 10) {
            nodes {
              __typename
              ... on Metaobject {
                handle
                type
              }
            }
          }
        }
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
        statusField: metafield(namespace: "custom", key: "status") {
          value
          type
          reference {
            __typename
            ... on Metaobject {
              handle
              type
              fields { key value }
            }
          }
        }
        widthField: metafield(namespace: "custom", key: "width") { value }
        heightField: metafield(namespace: "custom", key: "height") { value }
        depthField: metafield(namespace: "custom", key: "depth") { value }
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

function metafieldNumber(field: { value?: string | null } | null | undefined) {
  const value = norm(field?.value);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDimensionsCm(
  width?: number | null,
  height?: number | null,
  depth?: number | null
): string | null {
  const formatValue = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
  const parts: string[] = [];
  if (typeof width === "number" && Number.isFinite(width)) parts.push(formatValue(width));
  if (typeof height === "number" && Number.isFinite(height)) parts.push(formatValue(height));
  if (typeof depth === "number" && Number.isFinite(depth)) parts.push(formatValue(depth));
  if (!parts.length) return null;
  return `${parts.join(" x ")} cm`;
}

function mapProduct(node: ProductNode): CollectArtwork {
  const variant = pickVariant(node.variants?.nodes ?? []);
  const soldFlag = parseBoolean(node.soldField?.value);
  const status = statusFromMeta(node.statusField);
  const statusLc = (status || "").toLowerCase();
  const primaryExhibition =
    node.exhibitions?.reference?.__typename === "Metaobject"
      ? norm(node.exhibitions.reference.handle)
      : null;
  const secondaryExhibition =
    node.exhibitions?.references?.nodes?.find(
      (ref) => ref?.__typename === "Metaobject" && ref?.handle
    )?.handle ?? null;
  // Show in Collect when not sold. Items marked as
  // "reserved" or "enquire" remain visible but are not directly purchasable (handled in UI).
  const available =
    (variant?.availableForSale ?? node.availableForSale) &&
    !soldFlag &&
    statusLc !== "sold";
  const widthCm = metafieldNumber(node.widthField);
  const heightCm = metafieldNumber(node.heightField);
  const depthCm = metafieldNumber(node.depthField);
  const dimensionsLabel =
    formatDimensionsCm(widthCm, heightCm, depthCm) ?? norm(node.dimensionsField?.value);
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    exhibitionHandle: primaryExhibition || norm(secondaryExhibition),
    artist: getArtistName(node),
    year: norm(node.yearField?.value),
    medium: norm(node.mediumField?.value),
    dimensions: dimensionsLabel,
    price: node.priceRange?.minVariantPrice ?? null,
    image: node.featuredImage ?? null,
    available,
    sold: !available,
    status,
    variantId: variant?.id ?? null,
    quantityAvailable: variant?.quantityAvailable ?? null,
    widthCm,
    heightCm,
    depthCm,
  };
}

export default async function CollectPage() {
  const data = await shopifyFetch<QueryResult>(QUERY, { first: 80 });
  const nodes = data.products?.nodes ?? [];
  const artworks = nodes
    .map(mapProduct)
    .filter(
      (artwork) =>
        artwork.available &&
        artwork.variantId &&
        !isDraftStatus(artwork.status)
    );

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
function statusFromMeta(field?: { value?: string | null; reference?: MetaobjectReference } | null): string | null {
  const s = norm(field?.value);
  if (s) return s;
  const ref = field?.reference;
  if (ref && ref.__typename === "Metaobject") {
    const byKey = (k: string) =>
      ref.fields?.find((f) => f?.key?.toLowerCase() === k)?.value?.trim() || null;
    return (
      byKey("value") ||
      byKey("status") ||
      byKey("label") ||
      byKey("name") ||
      byKey("title") ||
      norm(ref.handle)
    );
  }
  return null;
}
