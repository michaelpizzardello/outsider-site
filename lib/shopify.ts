// lib/shopify.ts
export async function shopifyFetch<T>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const endpoint = `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-04/graphql.json`;
  
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store", // always fresh for dev
    });
  
    if (!res.ok) {
      throw new Error(`Shopify fetch failed: ${res.status}`);
    }
  
    return res.json();
  }
  