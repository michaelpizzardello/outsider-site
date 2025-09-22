import "server-only";

import { notFound } from "next/navigation";

import { shopifyFetch } from "@/lib/shopify";
import { toHtml } from "@/lib/richtext";
import ArtworkLayout from "@/components/exhibition/ArtworkLayout";

export const revalidate = 120;

const ARTWORK_QUERY = /* GraphQL */ `
  query ArtworkByHandle(
    $handle: String!
    $ns: String = "custom"
    $exKey: String = "exhibitions"
    $artistKey: String = "artist"
  ) {
    product(handle: $handle) {
      id
      title
      handle
      vendor
      description
      descriptionHtml
      availableForSale
      featuredImage { url width height altText }
      images(first: 12) {
        nodes { id url width height altText }
      }
      priceRange { minVariantPrice { amount currencyCode } }
      year: metafield(namespace: $ns, key: "year") { value }
      medium: metafield(namespace: $ns, key: "medium") { value }
      dimensions: metafield(namespace: $ns, key: "dimensions") { value }
      widthCm: metafield(namespace: $ns, key: "width") { value }
      heightCm: metafield(namespace: $ns, key: "height") { value }
      depthCm: metafield(namespace: $ns, key: "depth") { value }
      caption: metafield(namespace: $ns, key: "caption") { value type }
      fullCaption: metafield(namespace: $ns, key: "full_caption") { value type }
      additionalInfo: metafield(namespace: $ns, key: "additional_info") { value type }
      additional: metafield(namespace: $ns, key: "additional") { value type }
      notes: metafield(namespace: $ns, key: "notes") { value type }
      status: metafield(namespace: $ns, key: "status") { value }
      sold: metafield(namespace: $ns, key: "sold") { value }
      artistMeta: metafield(namespace: $ns, key: $artistKey) {
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
      exhibitions: metafield(namespace: $ns, key: $exKey) {
        value
        reference {
          __typename
          ... on Metaobject { handle type }
        }
        references(first: 50) {
          nodes {
            __typename
            ... on Metaobject { handle type }
          }
        }
      }
    }
  }
`;

type MaybeMetaobject = {
  __typename: string;
  handle?: string | null;
  type?: string | null;
  fields?: Array<{ key?: string | null; value?: string | null } | null> | null;
};

type MaybeMetafield = {
  value?: string | null;
  type?: string | null;
  reference?: MaybeMetaobject | null;
};

type ArtworkQuery = {
  product: {
    id: string;
    title: string;
    handle: string;
    vendor?: string | null;
    description?: string | null;
    descriptionHtml?: string | null;
    availableForSale: boolean;
    featuredImage?: ImageNode | null;
    images?: { nodes?: ImageNode[] | null } | null;
    priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } | null } | null;
    year?: MaybeMetafield | null;
    medium?: MaybeMetafield | null;
    dimensions?: MaybeMetafield | null;
    widthCm?: MaybeMetafield | null;
    heightCm?: MaybeMetafield | null;
    depthCm?: MaybeMetafield | null;
    caption?: MaybeMetafield | null;
    fullCaption?: MaybeMetafield | null;
    additionalInfo?: MaybeMetafield | null;
    additional?: MaybeMetafield | null;
    notes?: MaybeMetafield | null;
    status?: MaybeMetafield | null;
    sold?: MaybeMetafield | null;
    artistMeta?: MaybeMetafield | null;
    exhibitions?: {
      value?: string | null;
      reference?: MaybeMetaobject | null;
      references?: { nodes?: MaybeMetaobject[] | null } | null;
    } | null;
  } | null;
};

