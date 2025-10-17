import { shopifyFetch } from "@/lib/shopify";
import { toHtml } from "@/lib/richtext";

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          totalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            quantityAvailable
            price {
              amount
              currencyCode
            }
            product {
              id
              title
              handle
              featuredImage { url width height altText }
              vendor
              artistField: metafield(namespace: "custom", key: "artist") {
                value
                reference {
                  __typename
                  ... on Metaobject {
                    fields { key value }
                  }
                }
              }
              yearField: metafield(namespace: "custom", key: "year") { value }
              mediumField: metafield(namespace: "custom", key: "medium") { value }
              dimensionsField: metafield(namespace: "custom", key: "dimensions") { value }
              widthField: metafield(namespace: "custom", key: "width") { value }
              heightField: metafield(namespace: "custom", key: "height") { value }
              depthField: metafield(namespace: "custom", key: "depth") { value }
              additionalInfoField: metafield(namespace: "custom", key: "additional_info") { value type }
            }
          }
        }
      }
    }
  }
`;

type MoneyV2 = {
  amount: string;
  currencyCode: string;
};

export type CartVariantProduct = {
  id: string;
  title: string;
  handle: string;
  vendor?: string | null;
  featuredImage?: { url: string; width?: number | null; height?: number | null; altText?: string | null } | null;
  artist?: string | null;
  year?: string | null;
  medium?: string | null;
  dimensions?: string | null;
  additionalInfo?: string | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  merchandiseTitle: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: MoneyV2 | null;
  costTotal: MoneyV2 | null;
  product: CartVariantProduct | null;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
  };
  lines: CartLine[];
};

function norm(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function looksLikeHtml(value: string) {
  return /<\s*[a-z][\s\S]*>/i.test(value);
}

function htmlToPlainText(html: string): string | null {
  const withBreaks = html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const normalised = withBreaks
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return normalised.length ? normalised : null;
}

function metafieldToPlainText(field: any): string | null {
  const value = norm(field?.value);
  if (!value) return null;
  const type = field?.type ?? "";
  if (typeof type === "string" && type.includes("rich_text")) {
    const html = toHtml(value);
    return html ? htmlToPlainText(html) : null;
  }
  if (looksLikeHtml(value)) {
    return htmlToPlainText(value);
  }
  return value;
}

function getArtistName(field: any, fallback?: string | null): string | null {
  const direct = norm(field?.value);
  const ref = field?.reference;
  if (ref?.__typename === "Metaobject" && Array.isArray(ref.fields)) {
    const fields = ref.fields as Array<{ key?: string | null; value?: string | null }>;
    const byKey = (key: string) =>
      fields.find((entry) => entry?.key?.toLowerCase() === key.toLowerCase())?.value ?? null;
    const possible = [
      byKey("name"),
      byKey("full_name"),
      byKey("fullName"),
      byKey("title"),
    ]
      .map(norm)
      .find(Boolean);
    if (possible) return possible;
  }
  return direct ?? norm(fallback);
}

function metafieldNumber(field: any): number | null {
  const value = norm(field?.value);
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatDimensionsCm(width?: number | null, height?: number | null, depth?: number | null): string | null {
  const format = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
  const parts = [];
  if (typeof width === "number" && Number.isFinite(width)) parts.push(format(width));
  if (typeof height === "number" && Number.isFinite(height)) parts.push(format(height));
  if (typeof depth === "number" && Number.isFinite(depth)) parts.push(format(depth));
  if (!parts.length) return null;
  return `${parts.join(" x ")} cm`;
}

function mapCartLine(node: any): CartLine {
  const merchandise = node?.merchandise ?? null;
  const productNode = merchandise?.product;
  const widthCm = metafieldNumber(productNode?.widthField);
  const heightCm = metafieldNumber(productNode?.heightField);
  const depthCm = metafieldNumber(productNode?.depthField);
  const dimensionsLabel =
    formatDimensionsCm(widthCm, heightCm, depthCm) ?? norm(productNode?.dimensionsField?.value);
  return {
    id: node?.id,
    quantity: node?.quantity ?? 0,
    merchandiseId: merchandise?.id,
    merchandiseTitle: merchandise?.title ?? "",
    availableForSale: merchandise?.availableForSale ?? false,
    quantityAvailable: merchandise?.quantityAvailable ?? null,
    price: merchandise?.price ?? null,
    costTotal: node?.cost?.totalAmount ?? null,
    product: productNode
      ? {
          id: productNode.id,
          title: productNode.title,
          handle: productNode.handle,
          vendor: productNode.vendor,
          featuredImage: productNode.featuredImage ?? null,
          artist: getArtistName(productNode.artistField, productNode.vendor),
          year: norm(productNode.yearField?.value),
          medium: norm(productNode.mediumField?.value),
          dimensions: dimensionsLabel,
          additionalInfo: metafieldToPlainText(productNode.additionalInfoField),
        }
      : null,
  };
}

function mapCart(data: any): Cart | null {
  if (!data) return null;
  const lines = data.lines?.nodes?.map(mapCartLine) ?? [];
  return {
    id: data.id,
    checkoutUrl: data.checkoutUrl,
    totalQuantity: data.totalQuantity ?? 0,
    cost: {
      subtotalAmount: data.cost?.subtotalAmount ?? { amount: "0", currencyCode: "USD" },
      totalAmount: data.cost?.totalAmount ?? { amount: "0", currencyCode: "USD" },
    },
    lines,
  };
}

const CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        ...CartFields
      }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_QUERY = /* GraphQL */ `
  query CartQuery($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

const ADD_LINES_MUTATION = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const UPDATE_LINES_MUTATION = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const REMOVE_LINES_MUTATION = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartCreate(lines?: Array<{ merchandiseId: string; quantity?: number }>) {
  const res = await shopifyFetch<any>(CREATE_MUTATION, {
    input: lines?.length ? { lines } : undefined,
  });
  const payload = res?.cartCreate;
  if (payload?.userErrors?.length) {
    throw new Error(payload.userErrors.map((e: any) => e.message).join("; "));
  }
  return mapCart(payload?.cart);
}

export async function cartFetch(cartId: string) {
  const res = await shopifyFetch<any>(CART_QUERY, { id: cartId });
  return mapCart(res?.cart);
}

export async function cartLinesAdd(cartId: string, lines: Array<{ merchandiseId: string; quantity?: number; sellingPlanId?: string; attributes?: Array<{ key: string; value: string }> }>) {
  const res = await shopifyFetch<any>(ADD_LINES_MUTATION, { cartId, lines });
  const payload = res?.cartLinesAdd;
  if (payload?.userErrors?.length) {
    throw new Error(payload.userErrors.map((e: any) => e.message).join("; "));
  }
  return mapCart(payload?.cart);
}

export async function cartLinesUpdate(cartId: string, lines: Array<{ id: string; quantity?: number; attributes?: Array<{ key: string; value: string }> }>) {
  const res = await shopifyFetch<any>(UPDATE_LINES_MUTATION, { cartId, lines });
  const payload = res?.cartLinesUpdate;
  if (payload?.userErrors?.length) {
    throw new Error(payload.userErrors.map((e: any) => e.message).join("; "));
  }
  return mapCart(payload?.cart);
}

export async function cartLinesRemove(cartId: string, lineIds: string[]) {
  const res = await shopifyFetch<any>(REMOVE_LINES_MUTATION, { cartId, lineIds });
  const payload = res?.cartLinesRemove;
  if (payload?.userErrors?.length) {
    throw new Error(payload.userErrors.map((e: any) => e.message).join("; "));
  }
  return mapCart(payload?.cart);
}
