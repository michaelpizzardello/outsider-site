import "server-only";

import { shopifyFetch } from "@/lib/shopify";
import { formatCurrency } from "@/lib/formatCurrency";
import { isDraftStatus } from "@/lib/isDraftStatus";
import FeaturedWorksClient from "./FeaturedWorksClient";

type Money = { amount: string; currencyCode: string };
type Props = {
  exhibitionHandle: string;
  /** Fallback if the product doesn't resolve an artist metaobject */
  fallbackArtist?: string | null;
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  onlineStoreUrl?: string | null;
  featuredImage?: { url: string; width?: number; height?: number; altText?: string | null } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  year?: { value?: string | null } | null;
  status?: {
    value?: string | null;
    reference?: {
      __typename: string;
      handle?: string | null;
      type?: string | null;
      fields?: Array<{ key?: string | null; value?: string | null } | null> | null;
    } | null;
  } | null;
  artistMeta?: {
    reference?: {
      __typename: string;
      handle?: string;
      type?: string;
      fields?: Array<{ key: string; value: string } | null> | null;
    } | null;
  } | null;
  exhibitions?: {
    reference?: { __typename: string; handle?: string | null } | null;
    references?: { nodes?: Array<{ __typename: string; handle?: string | null } | null> | null } | null;
  } | null;
  variants?: {
    nodes?: Array<{
      id: string;
      availableForSale?: boolean | null;
    } | null> | null;
  } | null;
};

type QueryResult = {
  products:
    | {
        nodes: Array<ProductNode | null>;
        pageInfo: { hasNextPage: boolean; endCursor?: string | null };
      }
    | null;
};

const QUERY = /* GraphQL */ `
  query FeaturedWorks(
    $first: Int = 200
    $after: String
    $ns: String = "custom"
    $exKey: String = "exhibitions"
    $artistKey: String = "artist"
  ) {
    products(
      first: $first
      after: $after
      sortKey: UPDATED_AT
      reverse: true
      query: "status:active"
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        onlineStoreUrl
        featuredImage { url width height altText }
        priceRange { minVariantPrice { amount currencyCode } }
        year: metafield(namespace: $ns, key: "year") { value }
        status: metafield(namespace: $ns, key: "status") {
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
        artistMeta: metafield(namespace: $ns, key: $artistKey) {
          reference {
            __typename
            ... on Metaobject {
              handle
              type
              fields { key value }
            }
          }
        }
        exhibitions: metafield(namespace: $ns, key: $exKey) {
          reference { __typename ... on Metaobject { handle type } }
          references(first: 50) {
            nodes { __typename ... on Metaobject { handle type } }
          }
        }
        variants(first: 1) {
          nodes {
            id
            availableForSale
          }
        }
      }
    }
  }
`;

function priceLabel(p: {
  price?: Money | undefined;
  status?: string | null | undefined;
  availableForSale: boolean;
}): string {
  const s = (p.status || "").trim().toLowerCase();
  const isSold = s === "sold" || p.availableForSale === false;
  if (isSold) return "Sold";
  if (p.price) {
    const amount = Number(p.price.amount);
    if (Number.isFinite(amount) && amount > 0) {
      const formatted = formatCurrency(amount, p.price.currencyCode);
      if (formatted) return formatted;
    }
  }
  return "Price on request";
}

function getArtistName(n: ProductNode, fallback?: string | null): string | undefined {
  const fields = n.artistMeta?.reference && (n.artistMeta.reference as any).fields;
  if (Array.isArray(fields)) {
    const byKey = (k: string) => fields.find((f: any) => f?.key?.toLowerCase?.() === k)?.value?.trim?.();
    return (
      byKey("name") || byKey("title") || byKey("full_name") || byKey("fullName") || undefined
    );
  }
  return n.vendor ?? (fallback ?? undefined);
}

function productMatchesExhibition(n: ProductNode, handle: string): boolean {
  const ref = n.exhibitions?.reference;
  if (ref && ref.__typename === "Metaobject" && ref.handle === handle) return true;
  const nodes = n.exhibitions?.references?.nodes || [];
  return nodes?.some((r) => r?.__typename === "Metaobject" && r?.handle === handle) ?? false;
}

type ArtworkPayload = {
  id: string;
  handle: string;
  title: string;
  artist: string | null;
  year: string | null;
  priceLabel: string;
  sold: boolean;
  canPurchase: boolean;
  variantId?: string | null;
  featureImage?: {
    url: string;
    width?: number | null;
    height?: number | null;
    altText?: string | null;
  } | null;
  aspectRatio?: string;
  heightFactor: number;
  type: "L" | "P" | "S";
};

type LayoutRow = { layout: "full" | "pair" | "triple"; indexes: number[] };

