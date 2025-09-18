"use client";

import React from "react";
import Image from "next/image";
import useEmblaCarousel, { EmblaOptionsType } from "embla-carousel-react";

type Img = { url: string; width?: number; height?: number; alt?: string };

export default function InstallationViews({
  images,
  title = "Installation Views",
}: {
  images: Img[];
  title?: string;
}) {
  const emblaOptions: EmblaOptionsType = React.useMemo(
    () => ({ loop: true, align: "center", skipSnaps: false }),
    []
  );
  const [viewportRef, embla] = useEmblaCarousel(emblaOptions);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelectedIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla]);

  if (!images?.length) return null;

  const scrollPrev = () => embla?.scrollPrev();
  const scrollNext = () => embla?.scrollNext();

  return (
    <section className="w-full">
      {/* Header aligned with page grid/margins */}
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24 py-10 md:py-14">
        <div
          className="
            grid grid-cols-1 gap-y-6
            md:[grid-template-columns:repeat(12,minmax(0,1fr))] md:gap-x-14
            xl:[grid-template-columns:repeat(24,minmax(0,1fr))] xl:gap-x-8
          "
        >
          <div
            className="
              col-span-full
              md:[grid-column:1/span_3]
              xl:[grid-column:1/span_5]
              text-[11px] uppercase tracking-[0.18em] opacity-60
            "
          >
            {title}
          </div>
        </div>
      </div>

      {/* Full-bleed carousel wrapper (break out of content container) */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {/* Embla viewport with side padding to reveal prev/next slides */}
        <div
          ref={viewportRef}
          className="overflow-visible"
        >
          {/* Track */}
          <div
            className="
              flex items-stretch
              gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12
              px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24
              select-none touch-pan-y
              h-[62vh] sm:h-[66vh] md:h-[72vh] lg:h-[76vh] xl:h-[78vh]
            "
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                className="
                  relative shrink-0
                  basis-[84%] sm:basis-[78%] md:basis-[72%] lg:basis-[68%] xl:basis-[64%]
                  h-full
                "
              >
                {/* Image card */}
                <div className="relative h-full w-full bg-white p-2 sm:p-3 md:p-4 lg:p-6">
                  <div className="absolute inset-0">
                    <Image
                      src={img.url}
                      alt={img.alt || "Installation view"}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority={idx === 0}
                    />
                  </div>
                  {/* Subtle overlay on non-selected slides */}
                  {idx !== selectedIndex && (
                    <div className="absolute inset-0 bg-white/70 pointer-events-none" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow controls aligned to page margins */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto h-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous image"
              onClick={scrollPrev}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={scrollNext}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
