// components/exhibition/ShareButton.tsx
// Purpose: Minimal share control. Tries Web Share API; falls back to copy-to-clipboard.

"use client";

import { useState } from "react";

export default function ShareButton({ url }: { url?: string }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  async function handleShare() {
    try {
      const shareUrl = url || window.location.href;

      // Prefer native share if available
      if (navigator.share) {
        await navigator.share({ title: document.title, url: shareUrl });
        setStatus("done");
        return;
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setStatus("done");
    } catch {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="underline opacity-80 hover:opacity-100"
      aria-live="polite"
    >
      {status === "done"
        ? "Link copied"
        : status === "error"
        ? "Couldn’t share"
        : "Share"}
    </button>
  );
}
