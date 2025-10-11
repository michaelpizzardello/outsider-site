import "server-only";

import { shopifyFetch } from "@/lib/shopify";
import { formatCurrency } from "@/lib/formatCurrency";
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
  featuredImage?: { url: string; width?: number; height?: number; altText?: string | null } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  year?: { value?: string | null } | null;
  status?: { value?: string | null } | null;
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
};

type QueryResult = {
  products: { nodes: ProductNode[] } | null;
};

const QUERY = /* GraphQL */ `
  query FeaturedWorks(
    $first: Int = 80
    $ns: String = "custom"
    $exKey: String = "exhibitions"
    $artistKey: String = "artist"
  ) {
    products(first: $first, query: "status:active") {
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        featuredImage { url width height altText }
        priceRange { minVariantPrice { amount currencyCode } }
        year: metafield(namespace: $ns, key: "year") { value }
        status: metafield(namespace: $ns, key: "status") { value }
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
  const isSold = s === "sold" || s === "reserved" || p.availableForSale === false;
  if (isSold) return "Sold";
  if (p.price) {
    const amount = Number(p.price.amount);
    if (Number.isFinite(amount)) {
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
  const data = await shopifyFetch<QueryResult>(QUERY, {
    first: 80,
    ns: "custom",
    exKey: "exhibitions",
    artistKey: "artist",
  });
  const all = data?.products?.nodes ?? [];
  const nodes = all.filter((p) => productMatchesExhibition(p, exhibitionHandle));

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
  const rows: LayoutRow[] = [];
  const normType = (t: ArtworkInternal["type"]) => (t === "P" ? "P" : "L");

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
  const artworks: ArtworkPayload[] = items.map((item) => {
    const product = item.product;
    const price = product.priceRange?.minVariantPrice ?? undefined;
    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      artist: getArtistName(product, fallbackArtist) ?? null,
      year: product.year?.value ?? null,
      priceLabel: priceLabel({
        price,
        status: product.status?.value,
        availableForSale: product.availableForSale,
      }),
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

  return (
    <FeaturedWorksClient
      exhibitionHandle={exhibitionHandle}
      artworks={artworks}
      rows={rows}
    />
  );
}
