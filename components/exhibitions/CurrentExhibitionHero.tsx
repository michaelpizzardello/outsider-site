"use client";

// components/exhibitions/CurrentExhibitionHero.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import { formatDates } from "@/lib/formatDates";
import { headingParts, type ExhibitionCard } from "@/lib/exhibitionsShared";
import { HERO_LABELS } from "@/lib/labels";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";
import HeroScrollArrow from "@/components/exhibitions/HeroScrollArrow";

export default function CurrentExhibitionHero({
  ex,
  topLabel = HERO_LABELS.top,
  buttonLabel = HERO_LABELS.button,
  showCta = true,
  scrollTargetId,
}: {
  ex: ExhibitionCard | null;
  topLabel?: string;
  buttonLabel?: string;
  showCta?: boolean;
  scrollTargetId?: string;
}) {
  const bannerImage = ex?.banner ?? ex?.hero;
  const imgSrc = bannerImage?.url ?? "";
  const title = ex?.title ?? "";
  const artist = ex?.artist?.trim() ?? "";
  const imgAlt = bannerImage?.alt ?? ex?.hero?.alt ?? (title || "Exhibition");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [imgSrc]);

  const dateText = formatDates(ex?.start, ex?.end) || "Details to be announced";

  const { primary, secondary, isGroup } = headingParts({
    title,
    artist,
    isGroup: ex?.isGroup,
    variant: ex?.variant,
  });

  return (
    <section className="current-exhibition-hero relative isolate min-h-[100svh] w-full overflow-hidden bg-black">
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          priority
          sizes="100vw"
          className={[
            "object-cover object-center transition-opacity duration-700 ease-out",
            isImageLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onLoadingComplete={() => setIsImageLoaded(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}

      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="short-hero-content absolute inset-0 grid place-items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="short-hero-main z-10 mx-auto w-full max-w-[min(96vw,1150px)] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,.45)]">
          <ExhibitionLabel
            as="p"
            className="mb-6 md:text-[1rem] lg:text-[1.15rem] opacity-80 text-white"
          >
            {topLabel}
          </ExhibitionLabel>

          {/* Artist name/ Header 1 */}
          <h1
            className={[
              "text-display-1 hero-title-mobile leading-tight text-balance md:whitespace-normal",
              isGroup ? "italic" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {primary}
          </h1>

          {/* Exhibition Title, H2 */}
          {secondary ? (
            <h2
              className={[
                "mt-3 text-display-2 text-balance text-white/90",
                !isGroup ? "italic" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {secondary}
            </h2>
          ) : null}

          {/* Dates + location */}
          <p className="mt-10 text-display-3 opacity-90 ">{dateText}</p>

          {/* Call to action button */}
          {showCta ? (
            <ArrowCtaLink
              href={ex ? `/exhibitions/${ex.handle}` : "/exhibitions"}
              label={buttonLabel}
              align="center"
              className="mt-12 hover:opacity-85"
            />
          ) : null}
        </div>
      </div>

      {scrollTargetId ? (
        <HeroScrollArrow
          targetId={scrollTargetId}
          className="short-hero-arrow group absolute bottom-16 left-1/2 z-20 -translate-x-1/2 px-3 py-2 text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-10 w-10 transition-transform group-hover:translate-y-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14m0 0-5-5m5 5 5-5"
            />
          </svg>
        </HeroScrollArrow>
      ) : null}
    </section>
  );
}
