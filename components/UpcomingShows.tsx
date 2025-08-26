// components/UpcomingShows.tsx (server component)
import Container from "@/components/Container";
import Image from "next/image";
import Link from "next/link";
import labels, { type LabelKey } from "@/lib/labels";
import { type ExhibitionCard, formatDates, headingParts } from "@/lib/exhibitions";

type Props = {
  items: ExhibitionCard[];
  labelKey?: LabelKey; // e.g. "upcomingExhibition" | "pastExhibition" | "currentExhibition"
  ctaText?: string;
  className?: string;
};

export default function UpcomingShows({
  items,
  labelKey = "galleryExhibition",
  ctaText = "Visit exhibition",
  className = "",
}: Props) {
  if (!items?.length) return null;

  return (
    <section className={className}>
      <Container>
        {/* Render EVERY item as a full White Cube row (text left, image right) */}
        <div className="flex flex-col divide-y divide-neutral-200">
          {items.map((ex) => {
            const { primary, secondary, isGroup } = headingParts({
              title: ex.title,
              artist: ex.artist,
              isGroup: ex.isGroup,
            });

            return (
              <div key={ex.handle} className="py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-14 xl:gap-16 2xl:gap-20 items-start">
                  {/* Text column */}
                  <div className="lg:col-span-5 2xl:col-span-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-700">
                      {labels[labelKey]}
                    </p>

                    {/* Heading pair with centralised logic */}
                    <div className="mt-4">
                      <h2 className={`text-3xl md:text-4xl xl:text-5xl leading-tight ${isGroup ? "italic" : ""}`}>
                        <Link
                          href={`/exhibitions/${ex.handle}`}
                          className="underline-offset-[6px] hover:underline focus:underline"
                        >
                          {primary}
                        </Link>
                      </h2>

                      {secondary ? (
                        <div className={`mt-1 text-xl md:text-2xl xl:text-3xl ${!isGroup ? "italic" : ""}`}>
                          {secondary}
                        </div>
                      ) : null}
                    </div>

                    {/* Dates + location */}
                    <div className="mt-4 space-y-1 text-[15px] text-neutral-700">
                      <div>{ex.start || ex.end ? formatDates(ex.start, ex.end) : null}</div>
                      {ex.location ? <div className="font-medium">{ex.location}</div> : null}
                    </div>

                    {/* Short text (summary) */}
                    {ex.summary ? (
                      <p className="mt-8 max-w-prose text-[15px] leading-7 text-neutral-800">
                        {ex.summary}
                      </p>
                    ) : null}

                    {/* Arrow link */}
                    <Link
                      href={`/exhibitions/${ex.handle}`}
                      className="mt-10 inline-flex items-center gap-3 text-[15px] font-medium underline-offset-[6px] hover:underline focus:underline"
                      aria-label={`${ctaText}: ${ex.artist ? `${ex.artist} — ` : ""}${ex.title}`}
                    >
                      <span aria-hidden>→</span>
                      {ctaText}
                    </Link>
                  </div>

                  {/* Image column (keep original ratio approach) */}
                  <div className="lg:col-span-7 2xl:col-span-7 mt-8 lg:mt-0">
                    <Link
                      href={`/exhibitions/${ex.handle}`}
                      className="group block relative w-full overflow-hidden bg-neutral-100"
                      aria-label={ex.title}
                      title={ex.title}
                    >
                      <div className="aspect-[16/9]" />
                      {ex.hero?.url ? (
                        <Image
                          src={ex.hero.url}
                          alt={ex.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm">
                          No image
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
