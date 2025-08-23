// lib/shopify.ts
const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN!;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-07";

if (!SHOP_DOMAIN || !STOREFRONT_TOKEN) {
  throw new Error("Missing SHOPIFY env vars. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN.");
}

export async function shopifyFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(`https://${SHOP_DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify fetch failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors.map((e: any) => e.message).join("; ");
    throw new Error(`Shopify GraphQL errors: ${msg}`);
  }

  return json.data as T;
}

export function fieldsToObj(fields: { key: string; value: string }[] = []) {
  return Object.fromEntries(fields.map(f => [f.key, f.value]));
}
