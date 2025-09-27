// components/exhibitions/ExhibitionFeatureWhiteCube.tsx
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import { formatDates } from "@/lib/formatDates";
import { headingParts, type ExhibitionCard } from "@/lib/exhibitions";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

type Props = {
  ex: ExhibitionCard;
  label: string;
  ctaText: string;
  className?: string;
  headingLevel?: keyof JSX.IntrinsicElements;
};

export default function ExhibitionFeatureWhiteCube({
  ex,
  label,
  ctaText,
  className = "",
  headingLevel = "h2",
}: Props) {
  const { primary, secondary, isGroup } = headingParts({
    title: ex.title,
    artist: ex.artist,
    isGroup: ex.isGroup,
  });

  // Allow callers to pick the semantic heading level (h2/h3/etc.).
  const HeadingTag = headingLevel;
  const hasDates = Boolean(ex.start || ex.end);

  return (
    <article className={className}>
      <div className="mt-4 grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-14 xl:gap-x-20">
        {/* Text column */}
        <div className="order-2 flex flex-col lg:order-1 lg:col-span-5 2xl:col-span-5">
          <ExhibitionLabel as="p">{label}</ExhibitionLabel>

          {/* Headline + optional supporting line */}
          <div className=" ">
            <HeadingTag
              className={clsx("text-2xl font-normal", isGroup && "italic")}
            >
              <Link
                href={`/exhibitions/${ex.handle}`}
                className="underline-offset-[12px] decoration-transparent transition hover:decoration-current focus-visible:decoration-current"
              >
                {primary}
              </Link>
            </HeadingTag>

            {/* EXHIBITION TITLE */}
            {secondary ? (
              <div
                className={clsx(
                  "text-xl font-normal leading-tight",
                  !isGroup && "italic"
                )}
              >
                {secondary}
              </div>
            ) : null}
          </div>

          {/* Supporting meta (dates / location) */}
          <div className="mt-2.5  text-[0.95rem] sm:text-base">
            <div>{hasDates ? formatDates(ex.start, ex.end) : null}</div>
            {ex.location ? (
              <div className="font-medium">{ex.location}</div>
            ) : null}
          </div>

          {/* Optional summary paragraph */}
          {ex.summary ? (
            <p className="mt-8 hidden max-w-[62ch] text-sm leading-relaxed text-neutral-800 md:block">
              {ex.summary}
            </p>
          ) : null}

          {/* CTA keeps the gallery arrow vernacular */}
          <ArrowCtaLink
            href={`/exhibitions/${ex.handle}`}
            label={ctaText}
            className="mt-5 text-neutral-900"
            aria-label={`${ctaText}: ${ex.artist ? `${ex.artist} — ` : ""}${
              ex.title
            }`}
            underline={false}
          />
        </div>

        {/* Image column mirrors White Cube's hover lift */}
        <div className="order-1 lg:order-2 lg:col-span-7 2xl:col-span-7">
          <Link
            href={`/exhibitions/${ex.handle}`}
            className="group relative block w-full overflow-hidden bg-neutral-100"
            aria-label={ex.title}
            title={ex.title}
          >
            <div className="aspect-[4/3] md:aspect-[3/2]" />
            {ex.hero?.url ? (
              <Image
                src={ex.hero.url}
                alt={ex.title}
                fill
                sizes="(max-width: 1024px) 100vw, (max-width: 1440px) 60vw, 60vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
                No image
              </div>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
