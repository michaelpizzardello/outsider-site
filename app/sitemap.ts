import type { MetadataRoute } from "next";

import { shopifyFetch } from "@/lib/shopify";
import { siteConfig, getAbsoluteUrl } from "@/lib/siteConfig";
import { isDraftStatus } from "@/lib/isDraftStatus";

type MetaobjectField = {
  key: string;
  value?: string | null;
};

type ExhibitionNode = {
  handle: string;
  updatedAt?: string | null;
  fields: MetaobjectField[];
};

type ArtistNode = {
  handle: string;
  updatedAt?: string | null;
};

type ProductNode = {
  handle: string;
  updatedAt?: string | null;
  onlineStoreUrl?: string | null;
  status?: string | null;
};

type ExhibitionsQuery = {
  metaobjects: { nodes: ExhibitionNode[] } | null;
};

type ArtistsQuery = {
  metaobjects: { nodes: ArtistNode[] } | null;
};

type ProductsQuery = {
  products: { nodes: ProductNode[] } | null;
};

function fieldValue(fields: MetaobjectField[], key: string) {
  return fields.find((field) => field.key === key)?.value ?? null;
}

async function fetchExhibitionUrls() {
  try {
    const data = await shopifyFetch<ExhibitionsQuery>(
      /* GraphQL */ `
        query SitemapExhibitions($first: Int = 250) {
          metaobjects(type: "exhibitions", first: $first, reverse: true) {
            nodes {
              handle
              updatedAt
              fields {
                key
                value
              }
            }
          }
        }
      `,
      { first: 250 }
    );

    const nodes = data.metaobjects?.nodes ?? [];

    return nodes
      .filter((node) => !isDraftStatus(fieldValue(node.fields, "status") ?? undefined))
      .map((node) => ({
        url: getAbsoluteUrl(`/exhibitions/${node.handle}`),
        lastModified: node.updatedAt ? new Date(node.updatedAt) : undefined,
      }));
  } catch (error) {
    console.error("[sitemap] failed to fetch exhibitions", error);
    return [];
  }
}

async function fetchArtistUrls() {
  try {
    const data = await shopifyFetch<ArtistsQuery>(
      /* GraphQL */ `
        query SitemapArtists($first: Int = 250) {
          metaobjects(type: "artist", first: $first, reverse: true) {
            nodes {
              handle
              updatedAt
            }
          }
        }
      `,
      { first: 250 }
    );

    const nodes = data.metaobjects?.nodes ?? [];

    return nodes.map((node) => ({
      url: getAbsoluteUrl(`/artists/${node.handle}`),
      lastModified: node.updatedAt ? new Date(node.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error("[sitemap] failed to fetch artists", error);
    return [];
  }
}

async function fetchArtworkUrls() {
  try {
    const data = await shopifyFetch<ProductsQuery>(
      /* GraphQL */ `
        query SitemapProducts($first: Int = 250) {
          products(
            first: $first
            sortKey: UPDATED_AT
            reverse: true
            query: "status:active"
          ) {
            nodes {
              handle
              updatedAt
              status
            }
          }
        }
      `,
      { first: 250 }
    );

    const nodes = data.products?.nodes ?? [];

    return nodes
      .filter((node) => (node.status ?? "").toLowerCase() === "active")
      .map((node) => ({
        url: getAbsoluteUrl(`/artworks/${node.handle}`),
        lastModified: node.updatedAt ? new Date(node.updatedAt) : undefined,
      }));
  } catch (error) {
    console.error("[sitemap] failed to fetch artworks", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl.replace(/\/+$/, "");

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/exhibitions`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/artists`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/stockroom`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const [exhibitions, artists, artworks] = await Promise.all([
      fetchExhibitionUrls(),
      fetchArtistUrls(),
      fetchArtworkUrls(),
    ]);

    return [...staticUrls, ...exhibitions, ...artists, ...artworks];
  } catch (error) {
    console.error("[sitemap] unexpected error", error);
    return staticUrls;
  }
}
