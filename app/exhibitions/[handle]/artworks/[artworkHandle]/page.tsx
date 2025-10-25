import "server-only";

import { notFound } from "next/navigation";

import { shopifyFetch } from "@/lib/shopify";
import { toHtml } from "@/lib/richtext";
import ArtworkLayout from "@/components/exhibition/ArtworkLayout";
import { formatCurrency } from "@/lib/formatCurrency";

// Static revalidation keeps artwork detail pages fresh without SSR on every hit.
export const revalidate = 120;

// GraphQL query that gathers the artwork product with all metafields needed for the detail view.
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
      onlineStoreUrl
      featuredImage { url width height altText }
      images(first: 12) {
        nodes { id url width height altText }
      }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 1) {
        nodes { id availableForSale }
      }
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

// Helper type for metaobject references returned inside metafields.
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
    onlineStoreUrl?: string | null;
    featuredImage?: ImageNode | null;
    images?: { nodes?: ImageNode[] | null } | null;
    priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } | null } | null;
    variants?: {
      nodes?: Array<
        | {
            id: string;
            availableForSale?: boolean | null;
          }
        | null
      > | null;
    } | null;
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

// Quick heuristic that detects whether a string contains HTML-like markup.
function looksLikeHtml(value: string) {
  return /<\s*[a-z][\s\S]*>/i.test(value);
}

// Normalise metafield values to plain trimmed strings.
function metafieldString(mf?: MaybeMetafield | null): string | undefined {
  const value = mf?.value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function metafieldStringLoose(mf?: MaybeMetafield | null): string | undefined {
  const direct = metafieldString(mf);
  if (direct) return direct;
  const ref = mf?.reference;
  if (ref?.__typename === "Metaobject") {
    const byKey = (key: string) =>
      ref.fields?.find((f) => f?.key?.toLowerCase() === key)?.value?.trim();
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

// Convert metafield values into HTML, accounting for rich_text payloads and
// falling back to simple paragraph-wrapped text when necessary.
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

// Parse metafield values to numbers when the payload contains numeric strings.
function metafieldNumber(mf?: MaybeMetafield | null): number | undefined {
  const raw = metafieldString(mf);
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

// Combine dimension values (cm) into a readable label such as "40 x 60 x 5 cm".
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

// Extract the artist name, giving priority to referenced metaobject fields when available.
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

function deriveCommerceState(product: ArtworkQuery["product"]) {
  const price = product?.priceRange?.minVariantPrice;
  const status = metafieldStringLoose(product?.status)?.toLowerCase();
  const soldFlag = metafieldString(product?.sold)?.toLowerCase();
  const forceEnquire =
    status === "enquire" ||
    status === "enquiry" ||
    status === "reserved" ||
    status === "poa" ||
    status === "price on request" ||
    status === "price_on_request" ||
    status === "on hold" ||
    status === "on_hold";
  const isSold =
    soldFlag === "true" ||
    soldFlag === "1" ||
    soldFlag === "yes" ||
    status === "sold" ||
    product?.availableForSale === false;

  const amount = price ? Number(price.amount) : NaN;
  const hasPrice = Number.isFinite(amount) && amount > 0;
  const formattedPrice =
    hasPrice && price ? formatCurrency(amount, price.currencyCode) : undefined;

  const primaryVariant =
    product?.variants?.nodes?.find((variant) => Boolean(variant?.id)) ?? null;
  const variantId = (primaryVariant?.id as string | undefined) ?? null;
  const variantAvailable =
    primaryVariant?.availableForSale !== false && Boolean(variantId);
  const publishedOnline = Boolean(product?.onlineStoreUrl);

  const canPurchase = Boolean(
    !isSold &&
      product?.availableForSale &&
      variantAvailable &&
      publishedOnline &&
      hasPrice &&
      !forceEnquire
  );

  const priceLabel = (() => {
    if (isSold) return undefined;
    if (formattedPrice) return formattedPrice;
    return "Price on request";
  })();

  return {
    priceLabel,
    canPurchase,
    variantId,
  };
}

// Server component entry point for the artwork detail view.
export default async function ArtworkPage({
  params,
}: {
  params: { handle: string; artworkHandle: string };
}) {
  const { handle: exhibitionHandle, artworkHandle } = params;

  // Fetch the artwork product with the relevant metafields in a single request.
  const data = await shopifyFetch<ArtworkQuery>(ARTWORK_QUERY, {
    handle: artworkHandle,
    ns: "custom",
    exKey: "exhibitions",
    artistKey: "artist",
  });

  const product = data.product;
  if (!product) notFound();

  // Pull the headline metadata that drives the detail template.
  const artist = getArtistName(product.artistMeta);
  const year = metafieldString(product.year);
  const medium = metafieldString(product.medium);

  // Prefer the richest caption the merch team provided, falling back to Shopify copy.
  const captionHtml =
    metafieldHtml(product.fullCaption) ||
    metafieldHtml(product.caption) ||
    product.descriptionHtml ||
    (product.description ? `<p>${product.description}</p>` : undefined);

  // Additional text shown lower on the page; we merge multiple metafields into one block.
  const additionalInfoHtml =
    metafieldHtml(product.additionalInfo) ||
    metafieldHtml(product.additional) ||
    metafieldHtml(product.notes);

  // Commerce state used for pricing labels and purchase CTA logic.
  const { priceLabel, canPurchase, variantId } = deriveCommerceState(product);

  // Prepare the media gallery, ensuring the featured image leads the carousel.
  const images = product.images?.nodes?.filter((img): img is ImageNode => Boolean(img?.url)) ?? [];
  const heroImage = product.featuredImage || images[0];
  const gallery = heroImage
    ? [heroImage, ...images.filter((img) => img.url !== heroImage.url)]
    : images;

  // Dimension metafields arrive as either individual numbers or a pre-formatted string.
  const widthCm = metafieldNumber(product.widthCm);
  const heightCm = metafieldNumber(product.heightCm);
  const depthCm = metafieldNumber(product.depthCm);
  const dimensionsLabel =
    formatDimensionsCm(widthCm, heightCm, depthCm) ?? metafieldString(product.dimensions);

  // Pass the cleaned data to the client layout component which renders the full UI.
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
      canPurchase={canPurchase}
      variantId={variantId}
    />
  );
}
