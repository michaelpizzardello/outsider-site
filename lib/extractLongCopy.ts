// lib/extractLongCopy.ts
// Pick the best long copy from a Shopify metaobject by TYPE (not key).
import { toHtml } from "@/lib/richtext"; // If you store HTML already, you can remove this.

type Field = {
  key: string;
  type: string;           // e.g. "rich_text", "multi_line_text_field", "single_line_text_field"
  value: unknown;         // Storefront returns strings
};

function looksLikeHtml(s: string) {
  return /<\s*[a-z][\s\S]*>/i.test(s);
}

export function extractLongCopy(fields: Field[]): string | null {
  // 1) Prefer rich_text (JSON string); convert to HTML
  const rich = fields.find(f => f.type === "rich_text" || f.type === "rich_text_field");
  if (rich && typeof rich.value === "string" && rich.value.trim()) {
    return toHtml(rich.value.trim()); // toHtml returns HTML or null
  }

  // 2) Prefer anything that already looks like HTML (by key or content)
  const htmlLike = fields.find(f =>
    typeof f.value === "string" &&
    f.value.trim() &&
    (looksLikeHtml(f.value) || /html$/i.test(f.key))
  );
  if (htmlLike && typeof htmlLike.value === "string") {
    return htmlLike.value.trim();
  }

  // 3) Fall back to the longest multi_line text as the body
  const multi = fields
    .filter(f => f.type === "multi_line_text_field" && typeof f.value === "string")
    .sort((a, b) => (String(b.value).length - String(a.value).length))[0];

  if (multi && typeof multi.value === "string" && multi.value.trim()) {
    const paragraphs = String(multi.value)
      .trim()
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    return paragraphs || null;
  }

  // 4) Nothing suitable
  return null;
}
