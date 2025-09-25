/*╔══════════════════════════════════════════════════════════════════════════╗*\
║  EXHIBITIONS INDEX (SERVER COMPONENT)                                      ║
║  - Current → Upcoming → Past                                               ║
║  - Data via lib/exhibitions helpers (Shopify metaobjects)                  ║
║  - Static generation with ISR (revalidate = 60s)                           ║
║                                                                            ║
║  MAP                                                                       ║
║    1) Imports & Config                                                     ║
║    2) Types                                                                ║
║    3) Page (fetch, bucket, sections, render)                               ║
║    4) CardText (server-side subcomponent)                                  ║
\*╚══════════════════════════════════════════════════════════════════════════╝*/

/*─────────────────────────────────────────────────────────────────────────────
  1) IMPORTS & CONFIG
  - Keep this file server-only
  - Labels power the micro top label and CTA on each card
──────────────────────────────────────────────────────────────────────────────*/

import "server-only";
import Image from "next/image";
import Link from "next/link";

import {
  fetchHomeExhibitions, // server fetch to Shopify
  classifyExhibitions, // { current, upcoming, past }
  headingParts, // split title/artist → primary/secondary
  formatDates, // "12 Jan — 2 Feb 2026"
  type ExhibitionCard,
} from "@/lib/exhibitions";

import { heroLabels, type PickHeroLabel } from "@/lib/labels";
import Container from "@/components/layout/Container";

// ISR cadence
export const revalidate = 60;
// Ensure static output for this route
export const dynamic = "force-static";

// Route metadata
export const metadata = {
  title: "Exhibitions — Outsider Gallery",
  description: "Current, upcoming, and past exhibitions at Outsider Gallery.",
};

/*─────────────────────────────────────────────────────────────────────────────
  2) TYPES
──────────────────────────────────────────────────────────────────────────────*/

type SectionKey = "current" | "upcoming" | "past";

/*─────────────────────────────────────────────────────────────────────────────
  3) PAGE COMPONENT
  - Fetch → Bucket → Build sections → Render
──────────────────────────────────────────────────────────────────────────────*/

