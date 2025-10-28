"use client";

import React from "react";
import Image from "next/image";
import useEmblaCarousel, { EmblaOptionsType } from "embla-carousel-react";

import Container from "@/components/layout/Container";

type Img = { url: string; width?: number; height?: number; alt?: string };

export default function InstallationViews({
  images,
  title = "Installation Views",
  showTitle = true,
}: {
  images: Img[];
  title?: string;
  showTitle?: boolean;
}) {
  const emblaOptions: EmblaOptionsType = React.useMemo(
    () => ({ loop: true, align: "center", skipSnaps: false }),
    []
  );
  const [viewportRef, embla] = useEmblaCarousel(emblaOptions);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const maxSlideAspect = React.useMemo(() => {
    if (!images?.length) return 1;

    return images.reduce((max, img) => {
      const width =
        typeof img.width === "number" && img.width > 0 ? img.width : null;
      const height =
        typeof img.height === "number" && img.height > 0 ? img.height : null;

      if (!width || !height) return max;

      const aspect = width / height;
      return Number.isFinite(aspect) && aspect > max ? aspect : max;
    }, 1);
  }, [images]);

  const trackStyle = React.useMemo(
    () =>
      ({
        ["--carousel-max-aspect" as any]: `${maxSlideAspect}`,
      }) as React.CSSProperties,
    [maxSlideAspect]
  );

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
  const renderArrowButtons = (
    prevExtraClasses = "",
    nextExtraClasses = ""
  ) => (
    <>
      <button
        type="button"
        aria-label="Previous image"
        onClick={scrollPrev}
        className={`pointer-events-auto inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white ${prevExtraClasses}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-4 w-4 sm:h-5 sm:w-5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Next image"
        onClick={scrollNext}
        className={`pointer-events-auto inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white ${nextExtraClasses}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-4 w-4 sm:h-5 sm:w-5"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </>
  );

  return (
    <section className="w-full border-t border-neutral-200 pt-8 pb-16 md:pt-10 md:pb-20">
      {showTitle ? (
        <Container>
          <div className="pt-6 md:pt-8">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
          </div>
        </Container>
      ) : null}

      {/* Full-bleed carousel wrapper without causing page overflow */}
      <div className="relative w-full overflow-x-hidden mt-6">
        {/* Embla viewport with side padding to reveal prev/next slides */}
        <div
          ref={viewportRef}
          className="overflow-hidden px-2 sm:px-6 lg:px-12 xl:px-16"
        >
          {/* Track */}
          <div
            className="
              flex items-center
              gap-3 sm:gap-4
              select-none touch-pan-y
            "
            style={trackStyle}
          >
            {images.map((img, idx) => {
              const width =
                typeof img.width === "number" && img.width > 0
                  ? img.width
                  : null;
              const height =
                typeof img.height === "number" && img.height > 0
                  ? img.height
                  : null;
              const fallbackAspect = 4 / 3;
              const computedAspect =
                width && height ? width / height : fallbackAspect;
              const aspect =
                Number.isFinite(computedAspect) && computedAspect > 0
                  ? computedAspect
                  : fallbackAspect;

              const slideStyle = {
                ["--slide-aspect" as any]: `${aspect}`,
              } as React.CSSProperties;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={scrollNext}
                  className="group relative shrink-0 text-left outline-none"
                  aria-label="View next installation image"
                >
                  {/* Image card */}
                  <div
                    className="artwork-slider-item relative overflow-hidden bg-white p-2"
                    style={slideStyle}
                  >
                    <div className="artwork-slider-frame relative">
                      <Image
                        src={img.url}
                        alt={img.alt || "Installation view"}
                        fill
                        sizes="(min-width:1536px) 1040px, (min-width:1280px) 940px, (min-width:1024px) 720px, (min-width:768px) 560px, (min-width:640px) 520px, 320px"
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                    {/* Subtle overlay on non-selected slides */}
                    <div
                      className={`
                        pointer-events-none absolute inset-0 bg-white
                        transition-opacity duration-500 ease-out
                        ${
                          idx === selectedIndex
                            ? "opacity-0"
                            : "opacity-70 group-hover:opacity-50"
                        }
                      `}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Arrow controls aligned to page margins */}
        <div className="pointer-events-none absolute inset-0">
          <div className="sm:hidden h-full flex items-center justify-between px-2">
            {renderArrowButtons("-translate-x-1", "translate-x-1")}
          </div>

          <div className="hidden h-full items-center justify-between sm:block">
            <Container className="h-full flex items-center justify-between px-0">
              {renderArrowButtons()}
            </Container>
          </div>
        </div>
      </div>
    </section>
  );
}
