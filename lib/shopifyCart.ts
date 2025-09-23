import { shopifyFetch } from "@/lib/shopify";

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
              artistField: metafield(namespace: "custom", key: "artist") { value }
              yearField: metafield(namespace: "custom", key: "year") { value }
              mediumField: metafield(namespace: "custom", key: "medium") { value }
              dimensionsField: metafield(namespace: "custom", key: "dimensions") { value }
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
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  merchandiseTitle: string;
  availableForSale: boolean;
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

function mapCartLine(node: any): CartLine {
  const merchandise = node?.merchandise ?? null;
  const product = merchandise?.product;
  return {
    id: node?.id,
    quantity: node?.quantity ?? 0,
    merchandiseId: merchandise?.id,
    merchandiseTitle: merchandise?.title ?? "",
    availableForSale: merchandise?.availableForSale ?? false,
    price: merchandise?.price ?? null,
    costTotal: node?.cost?.totalAmount ?? null,
    product: product
      ? {
          id: product.id,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          featuredImage: product.featuredImage ?? null,
          artist: product.artistField?.value ?? null,
          year: product.yearField?.value ?? null,
          medium: product.mediumField?.value ?? null,
          dimensions: product.dimensionsField?.value ?? null,
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