// #region Page
export default async function ExhibitionsPage() {
  /* 3a) FETCH & BUCKET
     Pull home exhibitions and classify into three buckets. */
  const nodes = await fetchHomeExhibitions();
  const { current, upcoming, past } = classifyExhibitions(nodes);

  /* 3b) BUILD SECTIONS
     Order: Current → Upcoming → Past. Include only non-empty buckets.
     Fallback: Past-only if nothing else exists. */
  const sections: Array<{
    key: SectionKey;
    label: string;
    items: ExhibitionCard[];
  }> = [];
  if (current)
    sections.push({ key: "current", label: "Current", items: [current] });
  if (upcoming?.length)
    sections.push({ key: "upcoming", label: "Upcoming", items: upcoming });
  if (past?.length) sections.push({ key: "past", label: "Past", items: past });
  if (!sections.length && past?.length)
    sections.push({ key: "past", label: "Past", items: past });

  /* Build a small locations list (for the White-Cube-like row under H1).
     Purely presentational; no filtering implied here. */
  const uniqueLocations = Array.from(
    new Set(
      sections.flatMap(
        (s) => s.items.map((ex) => ex.location).filter(Boolean) as string[]
      )
    )
  );

  /* 3c) RENDER WRAPPER + HEADER
     - Top padding respects sticky header height via CSS var from <Header/>
     - The header band uses the SAME container as the body so gutters align
     - Row 1: H1 (left) + pills (right)
     - Row 2: small location links under H1 (left) */
  return (
    <main
      className="pb-10 sm:pb-12"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      {/* Container */}
      <Container>
        {/* HEADER BAND (White Cube pattern) */}
        <header className="mt-10 md:mt-10 lg:mt-20 mb-8 sm:mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-12 items-baseline gap-x-8">
            {/* H1 — left column */}
            <h1 className="col-span-7 text-3xl sm:text-4xl font-semibold tracking-tight">
              Exhibitions
            </h1>

            {/* Pills — right column, same row as H1 */}
            {sections.length > 0 && (
              <nav className="col-span-5 mt-3 sm:mt-0 justify-self-start sm:justify-self-end flex flex-wrap items-center gap-2 text-sm">
                {sections.map((s) => (
                  <a
                    key={s.key}
                    href={`#${s.key}`}
                    className="rounded-full border border-neutral-300 px-3 py-1 hover:border-black"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            )}

            {/* Locations row — under H1, small text links (optional) */}
            {uniqueLocations.length > 0 && (
              <nav className="col-span-7 row-start-2 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700">
                {uniqueLocations.map((loc) => (
                  <span
                    key={loc}
                    className="hover:underline underline-offset-4"
                  >
                    {loc}
                  </span>
                ))}
              </nav>
            )}
          </div>
        </header>

        {/* 3d) SECTIONS
            Each: heading + divider + responsive 1→2 grid of cards */}
        {sections.map((s, idx) => {
          // Map bucket → hero copy (micro top label + CTA text)
          const labelKey = (
            s.key === "current"
              ? "CURRENT EXHIBITION"
              : s.key === "upcoming"
              ? "UPCOMING EXHIBITION"
              : "PAST EXHIBITION"
          ) as PickHeroLabel;

          const { top, button } = heroLabels(labelKey);

          return (
            <section
              key={s.key}
              id={s.key}
              className={idx > 0 ? "mt-12 sm:mt-16" : ""}
              style={{ scrollMarginTop: "var(--header-h, 76px)" }} // anchor offset
            >
              {/* Section title + hairline divider */}
              <h2 className="text-xl font-medium">{s.label}</h2>
              <div className="mt-6 border-t border-neutral-200" />

              {/* Cards grid: 1 col on mobile, 2 cols from md */}
              <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
                {s.items.map((ex) => (
                  <article key={ex.handle} className="group">
                    {/* Full-card link to detail route */}
                    <Link href={`/exhibitions/${ex.handle}`} className="block">
                      {/* Media (4:3). Hover: subtle zoom */}
                      {ex.hero?.url && (
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={ex.hero.url}
                            alt={ex.hero.alt ?? ex.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            priority={false} // only the actual homepage hero should be priority
                          />
                        </div>
                      )}

                      {/* Server-side text block keeps bundle lean */}
                      <CardText ex={ex} topLabel={top} buttonLabel={button} />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty state (rare) */}
        {sections.length === 0 && (
          <p className="py-20 text-center text-neutral-500">
            No exhibitions to show yet.
          </p>
        )}
      </Container>
    </main>
  );
}
// #endregion Page

/*─────────────────────────────────────────────────────────────────────────────
  4) CARD TEXT (server-only)
  - Title split (primary/secondary), dates/summary, location, CTA
  - Minimal DOM, consistent vertical rhythm
──────────────────────────────────────────────────────────────────────────────*/

// #region CardText
function CardText({
  ex,
  topLabel,
  buttonLabel,
}: {
  ex: ExhibitionCard;
  topLabel: string;
  buttonLabel: string;
}) {
  // Split title/artist for two-line lockup
  const { primary, secondary } = headingParts({
    title: ex.title,
    artist: ex.artist,
    isGroup: ex.isGroup,
  });

  return (
    <div className="mt-4">
      {/* Micro top label (CURRENT / UPCOMING / PAST EXHIBITION) */}
      <p className="text-[11px] uppercase tracking-widest text-neutral-500">
        {topLabel}
      </p>

      {/* Title lockup */}
      <h3 className="mt-2 text-base font-medium leading-snug">
        <span className="block">{primary}</span>
        {secondary && (
          <span className="block text-neutral-500">{secondary}</span>
        )}
      </h3>

      {/* Dates preferred; summary fallback; optional location */}
      <p className="mt-2 text-sm text-neutral-600">
        {ex.start ? formatDates(ex.start, ex.end) : ex.summary ?? ""}
      </p>
      {ex.location && <p className="text-sm text-neutral-500">{ex.location}</p>}

      {/* CTA (arrow + underline on hover) */}
      <p className="mt-4 inline-flex items-center text-sm">
        <span className="mr-2">→</span>
        <span className="underline-offset-4 hover:underline">
          {buttonLabel}
        </span>
      </p>
    </div>
  );
}
// #endregion CardText
