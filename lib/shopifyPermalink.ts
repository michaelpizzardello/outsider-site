export function variantNumericIdFromGid(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}

export function buildCartPermalink(
  lines: Array<{ variantGid: string; quantity: number }>,
  opts?: { discount?: string }
): string {
  const safeLines = lines.filter((line) => line.variantGid && line.quantity > 0);
  if (!safeLines.length) return "https://outsidergallery.au/cart";

  const items = safeLines
    .map((line) => `${variantNumericIdFromGid(line.variantGid)}:${Math.max(1, line.quantity)}`)
    .join(",");

  const base = `https://outsidergallery.au/cart/${items}`;
  if (opts?.discount) {
    return `${base}?discount=${encodeURIComponent(opts.discount)}`;
  }
  return base;
}

export function rewriteCheckoutDomain(checkoutUrl: string, host = "outsidergallery.au"): string {
  if (!checkoutUrl) return checkoutUrl;
  try {
    const url = new URL(checkoutUrl);
    url.protocol = "https";
    url.host = host;
    return url.toString();
  } catch (error) {
    console.error("rewriteCheckoutDomain failed", error);
    return checkoutUrl;
  }
}