export default async function FeaturedWorks({
  exhibitionHandle,
  fallbackArtist,
}: Props) {
  // Fetch a light list of products and filter client-side by reference
  const pageSize = 200;
  const all: ProductNode[] = [];
  const seen = new Set<string>();
  let after: string | null = null;

  while (true) {
    const data = await shopifyFetch<QueryResult>(QUERY, {
      first: pageSize,
      after,
      ns: "custom",
      exKey: "exhibitions",
      artistKey: "artist",
    });
    const page = data?.products;
    if (!page) break;

    for (const node of page.nodes ?? []) {
      if (!node?.id) continue;
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      all.push(node);
    }

    if (!page.pageInfo?.hasNextPage) break;
    const nextCursor = page.pageInfo.endCursor;
    if (!nextCursor) break;
    after = nextCursor;
  }

  const nodes = all
    .filter((p) => productMatchesExhibition(p, exhibitionHandle))
    .filter((p) => !isDraftStatus(p.status?.value));

  if (nodes.length === 0) return null;

  const items = nodes.map((p) => {
    const w = p.featuredImage?.width ?? 0;
    const h = p.featuredImage?.height ?? 0;
    const aspectRatio = w > 0 && h > 0 ? `${w}/${h}` : undefined;
    const ratio = w > 0 && h > 0 ? w / h : 1;
    const heightFactor = ratio !== 0 ? 1 / ratio : 1;
    let type: "L" | "P" | "S" = "P";
    if (w > 0 && h > 0) {
      const ratio = w / h;
      if (ratio > 1.05) type = "L";
      else if (ratio < 0.95) type = "P";
      else type = "S";
    }
    return {
      product: p,
      aspectRatio,
      ratio,
      heightFactor,
      type,
    };
  });

  if (items.length === 0) return null;

  type ArtworkInternal = (typeof items)[number];

  const buildRows = (artworkList: ArtworkPayload[]): LayoutRow[] => {
    if (!artworkList.length) return [];

    const rows: LayoutRow[] = [];
    const normType = (t: ArtworkPayload["type"]) => (t === "P" ? "P" : "L");

    for (let i = 0; i < artworkList.length; ) {
      const remaining = artworkList.length - i;
      const currentType = normType(artworkList[i].type);

      const nextTypeMatches = (count: number) => {
        if (remaining < count) return false;
        for (let j = 0; j < count; j++) {
          if (normType(artworkList[i + j].type) !== currentType) return false;
        }
        return true;
      };

      if (nextTypeMatches(4)) {
        rows.push({ layout: "pair", indexes: [i, i + 1] });
        rows.push({ layout: "pair", indexes: [i + 2, i + 3] });
        i += 4;
        continue;
      }

      if (nextTypeMatches(3)) {
        if (currentType === "P") {
          rows.push({ layout: "triple", indexes: [i, i + 1, i + 2] });
        } else {
          rows.push({ layout: "full", indexes: [i] });
          rows.push({ layout: "pair", indexes: [i + 1, i + 2] });
        }
        i += 3;
        continue;
      }

      if (nextTypeMatches(2)) {
        rows.push({ layout: "pair", indexes: [i, i + 1] });
        i += 2;
        continue;
      }

      rows.push({ layout: "full", indexes: [i] });
      i += 1;
    }

    return rows;
  };

  const artworks: ArtworkPayload[] = items.map((item) => {
    const product = item.product;
    const price = product.priceRange?.minVariantPrice ?? undefined;
    const amount = price ? Number(price.amount) : NaN;
    const hasPrice = Number.isFinite(amount) && amount > 0;
    const primaryVariant =
      product.variants?.nodes?.find((variant) => Boolean(variant?.id)) ?? null;
    const variantAvailable =
      primaryVariant?.availableForSale !== false && Boolean(primaryVariant?.id);
    const isPublishedOnline = Boolean(product.onlineStoreUrl);
    const priceText = priceLabel({
      price,
      status: statusString(product),
      availableForSale: product.availableForSale,
    });
    const isSoldLabel = priceText.trim().toLowerCase() === "sold";
    const statusLc = (statusString(product) || "").trim().toLowerCase();
    const isEnquire =
      statusLc === "enquire" ||
      statusLc === "enquiry" ||
      statusLc === "reserved" ||
      statusLc === "poa" ||
      statusLc === "price on request" ||
      statusLc === "price_on_request" ||
      statusLc === "on hold" ||
      statusLc === "on_hold";
    const displayPriceLabel = isSoldLabel ? "" : priceText;
    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      artist: getArtistName(product, fallbackArtist) ?? null,
      year: product.year?.value ?? null,
      priceLabel: displayPriceLabel,
      sold: isSoldLabel,
      canPurchase: Boolean(
        product.availableForSale &&
          hasPrice &&
          isPublishedOnline &&
          variantAvailable &&
          !isSoldLabel &&
          !isEnquire
      ),
      variantId: (primaryVariant?.id as string | undefined) ?? null,
      featureImage: product.featuredImage
        ? {
            url: product.featuredImage.url,
            width: product.featuredImage.width,
            height: product.featuredImage.height,
            altText: product.featuredImage.altText,
          }
        : null,
      aspectRatio: item.aspectRatio,
      heightFactor: item.heightFactor,
      type: item.type,
    };
  });

  const availableArtworks = artworks.filter((artwork) => !artwork.sold);
  const soldArtworks = artworks.filter((artwork) => artwork.sold);

  const availableRows = buildRows(availableArtworks);
  const soldRows = buildRows(soldArtworks);

  if (!availableArtworks.length && !soldArtworks.length) return null;

  return (
    <>
      {availableArtworks.length > 0 && (
        <FeaturedWorksClient
          title="Available Works"
          exhibitionHandle={exhibitionHandle}
          artworks={availableArtworks}
          rows={availableRows}
          showActions
        />
      )}
      {soldArtworks.length > 0 && (
        <FeaturedWorksClient
          title="Featured Works"
          exhibitionHandle={exhibitionHandle}
          artworks={soldArtworks}
          rows={soldRows}
          showActions={false}
        />
      )}
    </>
  );
}
function statusString(n: ProductNode): string | undefined {
  const direct = n.status?.value?.trim();
  if (direct) return direct;
  const ref = n.status?.reference;
  if (ref && ref.__typename === "Metaobject") {
    const byKey = (k: string) =>
      ref.fields?.find((f) => f?.key?.toLowerCase() === k)?.value?.trim();
    return (
      byKey("value") ||
      byKey("status") ||
      byKey("label") ||
      byKey("name") ||
      byKey("title") ||
      ref.handle ||
      undefined
    );
  }
  return undefined;
}
