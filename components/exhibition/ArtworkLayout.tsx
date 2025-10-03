"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

import CloseArtworkButton from "@/components/exhibition/CloseArtworkButton";
import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";

type GalleryImage = {
  id?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

type Props = {
  exhibitionHandle: string;
  title: string;
  gallery: GalleryImage[];
  artist?: string;
  year?: string;
  priceLabel?: string;
  captionHtml?: string;
  medium?: string;
  dimensionsLabel?: string;
  additionalInfoHtml?: string;
};

export default function ArtworkLayout({
  exhibitionHandle,
  title,
  gallery,
  artist,
  year,
  priceLabel,
  captionHtml,
  medium,
  dimensionsLabel,
  additionalInfoHtml,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = useMemo(() => gallery[activeIndex] ?? gallery[0] ?? null, [gallery, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [gallery]);

  const [viewportRef, embla] = useEmblaCarousel({ loop: false, align: "center", skipSnaps: false });

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setActiveIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    if (embla.selectedScrollSnap() !== activeIndex) {
      embla.scrollTo(activeIndex);
    }
  }, [activeIndex, embla]);

  const hasHeading = Boolean(artist || title || year);
  const hasCaption = Boolean(captionHtml);
  const hasPrice = Boolean(priceLabel);
  const hasMetaList = Boolean(medium || dimensionsLabel || additionalInfoHtml || hasPrice);

  const renderHeading = (className = "") => (
    <div className={`space-y-2 xl:space-y-4 ${className}`.trim()}>
      {artist && <p className="artwork-heading-artist">{artist}</p>}
      <p className="artwork-heading-title">{title}</p>
      {year && <p className="artwork-heading-year">{year}</p>}
    </div>
  );

  const renderDetails = (className = "", { onEnquire }: { onEnquire?: () => void } = {}) => {
    const showDividerAfterButton = hasCaption || hasMetaList;

    return (
      <div className={`space-y-6 ${className}`.trim()}>
        <OutlineLabelButton onClick={onEnquire} className="tracking-[0.28em]">
          Enquire
        </OutlineLabelButton>

        {showDividerAfterButton && <div className="h-px bg-neutral-300" />}

        {hasCaption && (
          <div
            className="artwork-meta-text space-y-4 text-neutral-800 [&_p]:artwork-meta-text [&_p]:text-neutral-800"
            dangerouslySetInnerHTML={{ __html: captionHtml! }}
          />
        )}

        {hasMetaList && (
          <div className="space-y-2">
            {medium && <p className="artwork-meta-text">{medium}</p>}
            {dimensionsLabel && <p className="artwork-meta-text">{dimensionsLabel}</p>}
            {additionalInfoHtml && (
              <div
                className="artwork-meta-text space-y-2 text-neutral-800 [&_p]:artwork-meta-text"
                dangerouslySetInnerHTML={{ __html: additionalInfoHtml }}
              />
            )}
            {priceLabel && <p className="artwork-meta-text font-medium text-neutral-900">{priceLabel}</p>}
          </div>
        )}
      </div>
    );
  };

  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  const openEnquire = () => setIsEnquireOpen(true);
  const closeEnquire = () => setIsEnquireOpen(false);

  return (
    <main className="flex min-h-screen flex-col bg-white text-neutral-900 lg:flex-row">
      {/* Mobile info rail */}
      <section className="relative w-full bg-white px-4 pb-8 pt-14 sm:px-6 md:px-10 lg:hidden lg:bg-neutral-100">
        <CloseArtworkButton
          fallbackHref={`/exhibitions/${exhibitionHandle}`}
          className="absolute right-4 top-4 text-[2.5rem] leading-none text-neutral-900 font-light transition sm:right-6 sm:top-6"
        />
        {hasHeading && (
          <>{renderHeading("mt-2")}</>
        )}
      </section>

      {/* Slider for mobile & tablet */}
      <section className="relative lg:hidden">
        <div className="px-4 pb-8 pt-6 sm:px-6 md:px-10">
          <div className="relative">
            <div ref={viewportRef} className="overflow-hidden">
              <div className="flex items-center gap-3 sm:gap-4">
                {gallery.map((img, idx) => {
                  const width = img.width ?? 1600;
                  const height = img.height ?? 1600;
                  const aspect = width > 0 && height > 0 ? `${width} / ${height}` : undefined;
                  const isActiveSlide = idx === activeIndex;

                  return (
                    <div
                      key={img.id ?? img.url ?? idx}
                      className={`relative shrink-0 ${
                        isActiveSlide ? "cursor-default" : "cursor-pointer"
                      }`}
                      style={{ width: "min(92vw, 620px)" }}
                      onClick={() => {
                        if (!embla || idx === activeIndex) return;
                        embla.scrollTo(idx);
                      }}
                    >
                      <div
                        className="relative flex items-center justify-center overflow-hidden bg-white"
                        style={{
                          height: "clamp(280px, 58vh, 520px)",
                        }}
                      >
                        <div
                          className="relative h-full w-full"
                          style={{
                            aspectRatio: aspect,
                          }}
                        >
                          <Image
                            src={img.url}
                            alt={img.altText || title}
                            fill
                            sizes="100vw"
                            className="object-contain"
                            priority={idx === 0}
                          />
                          {!isActiveSlide && (
                            <div className="pointer-events-none absolute inset-0 bg-white/70 transition-opacity duration-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile detail info below carousel */}
      <section className="bg-white px-4 pb-12 pt-6 sm:px-6 md:px-10 lg:hidden lg:bg-neutral-100">
        {renderDetails("", { onEnquire: openEnquire })}
      </section>

      {/* Left column: desktop main artwork image */}
      <section className="hidden flex-1 items-center justify-center px-4 py-12 sm:px-6 md:px-12 lg:flex lg:px-16">
        {activeImage ? (
          <Image
            key={activeImage.url}
            src={activeImage.url}
            alt={activeImage.altText || title}
            width={activeImage.width ?? 2000}
            height={activeImage.height ?? 2000}
            sizes="(min-width: 1280px) 60vw, (min-width:1024px) 58vw, 100vw"
            className="mx-auto h-auto w-full max-h-[80vh] object-contain lg:max-h-[calc(100vh-160px)]"
            priority
          />
        ) : (
          <div className="mx-auto aspect-[4/5] w-full max-w-4xl border border-neutral-200 bg-neutral-100" />
        )}
      </section>

      {/* Right column: artwork info */}
      <aside className="relative hidden w-full max-w-md shrink-0 flex-col border-t border-neutral-200 bg-neutral-100 px-6 pb-12 pt-10 sm:px-8 lg:flex lg:border-t-0 lg:border-l lg:px-[clamp(2.5rem,3vw,3.5rem)] lg:py-12 lg:h-screen lg:max-w-none lg:flex-[0_0_clamp(380px,34vw,680px)] lg:overflow-y-auto xl:flex-[0_0_clamp(440px,38vw,780px)] xl:px-[clamp(3rem,3.2vw,4rem)] 2xl:flex-[0_0_clamp(500px,34vw,840px)] 2xl:px-[clamp(3.5rem,2.8vw,4.5rem)]">
        <CloseArtworkButton
          fallbackHref={`/exhibitions/${exhibitionHandle}`}
          className="absolute right-6 top-6 hidden text-[2.5rem] leading-none text-neutral-900 font-light transition lg:right-8 lg:top-8 lg:block xl:text-[2.75rem]"
        />

        {hasHeading && (
          <>
            {renderHeading("mt-4 pr-2 sm:pr-4 lg:mt-6 lg:pr-4")}
            <div className="mt-5 h-px bg-neutral-300" />
          </>
        )}

        {renderDetails("mt-5 pr-2 sm:pr-4 lg:pr-4", { onEnquire: openEnquire })}

        {gallery.length > 1 && (
          <section className="hidden space-y-3 lg:block">
            <div className="h-px bg-neutral-300" />
            <div className="grid grid-cols-4 gap-2 xl:grid-cols-5 xl:gap-3">
              {gallery.map((img, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    type="button"
                    key={img.id ?? img.url ?? idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative block aspect-square overflow-hidden border transition ${
                      isActive ? "border-neutral-900" : "border-neutral-200"
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40`}
                    aria-label={`Show image ${img.altText || title}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `${title} thumbnail`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </aside>

      <ArtworkEnquiryModal
        open={isEnquireOpen}
        onClose={closeEnquire}
        artwork={{
          title,
          artist,
          year,
          medium,
          dimensions: dimensionsLabel,
          price: priceLabel,
          additionalHtml: additionalInfoHtml,
          image: gallery[0] ? { url: gallery[0].url, alt: gallery[0].altText || title } : undefined,
        }}
      />
    </main>
  );
}
