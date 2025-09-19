"use client";

import { useEffect, useRef, useState } from "react";

type Dateish = Date | string | null | undefined;

type Props = { html: string; clampLines?: number };

export default function ExpandableText({ html, clampLines = 10 }: Props) {
  const clampedRef = useRef<HTMLDivElement | null>(null);
  const fullRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    const c = clampedRef.current,
      f = fullRef.current;
    if (!c || !f) return;
    setShowToggle(f.scrollHeight - c.clientHeight > 8);
  }, [html, clampLines]);

  return (
    <div className="typ-body">
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
        {!expanded && showToggle && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0), #fff)",
            }}
          />
        )}

        {/* Slightly smaller text only on ~900–1279px */}
        <div
          className="prose max-w-none prose-p:mb-4 prose-ul:my-4 prose-ol:my-4 typ-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {showToggle && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="appearance-none bg-transparent border-none p-0
                       inline-flex items-center gap-2 typ-body-small underline decoration-neutral-400/70
                       hover:decoration-current focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-neutral-400/40 rounded-[2px]"
          >
            <svg
              className="h-4 w-4 translate-y-[1px] transition-transform"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
            <span>{expanded ? "Read less" : "Read more"}</span>
          </button>
        </div>
      )}

      {/* off-screen for measurement */}
      <div
        ref={fullRef}
        className="absolute left-[-9999px] top-[-9999px] w-[600px]"
        aria-hidden
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
