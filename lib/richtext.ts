// lib/richtext.ts
// -----------------------------------------------------------------------------
// Why this exists:
// Shopify metaobject fields of type `rich_text` return a JSON document,
// not HTML. If you store HTML in a separate field (e.g. "bodyHtml"),
// you can DELETE this file and skip conversion entirely.
//
// toHtml(...) takes: JSON string from `rich_text`, plain HTML, or plain text.
// It returns: safe-ish HTML for rendering (basic tags: p, strong/em, lists, links).
// This avoids shipping a heavy client parser and keeps everything server-side.
// -----------------------------------------------------------------------------

function escHtml(s: string) {
    return s.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
  }
  
  function escAttr(s: string) {
    return escHtml(s).replace(/'/g, "&#39;");
  }
  
  // Recursively render the minimal subset we need from Shopify's rich text AST.
  function render(node: any): string {
    if (!node) return "";
    if (Array.isArray(node)) return node.map(render).join("");
  
    const children = (node.children || []).map(render).join("");
  
    switch (node.type) {
      case "root":         return children;
      case "paragraph":    return `<p>${children}</p>`;
      case "text": {
        let out = escHtml(String(node.value ?? ""));
        if (node.bold) out = `<strong>${out}</strong>`;
        if (node.italic) out = `<em>${out}</em>`;
        if (node.underline) out = `<u>${out}</u>`;
        if (node.code) out = `<code>${out}</code>`;
        return out;
      }
      case "heading": {
        const lvl = Math.max(1, Math.min(6, Number(node.level) || 2));
        return `<h${lvl}>${children}</h${lvl}>`;
      }
      case "link": {
        const href = escAttr(String(node.url || node.href || "#"));
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${children}</a>`;
      }
      case "list": {
        const tag = node.listType === "number" || node.listType === "ordered" ? "ol" : "ul";
        return `<${tag}>${children}</${tag}>`;
      }
      case "list-item":    return `<li>${children}</li>`;
      case "line_break":
      case "lineBreak":    return "<br/>";
      default:             return children; // Unknown node: render inner content.
    }
  }
  
  /** Accepts rich_text JSON string, plain HTML, or plain text. Returns HTML. */
  export function toHtml(input?: string | null): string | null {
    if (!input) return null;
    const s = String(input).trim();
    if (!s) return null;
  
    // 1) If it's already HTML-ish, use it as-is (e.g. you stored bodyHtml)
    if (s.includes("<") && s.includes(">")) return s;
  
    // 2) Try to parse JSON rich_text from Shopify
    try {
      const json = JSON.parse(s);
      return render(json);
    } catch {
      // 3) Plain text fallback: split paragraphs on blank lines, keep single newlines
      const parts = s.split(/\n{2,}/).map(p => `<p>${escHtml(p).replace(/\n/g, "<br/>")}</p>`);
      return parts.join("");
    }
  }
  