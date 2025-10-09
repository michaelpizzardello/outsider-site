"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import clsx from "clsx";

type Props = {
  shortText?: string | null;
  longTextHtml?: string | null;
  clampLines?: number;
  className?: string;
  shortClassName?: string;
  longClassName?: string;
};

type Paragraph = { text: string; html: string };

function multilineToHtml(input: string) {
  const normalized = input.replace(/\r\n?/g, "\n");
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) =>
      `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
}

function looksLikeHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractParagraphs(raw?: string | null): Paragraph[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (looksLikeHtml(trimmed)) {
    const segments: Paragraph[] = [];
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match: RegExpExecArray | null;
    while ((match = paragraphRegex.exec(trimmed)) !== null) {
      const html = match[0];
      const text = stripHtml(html);
      if (text) segments.push({ text, html });
    }

    if (segments.length) return segments;

    const text = stripHtml(trimmed);
    if (!text) return [];
    return [
      {
        text,
        html: trimmed,
      },
    ];
  }

  const normalized = trimmed.replace(/\r\n?/g, "\n");
  return normalized
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => ({
      text: segment.replace(/\s+/g, " ").trim(),
      html: `<p>${segment.replace(/\n/g, "<br/>")}</p>`,
    }));
}

export default function ExpandableText({
  shortText,
  longTextHtml,
  clampLines = 10,
  className,
  shortClassName,
  longClassName,
}: Props) {
  const clampedRef = useRef<HTMLDivElement | null>(null);
  const fullRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  const shortSegments = useMemo(() => extractParagraphs(shortText), [shortText]);
  const longSegments = useMemo(() => extractParagraphs(longTextHtml), [longTextHtml]);

  const shortHtml = useMemo(
    () => (shortSegments.length ? shortSegments.map((p) => p.html).join("") : null),
    [shortSegments]
  );

  const longHtml = useMemo(
    () => (longSegments.length ? longSegments.map((p) => p.html).join("") : null),
    [longSegments]
  );

  const hasShort = shortSegments.length > 0;
  const hasLong = longSegments.length > 0;

  const remainderSegments = useMemo(() => {
    if (!hasLong) return [] as Paragraph[];
    if (!hasShort) return longSegments;

    let idx = 0;
    const limit = Math.min(shortSegments.length, longSegments.length);
    while (idx < limit) {
      if (longSegments[idx].text !== shortSegments[idx].text) break;
      idx += 1;
    }
    return longSegments.slice(idx);
  }, [hasLong, hasShort, longSegments, shortSegments]);

  const hasRemainder = remainderSegments.length > 0;

  useEffect(() => {
    setExpanded(false);
  }, [shortHtml, longHtml]);

  useEffect(() => {
    if (hasShort) {
      setShowToggle(Boolean(hasLong && hasRemainder));
      return;
    }

    if (!hasLong) {
      setShowToggle(false);
      return;
    }

    const c = clampedRef.current;
    const f = fullRef.current;
    if (!c || !f) return;
    setShowToggle(f.scrollHeight - c.clientHeight > 8);
  }, [hasShort, hasLong, hasRemainder, longHtml, clampLines]);

  if (!hasShort && !hasLong) return null;

  const expandedHtml = useMemo(
    () =>
      remainderSegments.length
        ? remainderSegments.map((p) => p.html).join("")
        : null,
    [remainderSegments]
  );

  const shouldClamp = !hasShort && !expanded && hasLong;
  const clampStyle: CSSProperties | undefined = shouldClamp
    ? {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: String(clampLines),
        overflow: "hidden",
      }
    : undefined;

  return (
    <div
      className={clsx(
        "text-base leading-relaxed lg:text-lg lg:leading-8",
        className
      )}
    >
      {hasShort ? (
        <>
          <div
            className={clsx(
              "prose prose-lg md:prose-xl max-w-none whitespace-pre-line space-y-6 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4",
              shortClassName
            )}
            dangerouslySetInnerHTML={{ __html: shortHtml! }}
          />

          {showToggle && (
            <>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="group inline-flex items-center gap-4 bg-transparent p-0 text-sm font-medium md:text-base appearance-none border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40 rounded-[2px]"
                >
                  <svg
                    aria-hidden
                    className={`h-[12px] w-[15px] fill-current transition-transform duration-200 origin-center ${expanded ? "rotate-90" : "rotate-0"}`}
                    viewBox="0 0 15 12"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7.951 1.22621L11.5547 4.82909L0.257681 4.82892L0.257682 6.50579L11.5547 6.50562L7.951 10.1085L9.12473 11.2822L14.7388 5.66732L9.12473 0.0524227L7.951 1.22621Z" />
                  </svg>
                  <span className="underline decoration-1 underline-offset-[6px]">
                    {expanded ? "Read less" : "Read more"}
                  </span>
                </button>
              </div>

              {expanded && hasLong && (
                <div
                  className={clsx(
                    "mt-6 prose max-w-none whitespace-pre-line space-y-6 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4",
                    longClassName
                  )}
                  dangerouslySetInnerHTML={{ __html: expandedHtml ?? longHtml! }}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div ref={clampedRef} className="relative" style={clampStyle}>
            {shouldClamp && showToggle && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0), #fff)",
                }}
              />
            )}

            <div
              className={clsx(
                "prose max-w-none whitespace-pre-line space-y-6 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4",
                longClassName
              )}
              dangerouslySetInnerHTML={{ __html: longHtml ?? "" }}
            />
          </div>

          {showToggle && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="group inline-flex items-center gap-4 bg-transparent p-0 text-sm font-medium md:text-base appearance-none border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40 rounded-[2px]"
              >
                <svg
                  aria-hidden
                  className={`h-[12px] w-[15px] fill-current transition-transform duration-200 origin-center ${expanded ? "rotate-90" : "rotate-0"}`}
                  viewBox="0 0 15 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7.951 1.22621L11.5547 4.82909L0.257681 4.82892L0.257682 6.50579L11.5547 6.50562L7.951 10.1085L9.12473 11.2822L14.7388 5.66732L9.12473 0.0524227L7.951 1.22621Z" />
                </svg>
                <span className="underline decoration-1 underline-offset-[6px]">
                  {expanded ? "Read less" : "Read more"}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {!hasShort && hasLong && (
        <div
          ref={fullRef}
          className="absolute left-[-9999px] top-[-9999px] w-[600px] whitespace-pre-line"
          aria-hidden
        >
          <div
            className="whitespace-pre-line space-y-6"
            dangerouslySetInnerHTML={{ __html: longHtml }}
          />
        </div>
      )}
    </div>
  );
}
