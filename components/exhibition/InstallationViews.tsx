"use client";

import React from "react";
import Image from "next/image";
import useEmblaCarousel, { EmblaOptionsType } from "embla-carousel-react";

import Container from "@/components/layout/Container";

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
    <section className="w-full py-10 md:py-14">
      <Container>
        <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      </Container>

      {/* Full-bleed carousel wrapper without causing page overflow */}
      <div className="relative w-full overflow-x-hidden mt-6">
        {/* Embla viewport with side padding to reveal prev/next slides */}
        <div ref={viewportRef} className="overflow-hidden">
          {/* Track */}
          <div
            className="
              flex items-start
              gap-8
              px-4 sm:px-6 lg:px-20
              select-none touch-pan-y
            "
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                className="
                  relative shrink-0
                  basis-[320px] sm:basis-[420px] md:basis-[560px] lg:basis-[640px] xl:basis-[720px] 2xl:basis-[800px]
                "
              >
                {/* Image card */}
                <div className="relative w-full bg-white p-4">
                  {img.width && img.height ? (
                    <Image
                      src={img.url}
                      alt={img.alt || "Installation view"}
                      width={img.width}
                      height={img.height}
                      sizes="(min-width:1536px) 800px, (min-width:1280px) 720px, (min-width:1024px) 640px, (min-width:768px) 560px, (min-width:640px) 420px, 320px"
                      className="w-full h-auto object-contain"
                      priority={idx === 0}
                    />
                  ) : (
                    <div className="relative w-full">
                      <div className="aspect-[4/3] w-full" />
                      <Image
                        src={img.url}
                        alt={img.alt || "Installation view"}
                        fill
                        sizes="(min-width:1536px) 800px, (min-width:1280px) 720px, (min-width:1024px) 640px, (min-width:768px) 560px, (min-width:640px) 420px, 320px"
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  )}
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
          <Container className="h-full flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous image"
              onClick={scrollPrev}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white"
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
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={scrollNext}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white"
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
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Container>
        </div>
      </div>
    </section>
  );
}
