"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

import CloseArtworkButton from "@/components/exhibition/CloseArtworkButton";
import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";

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

  const hasHeading = Boolean(artist || title || year || priceLabel);
  const hasCaption = Boolean(captionHtml);
  const hasMetaList = Boolean(medium || dimensionsLabel || additionalInfoHtml);

  const renderHeading = (className = "") => (
    <div className={`space-y-1 ${className}`.trim()}>
      {artist && <p className="typ-body font-medium">{artist}</p>}
      <p className="typ-body italic">{title}</p>
      {year && <p className="typ-body">{year}</p>}
      {priceLabel && <p className="typ-body-small font-medium text-neutral-600">{priceLabel}</p>}
    </div>
  );

  const renderDetails = (
    className = "",
    { leadDivider = false, onEnquire }: { leadDivider?: boolean; onEnquire?: () => void } = {}
  ) => (
    <div className={`space-y-5 ${className}`.trim()}>
      <div className="space-y-2">
        {leadDivider && <div className="h-px bg-neutral-300" />}
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center border border-neutral-300 bg-white px-6 typ-cta tracking-[0.2em] uppercase transition hover:border-black hover:text-black"
          onClick={onEnquire}
        >
          Enquire
        </button>
      </div>

      {(hasCaption || hasMetaList) && (
        <div className={leadDivider ? "h-px bg-neutral-300" : "lg:h-px lg:bg-neutral-300"} />
      )}

      {hasCaption && (
        <div
          className="typ-body-small space-y-3 leading-relaxed text-neutral-800"
          dangerouslySetInnerHTML={{ __html: captionHtml! }}
        />
      )}

      {hasMetaList && (
        <div className="typ-body-small space-y-1 text-neutral-800">
          {medium && <p>{medium}</p>}
          {dimensionsLabel && <p>{dimensionsLabel}</p>}
          {additionalInfoHtml && <div dangerouslySetInnerHTML={{ __html: additionalInfoHtml }} />}
        </div>
      )}
    </div>
  );

  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  const openEnquire = () => setIsEnquireOpen(true);
  const closeEnquire = () => setIsEnquireOpen(false);

  return (
    <main className="flex min-h-screen flex-col bg-white text-neutral-900 lg:flex-row">
      {/* Mobile info rail */}
      <section className="relative w-full bg-white px-4 pb-8 pt-14 sm:px-6 md:px-10 lg:hidden">
        <CloseArtworkButton
          fallbackHref={`/exhibitions/${exhibitionHandle}`}
          className="absolute right-4 top-4 text-3xl text-neutral-500 transition hover:text-neutral-900 sm:right-6 sm:top-6"
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
              <div className="flex items-center gap-4 sm:gap-6">
                {gallery.map((img, idx) => {
                  const width = img.width ?? 1600;
                  const height = img.height ?? 1600;
                  const aspect = width > 0 && height > 0 ? `${width} / ${height}` : undefined;
                  const isActiveSlide = idx === activeIndex;

                  return (
                    <div
                      key={img.id ?? img.url ?? idx}
                      className="relative shrink-0"
                    >
                      <div
                        className="relative flex items-center justify-center overflow-visible bg-white"
                        style={{
                          height: "clamp(220px, 50vh, 360px)",
                          minHeight: "220px",
                          maxHeight: "360px",
                        }}
                      >
                        <div
                          className="relative h-full"
                          style={{
                            aspectRatio: aspect,
                            minWidth: aspect ? undefined : "82vw",
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
      <section className="bg-white px-4 pb-12 pt-6 sm:px-6 md:px-10 lg:hidden">
        {renderDetails("", { leadDivider: false, onEnquire: openEnquire })}
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
      <aside className="relative hidden w-full max-w-md shrink-0 flex-col border-t border-neutral-200 bg-white px-6 pb-12 pt-10 sm:px-8 lg:flex lg:border-t-0 lg:border-l lg:px-8 lg:py-12 lg:h-screen lg:max-w-[360px] lg:overflow-y-auto xl:max-w-[400px] xl:px-10">
        <CloseArtworkButton
          fallbackHref={`/exhibitions/${exhibitionHandle}`}
          className="absolute right-6 top-6 hidden text-2xl text-neutral-500 transition hover:text-neutral-900 lg:right-8 lg:top-8 lg:block"
        />

        {hasHeading && (
          <>
            {renderHeading("mt-4 pr-2 sm:pr-4 lg:mt-6 lg:pr-6")}
            <div className="mt-5 h-px bg-neutral-300" />
          </>
        )}

        {renderDetails("mt-5 pr-2 sm:pr-4 lg:pr-6", { leadDivider: true, onEnquire: openEnquire })}

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
