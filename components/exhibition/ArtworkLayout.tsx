"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

import CloseArtworkButton from "@/components/exhibition/CloseArtworkButton";
import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";
import { useCart } from "@/components/cart/CartContext";

// Client-side shell that displays the artwork hero, metadata rail, and enquiry modal.

// Minimal image shape shared between Shopify responses and the layout.
type GalleryImage = {
  id?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

// UI props received from the server component.
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
  canPurchase?: boolean;
  variantId?: string | null;
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
  canPurchase,
  variantId,
}: Props) {
  // Track currently selected slide; used by both carousel and desktop hero image.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = useMemo(
    () => gallery[activeIndex] ?? gallery[0] ?? null,
    [gallery, activeIndex]
  );

  // Calculate the widest slide aspect ratio so the carousel height stays stable.
  const maxSlideAspect = useMemo(() => {
    if (!gallery?.length) return 1;

    return gallery.reduce((max, img) => {
      const width =
        typeof img.width === "number" && img.width > 0 ? img.width : null;
      const height =
        typeof img.height === "number" && img.height > 0 ? img.height : null;

      if (!width || !height) return max;

      const aspect = width / height;
      return Number.isFinite(aspect) && aspect > max ? aspect : max;
    }, 1);
  }, [gallery]);

  // Applied to the Embla track so CSS can clamp slide frames with --carousel-max-aspect.
  const trackStyle = useMemo<CSSProperties>(
    () =>
      ({
        ["--carousel-max-aspect" as any]: `${maxSlideAspect}`,
      } as CSSProperties),
    [maxSlideAspect]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [gallery]);

  // Initialise Embla carousel instance once and share it across effects.
  const [viewportRef, embla] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
  });

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

  const { addLine, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handlePurchase = useCallback(async () => {
    if (!variantId || !canPurchase) return;
    setIsAdding(true);
    try {
      await addLine({ merchandiseId: variantId, quantity: 1 });
      openCart();
    } catch (error) {
      console.error("[ArtworkLayout] Failed to add artwork to cart", error);
    } finally {
      setIsAdding(false);
    }
  }, [variantId, canPurchase, addLine, openCart]);

  // Normalise price strings coming from Shopify so the UI shows standard currency labels.
  const normalizePriceLabel = (label: string) => {
    if (!label) return "";
    if (/^A\$/i.test(label)) {
      return `$${label.slice(2).trimStart()}`;
    }
    if (/^A\s+/i.test(label)) {
      return label.replace(/^A\s+/i, "");
    }
    return label;
  };

  const displayPriceLabel = priceLabel
    ? normalizePriceLabel(priceLabel)
    : undefined;

  // Booleans drive conditional rendering throughout the template.
  const hasHeading = Boolean(artist || title || year);
  const hasCaption = Boolean(captionHtml);
  const hasPrice = Boolean(displayPriceLabel);
  const hasMetaList = Boolean(
    medium || dimensionsLabel || additionalInfoHtml || hasPrice
  );
  const showPurchaseButton = Boolean(canPurchase && variantId);

  // Reusable heading stack rendered in multiple breakpoints.
  const renderHeading = (className = "") => (
    <div className={`space-y-1 xl:space-y-2 w-full ${className}`.trim()}>
      {artist && <p className="artwork-heading-artist">{artist}</p>}
      <p className="artwork-heading-title">{title}</p>
      {year && <p className="artwork-heading-year">{year}</p>}
    </div>
  );

  // Metadata column including enquiry button, caption, medium, dimensions, notes, and price.
  const renderDetails = (
    className = "",
    {
      onEnquire,
      onPurchase,
      purchaseDisabled = false,
      showDivider = true,
    }: {
      onEnquire?: () => void;
      onPurchase?: () => Promise<void> | void;
      purchaseDisabled?: boolean;
      showDivider?: boolean;
    } = {}
  ) => {
    const hasPurchase = Boolean(onPurchase);
    const hasEnquire = Boolean(onEnquire);
    const buttonsNode =
      hasPurchase || hasEnquire ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {hasPurchase && (
            <OutlineLabelButton
              onClick={() => {
                if (onPurchase) void onPurchase();
              }}
              disabled={purchaseDisabled}
            >
              {purchaseDisabled ? "Adding..." : "Purchase"}
            </OutlineLabelButton>
          )}
          {hasEnquire && (
            <OutlineLabelButton onClick={onEnquire}>
              Enquire
            </OutlineLabelButton>
          )}
        </div>
      ) : null;

    const showDividerAfterButton =
      showDivider && buttonsNode && (hasCaption || hasMetaList);
    const captionOffset = showDividerAfterButton ? "mt-6" : "mt-7";
    const metaOffset = hasCaption ? "mt-4" : captionOffset;
    const hasSupportingMeta = Boolean(
      medium || dimensionsLabel || additionalInfoHtml
    );

    return (
      <div className={`w-full ${className}`.trim()}>
        {buttonsNode}

        {showDividerAfterButton && (
          <div className="mt-5 mb-5 h-px w-full bg-neutral-300 lg:mt-6 lg:mb-6" />
        )}

        {hasCaption && (
          <div
            className={`artwork-meta-text ${captionOffset} space-y-2 text-neutral-800 [&_p]:artwork-meta-text [&_p]:text-neutral-800`.trim()}
            dangerouslySetInnerHTML={{ __html: captionHtml! }}
          />
        )}

        {hasMetaList && (
          <div className={`${metaOffset} space-y-3`.trim()}>
            {hasSupportingMeta && (
              <div className="space-y-1">
                {medium && <p className="artwork-meta-text">{medium}</p>}
                {dimensionsLabel && (
                  <p className="artwork-meta-text">{dimensionsLabel}</p>
                )}
                {additionalInfoHtml && (
                  <div
                    className="artwork-meta-text space-y-2 text-neutral-800 [&_p]:artwork-meta-text"
                    dangerouslySetInnerHTML={{ __html: additionalInfoHtml }}
                  />
                )}
              </div>
            )}
            {displayPriceLabel && (
              <p
                className={`artwork-meta-text font-medium text-neutral-900 ${
                  hasSupportingMeta ? "mt-3" : ""
                }`.trim()}
              >
                {displayPriceLabel}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Local modal state keeps the enquiry overlay scoped to this layout.
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  const openEnquire = () => setIsEnquireOpen(true);
  const closeEnquire = () => setIsEnquireOpen(false);

  return (
    <main className="flex min-h-screen flex-col bg-white text-neutral-900 lg:flex-row">
      {/* Mobile info rail */}
      <section className="relative w-full bg-white px-4 pb-6 pt-12 sm:px-6 md:px-10 lg:hidden lg:bg-neutral-100">
        <CloseArtworkButton
          fallbackHref={`/exhibitions/${exhibitionHandle}`}
          className="absolute right-4 top-4 text-[2.5rem] leading-none text-neutral-900 font-light transition sm:right-6 sm:top-6"
        />
        {hasHeading && <>{renderHeading("mt-2")}</>}
      </section>

      {/* Slider for mobile & tablet */}
      <section className="relative lg:hidden">
        <div className="px-4 pb-5 pt-4 sm:px-6 md:px-10">
          <div className="relative">
            <div ref={viewportRef} className="overflow-hidden">
              <div
                className="flex items-center gap-3 sm:gap-4"
                style={trackStyle}
              >
                {gallery.map((img, idx) => {
                  const width = img.width ?? 1600;
                  const height = img.height ?? 1600;
                  const aspectValue =
                    width > 0 && height > 0 ? width / height : 1;
                  const slideStyle = {
                    "--slide-aspect": `${
                      Number.isFinite(aspectValue) && aspectValue > 0
                        ? aspectValue
                        : 1
                    }`,
                  } as React.CSSProperties;
                  const isActiveSlide = idx === activeIndex;

                  return (
                    <div
                      key={img.id ?? img.url ?? idx}
                      className={`artwork-slider-item relative shrink-0 overflow-hidden bg-white ${
                        isActiveSlide ? "cursor-default" : "cursor-pointer"
                      }`}
                      style={slideStyle}
                      onClick={() => {
                        // Tap/click moves the mobile carousel unless the slide is already active.
                        if (!embla || idx === activeIndex) return;
                        embla.scrollTo(idx);
                      }}
                    >
                      <div className="artwork-slider-frame relative">
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile detail info below carousel */}
      <section className="bg-white px-4 pb-12 pt-4 sm:px-6 md:px-10 lg:hidden lg:bg-neutral-100">
        {renderDetails("", {
          onEnquire: openEnquire,
          onPurchase: showPurchaseButton ? handlePurchase : undefined,
          purchaseDisabled: isAdding,
          showDivider: false,
        })}
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
            {renderHeading("mt-4 lg:mt-6")}
            <div className="mt-6 mb-6 h-px w-full bg-neutral-300 lg:mt-8 lg:mb-8" />
          </>
        )}

        {renderDetails("", {
          onEnquire: openEnquire,
          onPurchase: showPurchaseButton ? handlePurchase : undefined,
          purchaseDisabled: isAdding,
        })}

        {gallery.length > 1 && (
          <section className="hidden space-y-3 lg:block lg:mt-6">
            <div className="my-6 h-px w-full bg-neutral-300 lg:my-8" />
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
                    {/* Thumbnails provide quick navigation across the gallery. */}
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
          price: displayPriceLabel,
          additionalHtml: additionalInfoHtml,
          image: gallery[0]
            ? { url: gallery[0].url, alt: gallery[0].altText || title }
            : undefined,
        }}
      />
    </main>
  );
}
