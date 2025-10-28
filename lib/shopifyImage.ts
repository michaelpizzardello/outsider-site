import type { ImageLoader } from "next/image";

const SHOPIFY_CDN_HOSTNAME = "cdn.shopify.com";

const buildShopifyUrl = (src: string) => {
  try {
    return new URL(src);
  } catch {
    return null;
  }
};

/**
 * Shopify assets accept a `width` query param that lets us request a resized
 * variant directly from the CDN. The default Next.js remote loader downloads
 * the original file first (often 8–10MB) which slows down the carousel.
 *
 * By mapping the widths requested by Next.js onto Shopify `width` parameters
 * we fetch right-sized derivatives in the first place, dramatically reducing
 * transfer sizes and improving perceived loading.
 */
export const shopifyImageLoader: ImageLoader = ({ src, width, quality }) => {
  const url = buildShopifyUrl(src);
  if (!url || url.hostname !== SHOPIFY_CDN_HOSTNAME) {
    return src;
  }

  if (width) {
    url.searchParams.set("width", String(width));
  }

  if (quality) {
    url.searchParams.set("quality", String(quality));
  }

  return url.toString();
};

/**
 * Helper that mirrors the loader logic when we need a fixed-size URL outside
 * of the Next.js loader pipeline (e.g. blur placeholders or meta tags).
 */
export const buildShopifyImageSrc = (
  src: string,
  {
    width,
    quality,
  }: {
    width?: number;
    quality?: number;
  } = {}
) => {
  const url = buildShopifyUrl(src);
  if (!url || url.hostname !== SHOPIFY_CDN_HOSTNAME) {
    return src;
  }

  if (width) {
    url.searchParams.set("width", String(width));
  }

  if (quality) {
    url.searchParams.set("quality", String(quality));
  }

  return url.toString();
};
