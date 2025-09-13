// components/exhibition/ExpandableText.tsx
// Purpose: Clamp rich text to N lines with a subtle fade and a Read more / less toggle.
// Implementation detail:
// - Uses CSS -webkit-line-clamp (no Tailwind plugin required).
// - Renders a hidden, unclamped clone to detect if toggling is needed.

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  html: string;
  clampLines?: number; // default 10–12 looks like White Cube; we pass 12 from Details
};

export default function ExpandableText({ html, clampLines = 10 }: Props) {
  const clampedRef = useRef<HTMLDivElement | null>(null);
  const fullRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    // Compare heights between clamped and full blocks to decide if toggle is needed
    const clamped = clampedRef.current;
    const full = fullRef.current;
    if (!clamped || !full) return;
    // Small buffer accounts for rounding/layout differences
    const needsToggle = full.scrollHeight - clamped.clientHeight > 8;
    setShowToggle(needsToggle);
  }, [html, clampLines]);

  return (
    <div className="text-base leading-relaxed">
      {/* Visible (clamped / expanded) */}
      <div
        ref={clampedRef}
        className="relative"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical" as any,
                WebkitLineClamp: clampLines as any,
                overflow: "hidden",
              }
        }
      >
        {/* Fade overlay when clamped */}
        {!expanded && showToggle ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))",
            }}
          />
        ) : null}

        <div
          className="prose max-w-none prose-p:mb-4 prose-ul:my-4 prose-ol:my-4"
          // Your site styles already normalise typography; keep it minimal.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Toggle */}
      {showToggle && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
          >
            {/* Simple caret glyph (no extra deps) */}
            <span
              className="inline-block transition-transform"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
              aria-hidden
            >
              ▼
            </span>
            {expanded ? "Read less" : "Read more"}
          </button>
        </div>
      )}

      {/* Hidden full content for measurement (unclamped) */}
      <div
        ref={fullRef}
        className="absolute left-[-9999px] top-[-9999px] w-[600px]" // width approximates measure
        aria-hidden
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
