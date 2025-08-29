import "server-only";
import Image from "next/image";
import Link from "next/link";
import {
  fetchHomeExhibitions,
  classifyExhibitions,
  headingParts,
  formatDates,
  type ExhibitionCard,
} from "@/lib/exhibitions";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";

export const revalidate = 60;
export const dynamic = "force-static";

export const metadata = {
  title: "Exhibitions — Outsider Gallery",
  description: "Current, upcoming, and past exhibitions at Outsider Gallery.",
};

type SectionKey = "current" | "upcoming" | "past";

export default async function ExhibitionsPage() {
  // 1) Fetch and bucket using your existing helpers
  const nodes = await fetchHomeExhibitions();
  const { current, upcoming, past } = classifyExhibitions(nodes);

  // 2) Build sections in desired order; only include if they have content
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

  // Fallback: if nothing current/upcoming, make sure we still show Past
  if (!sections.length && past?.length) {
    sections.push({ key: "past", label: "Past", items: past });
  }

  return (
    // Top padding uses measured header height from Header.tsx: --header-h
    <main
      className="pb-10 sm:pb-12"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      {/* Container (inline so we keep this page server-only) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top title + anchor tabs */}
        <header className=" lg:mt-20 mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Exhibitions
          </h1>

          {sections.length > 0 && (
            <nav className="mt-4 flex items-center gap-2 text-sm">
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
        </header>

        {/* Sections */}
        {sections.map((s, idx) => {
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
              style={{ scrollMarginTop: "var(--header-h, 76px)" }}
            >
              <h2 className="text-xl font-medium">{s.label}</h2>
              <div className="mt-6 border-t border-neutral-200" />

              {/* Two per row like White Cube: 1→2 responsive */}
              <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
                {s.items.map((ex) => (
                  <article key={ex.handle} className="group">
                    <Link href={`/exhibitions/${ex.handle}`} className="block">
                      {/* Image */}
                      {ex.hero?.url && (
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={ex.hero.url}
                            alt={ex.hero.alt ?? ex.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            priority={false}
                          />
                        </div>
                      )}

                      {/* Text block */}
                      <CardText ex={ex} topLabel={top} buttonLabel={button} />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* If absolutely nothing, show a friendly empty state */}
        {sections.length === 0 && (
          <p className="py-20 text-center text-neutral-500">
            No exhibitions to show yet.
          </p>
        )}
      </div>
    </main>
  );
}

/** Server-only text block (kept here to avoid client/server import issues) */
function CardText({
  ex,
  topLabel,
  buttonLabel,
}: {
  ex: ExhibitionCard;
  topLabel: string;
  buttonLabel: string;
}) {
  const { primary, secondary } = headingParts({
    title: ex.title,
    artist: ex.artist,
    isGroup: ex.isGroup,
  });

  return (
    <div className="mt-4">
      {/* Top label from hero copy */}
      <p className="text-[11px] uppercase tracking-widest text-neutral-500">
        {topLabel}
      </p>

      <h3 className="mt-2 text-base font-medium leading-snug">
        <span className="block">{primary}</span>
        {secondary && (
          <span className="block text-neutral-500">{secondary}</span>
        )}
      </h3>

      {/* Dates or summary, then location */}
      <p className="mt-2 text-sm text-neutral-600">
        {ex.start ? formatDates(ex.start, ex.end) : ex.summary ?? ""}
      </p>
      {ex.location && <p className="text-sm text-neutral-500">{ex.location}</p>}

      {/* CTA from hero copy (underline only on hover) */}
      <p className="mt-4 inline-flex items-center text-sm">
        <span className="mr-2">→</span>
        <span className="underline-offset-4 hover:underline">
          {buttonLabel}
        </span>
      </p>
    </div>
  );
}
