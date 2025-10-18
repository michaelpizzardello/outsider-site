import "server-only";

import { shopifyFetch } from "@/lib/shopify";
import { formatCurrency } from "@/lib/formatCurrency";
import ArtistArtworksClient from "./ArtistArtworksClient";
import { isDraftStatus } from "@/lib/isDraftStatus";

// Data shapes ---------------------------------------------------------------

type Money = { amount: string; currencyCode: string };

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  onlineStoreUrl?: string | null;
  featuredImage?: {
    url: string;
    width?: number | null;
    height?: number | null;
    altText?: string | null;
  } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  year?: { value?: string | null } | null;
  status?: { value?: string | null } | null;
  artistMeta?: {
    value?: string | null;
    reference?: {
      __typename: string;
      handle?: string | null;
      type?: string | null;
    } | null;
  } | null;
  exhibitions?: {
    reference?: { __typename: string; handle?: string | null } | null;
    references?: {
      nodes?: Array<{
        __typename: string;
        handle?: string | null;
      } | null> | null;
    } | null;
  } | null;
  variants?: {
    nodes?: Array<{
      id: string;
      availableForSale?: boolean | null;
    } | null> | null;
  } | null;
};

type QueryResult = {
  products: { nodes: ProductNode[] } | null;
};

type Props = {
  artistHandle: string;
  artistName: string;
};

type ArtworkPayload = {
  id: string;
  handle: string;
  artist: string | null;
  title: string;
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
  href?: string | null;
};

// GraphQL -------------------------------------------------------------------

const QUERY = /* GraphQL */ `
  query ArtistArtworks(
    $first: Int = 80
    $ns: String = "custom"
    $artistKey: String = "artist"
  ) {
    products(first: $first, query: "status:active") {
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        onlineStoreUrl
        featuredImage {
          url
          width
          height
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        year: metafield(namespace: $ns, key: "year") { value }
        status: metafield(namespace: $ns, key: "status") { value }
        artistMeta: metafield(namespace: $ns, key: $artistKey) {
          value
          reference {
            __typename
            ... on Metaobject {
              handle
              type
            }
          }
        }
        exhibitions: metafield(namespace: $ns, key: "exhibitions") {
          reference {
            __typename
            ... on Metaobject {
              handle
              type
            }
          }
          references(first: 20) {
            nodes {
              __typename
              ... on Metaobject {
                handle
                type
              }
            }
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

// Helpers -------------------------------------------------------------------

function priceLabel({
  price,
  status,
  availableForSale,
}: {
  price?: Money | null;
  status?: string | null;
  availableForSale: boolean;
}): string {
  const normalizedStatus = (status || "").trim().toLowerCase();
  const isSold =
    normalizedStatus === "sold" ||
    normalizedStatus === "reserved" ||
    availableForSale === false;
  if (isSold) return "Sold";
  if (price) {
    const amount = Number(price.amount);
    if (Number.isFinite(amount) && amount > 0) {
      const formatted = formatCurrency(amount, price.currencyCode);
      if (formatted) return formatted;
    }
  }
  return "Price on request";
}

function matchesArtist(node: ProductNode, handle: string, artistName: string): boolean {
  const refHandle = node.artistMeta?.reference?.handle;
  if (refHandle && refHandle.toLowerCase() === handle.toLowerCase()) return true;

  const metaValue = node.artistMeta?.value?.trim().toLowerCase();
  if (metaValue && metaValue === artistName.trim().toLowerCase()) return true;

  const vendorName = node.vendor?.trim().toLowerCase();
  if (vendorName && vendorName === artistName.trim().toLowerCase()) return true;

  return false;
}

function firstExhibitionHandle(node: ProductNode): string | null {
  const ref = node.exhibitions?.reference;
  if (ref?.__typename === "Metaobject" && ref.handle) return ref.handle;

  const nodes = node.exhibitions?.references?.nodes || [];
  const found = nodes.find((n) => n?.__typename === "Metaobject" && n.handle);
  return found?.handle ?? null;
}

function classifyType(width?: number | null, height?: number | null): {
  aspectRatio?: string;
  heightFactor: number;
  type: "L" | "P" | "S";
} {
  if (!width || !height) return { aspectRatio: undefined, heightFactor: 1, type: "S" };
  const ratio = width / height;
  let type: "L" | "P" | "S" = "S";
  if (ratio > 1.05) type = "L";
  else if (ratio < 0.95) type = "P";
  return {
    aspectRatio: `${width}/${height}`,
    heightFactor: ratio !== 0 ? 1 / ratio : 1,
    type,
  };
}

// Component -----------------------------------------------------------------

export default async function ArtistArtworks({ artistHandle, artistName }: Props) {
  const data = await shopifyFetch<QueryResult>(QUERY, {
    first: 80,
    ns: "custom",
    artistKey: "artist",
  });

  const products = data?.products?.nodes ?? [];
  const filtered = products
    .filter((node) => matchesArtist(node, artistHandle, artistName))
    .filter((node) => !isDraftStatus(node.status?.value));
  if (!filtered.length) return null;

  const artworks: ArtworkPayload[] = filtered.map((product) => {
    const price = product.priceRange?.minVariantPrice ?? undefined;
    const priceText = priceLabel({
      price,
      status: product.status?.value,
      availableForSale: product.availableForSale,
    });
    const isSold = priceText.trim().toLowerCase() === "sold";
    const displayPriceLabel = isSold ? "" : priceText;
    const amount = price ? Number(price.amount) : NaN;
    const hasPrice = Number.isFinite(amount) && amount > 0;
    const primaryVariant =
      product.variants?.nodes?.find((variant) => Boolean(variant?.id)) ?? null;
    const variantAvailable =
      primaryVariant?.availableForSale !== false && Boolean(primaryVariant?.id);
    const isPublishedOnline = Boolean(product.onlineStoreUrl);
    const exhibitionHandle = firstExhibitionHandle(product);
    const { aspectRatio, heightFactor, type } = classifyType(
      product.featuredImage?.width ?? undefined,
      product.featuredImage?.height ?? undefined
    );

    return {
      id: product.id,
      handle: product.handle,
      artist: artistName || null,
      title: product.title,
      year: product.year?.value ?? null,
      priceLabel: displayPriceLabel,
      sold: isSold,
      canPurchase: Boolean(
        product.availableForSale &&
          hasPrice &&
          isPublishedOnline &&
          variantAvailable &&
          !isSold
      ),
      variantId: (primaryVariant?.id as string | undefined) ?? null,
      featureImage: product.featuredImage ?? undefined,
      aspectRatio,
      heightFactor,
      type,
      href: exhibitionHandle
        ? `/exhibitions/${exhibitionHandle}/artworks/${product.handle}`
        : null,
    };
  });

  const availableArtworks = artworks.filter((artwork) => !artwork.sold);
  const soldArtworks = artworks.filter((artwork) => artwork.sold);

  if (!availableArtworks.length && !soldArtworks.length) return null;

  return (
    <ArtistArtworksClient
      availableArtworks={availableArtworks}
      soldArtworks={soldArtworks}
    />
  );
}