type ImageNode = {
  id?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

function looksLikeHtml(value: string) {
  return /<\s*[a-z][\s\S]*>/i.test(value);
}

function metafieldString(mf?: MaybeMetafield | null): string | undefined {
  const value = mf?.value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function metafieldHtml(mf?: MaybeMetafield | null): string | undefined {
  const raw = metafieldString(mf);
  if (!raw) return undefined;
  const type = mf?.type || "";
  if (type.includes("rich_text")) {
    return toHtml(raw) ?? undefined;
  }
  if (looksLikeHtml(raw)) return raw;
  return `<p>${raw.replace(/\n+/g, "<br/>")}</p>`;
}

function metafieldNumber(mf?: MaybeMetafield | null): number | undefined {
  const raw = metafieldString(mf);
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function formatDimensionsCm(
  width?: number,
  height?: number,
  depth?: number
): string | undefined {
  const parts = [] as string[];
  const format = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");

  if (typeof width === "number") parts.push(format(width));
  if (typeof height === "number") parts.push(format(height));
  if (typeof depth === "number") parts.push(format(depth));

  if (parts.length === 0) return undefined;
  return `${parts.join(" x ")} cm`;
}

function getArtistName(meta?: MaybeMetafield | null): string | undefined {
  const fromValue = metafieldString(meta);
  const ref = meta?.reference;
  if (ref?.__typename === "Metaobject" && Array.isArray(ref.fields)) {
    const fields = ref.fields;
    const byKey = (key: string) =>
      fields.find((entry) => entry?.key?.toLowerCase() === key)?.value?.trim();
    return (
      byKey("name") || byKey("title") || byKey("full_name") || byKey("fullName") || fromValue || undefined
    );
  }
  return fromValue || undefined;
}

function productBelongsToExhibition(
  product: ArtworkQuery["product"],
  exhibitionHandle: string
): boolean {
  if (!product?.exhibitions) return false;
  const ref = product.exhibitions.reference;
  if (ref?.__typename === "Metaobject" && ref.handle === exhibitionHandle) return true;
  const nodes = product.exhibitions.references?.nodes || [];
  return nodes?.some((node) => node?.__typename === "Metaobject" && node.handle === exhibitionHandle) ?? false;
}

function formatPriceLabel(product: ArtworkQuery["product"]): string | undefined {
  const price = product?.priceRange?.minVariantPrice;
  const status = metafieldString(product?.status)?.toLowerCase();
  const soldFlag = metafieldString(product?.sold)?.toLowerCase();
  const isSold =
    soldFlag === "true" ||
    soldFlag === "1" ||
    soldFlag === "yes" ||
    status === "sold" ||
    status === "reserved" ||
    product?.availableForSale === false;

  if (isSold) return "Sold";
  if (!price) return undefined;

  const amount = Number(price.amount);
  if (Number.isFinite(amount)) {
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
  return undefined;
}

export default async function ArtworkPage({
  params,
}: {
  params: { handle: string; artworkHandle: string };
}) {
  const { handle: exhibitionHandle, artworkHandle } = params;
  const data = await shopifyFetch<ArtworkQuery>(ARTWORK_QUERY, {
    handle: artworkHandle,
    ns: "custom",
    exKey: "exhibitions",
    artistKey: "artist",
  });

  const product = data.product;
  if (!product) notFound();

  // Optionally ensure the product references this exhibition; otherwise continue but console.log.
  if (!productBelongsToExhibition(product, exhibitionHandle)) {
    console.log(
      `[artworks] product ${product.handle} does not reference exhibition ${exhibitionHandle} — continuing anyway.`
    );
  }

  const artist = getArtistName(product.artistMeta);
  const year = metafieldString(product.year);
  const medium = metafieldString(product.medium);

  const captionHtml =
    metafieldHtml(product.fullCaption) ||
    metafieldHtml(product.caption) ||
    product.descriptionHtml ||
    (product.description ? `<p>${product.description}</p>` : undefined);

  const additionalInfoHtml =
    metafieldHtml(product.additionalInfo) ||
    metafieldHtml(product.additional) ||
    metafieldHtml(product.notes);

  const priceLabel = formatPriceLabel(product);

  const images = product.images?.nodes?.filter((img): img is ImageNode => Boolean(img?.url)) ?? [];
  const heroImage = product.featuredImage || images[0];
  const gallery = heroImage
    ? [heroImage, ...images.filter((img) => img.url !== heroImage.url)]
    : images;

  const widthCm = metafieldNumber(product.widthCm);
  const heightCm = metafieldNumber(product.heightCm);
  const depthCm = metafieldNumber(product.depthCm);
  const dimensionsLabel =
    formatDimensionsCm(widthCm, heightCm, depthCm) ?? metafieldString(product.dimensions);

  return (
    <ArtworkLayout
      exhibitionHandle={exhibitionHandle}
      title={product.title}
      gallery={gallery}
      artist={artist}
      year={year}
      priceLabel={priceLabel}
      captionHtml={captionHtml}
      medium={medium}
      dimensionsLabel={dimensionsLabel}
      additionalInfoHtml={additionalInfoHtml}
    />
  );
}
