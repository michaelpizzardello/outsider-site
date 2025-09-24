export function variantNumericIdFromGid(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}

export function buildCartPermalink(
  lines: Array<{ variantGid: string; quantity: number }>,
  opts?: { discount?: string }
): string {
  const safeLines = lines.filter((line) => line.variantGid && line.quantity > 0);
  if (!safeLines.length) return "https://shop.outsidergallery.com.au/cart";

  const items = safeLines
    .map((line) => `${variantNumericIdFromGid(line.variantGid)}:${Math.max(1, line.quantity)}`)
    .join(",");

  const base = `https://shop.outsidergallery.au/cart/${items}`;
  if (opts?.discount) {
    return `${base}?discount=${encodeURIComponent(opts.discount)}`;
  }
  return base;
}
