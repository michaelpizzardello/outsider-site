import type { ImageLoader } from "next/image";

const SHOPIFY_CDN_HOSTNAME = "cdn.shopify.com";

const toUrl = (src: string) => {
  try {
    return new URL(src);
  } catch {
    return null;
  }
};

/**
 * Shopify CDN allows requesting downscaled derivatives by passing `width` and
 * optional `quality` query parameters. Serving those directly avoids
 * downloading the multi-megabyte originals that slow down the carousel.
 */
export const shopifyImageLoader: ImageLoader = ({ src, width, quality }) => {
  const url = toUrl(src);
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
 * Mirrors `shopifyImageLoader` for cases where we need a predictable resized
 * URL outside of the Next/Image component (e.g. manual preloads).
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
  const url = toUrl(src);
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
