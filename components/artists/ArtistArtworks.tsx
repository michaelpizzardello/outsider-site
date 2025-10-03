import "server-only";

import ArtistArtworksClient from "./ArtistArtworksClient";
import { shopifyFetch } from "@/lib/shopify";

// Data shapes ---------------------------------------------------------------

type Money = { amount: string; currencyCode: string };

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  featuredImage?: {
    url: string;
    width?: number | null;
    height?: number | null;
    altText?: string | null;
  } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  year?: { value?: string | null } | null;
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
  title: string;
  year: string | null;
  priceLabel: string;
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
  enquireHref: string;
};

type LayoutRow = { layout: "full" | "pair" | "triple"; indexes: number[] };

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
      }
    }
  }
`;

// Helpers -------------------------------------------------------------------

function priceLabel({
  price,
  availableForSale,
}: {
  price?: Money | null;
  availableForSale: boolean;
}): string {
  if (!availableForSale) return "Sold";
  if (price) {
    const amount = Number(price.amount);
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: price.currencyCode,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
    } catch {
      return `${price.currencyCode} ${amount.toLocaleString("en-GB")}`;
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

function buildRows(items: ArtworkPayload[]): LayoutRow[] {
  if (!items.length) return [];
  const rows: LayoutRow[] = [];
  const normType = (t: ArtworkPayload["type"]) => (t === "P" ? "P" : "L");

  for (let i = 0; i < items.length; ) {
    const remaining = items.length - i;
    const currentType = normType(items[i].type);
    const nextTypeMatches = (count: number) => {
      if (remaining < count) return false;
      for (let j = 0; j < count; j++) {
        if (normType(items[i + j].type) !== currentType) return false;
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
      rows.push({ layout: "triple", indexes: [i, i + 1, i + 2] });
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
}

// Component -----------------------------------------------------------------

export default async function ArtistArtworks({ artistHandle, artistName }: Props) {
  const data = await shopifyFetch<QueryResult>(QUERY, {
    first: 80,
    ns: "custom",
    artistKey: "artist",
  });

  const products = data?.products?.nodes ?? [];
  const filtered = products.filter((node) => matchesArtist(node, artistHandle, artistName));
  if (!filtered.length) return null;

  const artworks: ArtworkPayload[] = filtered.map((product) => {
    const pricing = priceLabel({
      price: product.priceRange?.minVariantPrice ?? null,
      availableForSale: product.availableForSale,
    });
    const exhibitionHandle = firstExhibitionHandle(product);
    const { aspectRatio, heightFactor, type } = classifyType(
      product.featuredImage?.width ?? undefined,
      product.featuredImage?.height ?? undefined
    );

    return {
      id: product.id,
      title: product.title,
      year: product.year?.value ?? null,
      priceLabel: pricing,
      featureImage: product.featuredImage ?? undefined,
      aspectRatio,
      heightFactor,
      type,
      href: exhibitionHandle
        ? `/exhibitions/${exhibitionHandle}/artworks/${product.handle}`
        : null,
      enquireHref: `/enquire?artwork=${encodeURIComponent(product.id)}`,
    };
  });

  const rows = buildRows(artworks);

  return <ArtistArtworksClient artworks={artworks} rows={rows} />;
}
