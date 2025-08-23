import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify";

export async function GET() {
  const q = `
    query Peek {
      metaobjects(type: "artist", first: 1) {
        nodes {
          handle
          fields {
            key
            type
            value
            reference { __typename }
          }
        }
      }
    }`;
  const data = await shopifyFetch<any>(q);
  return NextResponse.json(data);
}
