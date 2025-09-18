// components/exhibitions/UpcomingShows.tsx
import Container from "@/components/layout/Container";
import Image from "next/image";
import Link from "next/link";
import labels, { type LabelKey } from "@/lib/labels";
import { type ExhibitionCard, formatDates, headingParts } from "@/lib/exhibitions";

type Props = {
  items: ExhibitionCard[];
  labelKey?: LabelKey;
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
        <div className="flex flex-col divide-y divide-neutral-200">
          {items.map((ex) => {
            const { primary, secondary, isGroup } = headingParts({
              title: ex.title,
              artist: ex.artist,
              isGroup: ex.isGroup,
            });

            return (
              <div key={ex.handle} className="py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 xl:gap-14 2xl:gap-16 items-start">
                  {/* Image first on mobile/tablet; right on desktop */}
                  <div className="order-1 lg:order-2 lg:col-span-7 2xl:col-span-7">
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
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm">
                          No image
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Text below on mobile/tablet; left on desktop */}
                  <div className="order-2 lg:order-1 lg:col-span-5 2xl:col-span-5 mt-5 lg:mt-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-700">
                      {labels[labelKey]}
                    </p>

                    <div className="mt-2">
                      <h2
                        className={`text-2xl md:text-3xl xl:text-4xl leading-tight ${
                          isGroup ? "italic" : ""
                        }`}
                      >
                        <Link
                          href={`/exhibitions/${ex.handle}`}
                          className="underline-offset-[6px] hover:underline focus:underline"
                        >
                          {primary}
                        </Link>
                      </h2>

                      {secondary ? (
                        <div
                          className={`mt-0.5 text-lg md:text-xl xl:text-2xl ${
                            !isGroup ? "italic" : ""
                          }`}
                        >
                          {secondary}
                        </div>
                      ) : null}
                    </div>

                    {/* Dates + location */}
                    <div className="mt-3 space-y-[2px] text-[14px] md:text-[16px] xl:text-[17px] text-neutral-700">
                      <div>{ex.start || ex.end ? formatDates(ex.start, ex.end) : null}</div>
                      {ex.location ? <div className="font-medium">{ex.location}</div> : null}
                    </div>

                    {/* Summary: hidden on mobile; full-width on iPad; measured again on desktop */}
                    {ex.summary ? (
                      <p className="hidden md:block md:mt-5 md:text-[15px] md:leading-7 md:max-w-none lg:max-w-prose text-neutral-800">
                        {ex.summary}
                      </p>
                    ) : null}

                    {/* CTA */}
                    <Link
                      href={`/exhibitions/${ex.handle}`}
                      className="mt-7 md:mt-8 inline-flex items-center gap-3 text-[15px] md:text-[16px] xl:text-[18px] font-medium underline-offset-[6px] hover:underline focus:underline"
                      aria-label={`${ctaText}: ${ex.artist ? `${ex.artist} — ` : ""}${ex.title}`}
                    >
                      <span aria-hidden>→</span>
                      {ctaText}
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

