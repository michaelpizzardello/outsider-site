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
import PageSubheader from "@/components/layout/PageSubheader";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import ExhibitionFeatureWhiteCube from "@/components/exhibitions/ExhibitionFeatureWhiteCube";

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

  /* 3c) RENDER WRAPPER
     - Top padding respects sticky header height via CSS var from <Header/>
     - Shared PageSubheader handles the consistent page title band */
  return (
    <main
      className="pb-10 sm:pb-12"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      <PageSubheader title="Exhibitions" />

      <Container className="mt-12 sm:mt-16">
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

          const useFeatureLayout =
            (s.key === "current" || s.key === "upcoming") && s.items.length === 1;

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

              {useFeatureLayout ? (
                <div className="mt-8">
                  <ExhibitionFeatureWhiteCube
                    ex={s.items[0]}
                    label={top}
                    ctaText={button}
                    headingLevel="h3"
                  />
                </div>
              ) : (
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
              )}
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
      <ExhibitionLabel as="p">{topLabel}</ExhibitionLabel>

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
