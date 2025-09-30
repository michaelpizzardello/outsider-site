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
  - Labels centralize CTA copy (micro labels suppressed on index)
──────────────────────────────────────────────────────────────────────────────*/

import "server-only";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

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
import { ArrowCtaInline } from "@/components/ui/ArrowCta";

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
  if (past?.length)
    sections.push({ key: "past", label: "Past Exhibitions", items: past });
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

      <div className="bg-neutral-100 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <Container>
          {/* 3d) SECTIONS
              Each: heading + divider + responsive 1→2 grid of cards */}
          {sections.map((s, idx) => {
            // Map bucket → hero copy (CTA text, label unused here)
            const labelKey = (
              s.key === "current"
                ? "CURRENT EXHIBITION"
                : s.key === "upcoming"
                ? "UPCOMING EXHIBITION"
                : "PAST EXHIBITION"
            ) as PickHeroLabel;

            const { top, button } = heroLabels(labelKey);

            const useFeatureLayout =
              (s.key === "current" || s.key === "upcoming") &&
              s.items.length === 1;
            const showHeading = s.key === "past";
            const showMicroLabel = !showHeading;
            const bodyOffsetClass = showHeading ? "mt-8" : "mt-0";

            return (
              <section
                key={s.key}
                id={s.key}
                className={clsx(
                  "relative pb-10 sm:pb-12",
                  idx === 0 && "pt-0 sm:pt-0",
                  idx > 0 && "pt-10 sm:pt-12"
                )}
                style={{ scrollMarginTop: "var(--header-h, 76px)" }} // anchor offset
              >
                {idx > 0 && (
                  <div
                    className="absolute left-1/2 top-0 h-px w-screen -translate-x-1/2 border-t border-neutral-200"
                    aria-hidden="true"
                  />
                )}
                {/* Section heading (full-width divider rendered above) */}
                {showHeading && (
                  <h2 className="mb-12 text-3xl font-NORMAL">{s.label}</h2>
                )}

                {useFeatureLayout ? (
                  <div className={bodyOffsetClass}>
                    <ExhibitionFeatureWhiteCube
                      ex={s.items[0]}
                      label={showMicroLabel ? top : undefined}
                      ctaText={button}
                      headingLevel="h3"
                    />
                  </div>
                ) : (
                  <div
                    className={clsx(
                      bodyOffsetClass,
                      "grid grid-cols-1 gap-10 md:grid-cols-2"
                    )}
                  >
                    {s.items.map((ex) => (
                      <article key={ex.handle} className="group">
                        {/* Full-card link to detail route */}
                        <Link
                          href={`/exhibitions/${ex.handle}`}
                          className="block"
                        >
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
                          <CardText
                            ex={ex}
                            topLabel={showMicroLabel ? top : undefined}
                            buttonLabel={button}
                          />
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
      </div>
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
  topLabel?: string;
  buttonLabel: string;
}) {
  // Split title/artist for two-line lockup
  const { primary, secondary } = headingParts({
    title: ex.title,
    artist: ex.artist,
    isGroup: ex.isGroup,
  });

  return (
    <div className="mt-4 ">
      {/* Micro top label (CURRENT / UPCOMING / PAST EXHIBITION) */}
      {topLabel ? <ExhibitionLabel as="p">{topLabel}</ExhibitionLabel> : null}

      {/* Title lockup */}
      <h3 className="mt-2 text-base font-medium leading-snug">
        <span className="text-xl block">{primary}</span>
        {secondary && (
          <span className="block font-light text-lg">{secondary}</span>
        )}
      </h3>

      {/* Dates preferred; summary fallback; optional location */}
      <p className="mt-2 text-sm text-neutral-600">
        {ex.start ? formatDates(ex.start, ex.end) : ex.summary ?? ""}
      </p>
      {/* {ex.location && <p className="text-sm text-neutral-500">{ex.location}</p>} */}

      {/* CTA (arrow + underline on hover) */}
      <ArrowCtaInline label={buttonLabel} className="mt-4" underline={false} />
    </div>
  );
}
// #endregion CardText
