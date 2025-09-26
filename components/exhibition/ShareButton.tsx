"use client";

import { useState } from "react";

type Props = { url?: string };

export default function ShareButton({ url }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1500);
    }
  }

  async function onClick() {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const title = document?.title || "Share";
    const text = "Check this out";

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through to copy
      }
    }
    if (shareUrl) await copyToClipboard(shareUrl);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm leading-relaxed underline underline-offset-2 decoration-neutral-400/70 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40 rounded-[2px]"
      aria-label="Share link"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M15 8a3 3 0 100-6 3 3 0 000 6zM21 22a3 3 0 10-6 0 3 3 0 006 0zM9 15a3 3 0 10-6 0 3 3 0 006 0z" />
        <path d="M8.59 13.51l6.83-3.02M8.59 16.49l6.83 3.02" />
      </svg>
      <span>
        {status === "idle" && "Copy link"}
        {status === "copied" && "Copied!"}
        {status === "error" && "Error"}
      </span>
    </button>
  );
}
