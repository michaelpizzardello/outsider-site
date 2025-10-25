"use client";

import React, { type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import { useCart } from "@/components/cart/CartContext";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";
import ArtworkEnquiryModal from "./ArtworkEnquiryModal";

type ArtworkPayload = {
  id: string;
  handle: string;
  title: string;
  artist: string | null;
  year: string | null;
  priceLabel: string;
  sold: boolean;
  canPurchase: boolean;
  variantId?: string | null;
  featureImage?: {
    url: string;
    width?: number | null;
    height?: number | null;
    altText?: string | null;
  } | null;
  aspectRatio?: string;
  heightFactor: number;
  type: "L" | "P" | "S";
};

type LayoutRow = { layout: "full" | "pair" | "triple"; indexes: number[] };

type Props = {
  title: string;
  exhibitionHandle: string;
  artworks: ArtworkPayload[];
  rows: LayoutRow[];
  showActions?: boolean;
  /**
   * Optional desktop aspect ratio override. If provided, all cards will
   * use this aspect on desktop breakpoints for consistent row heights.
   * Falls back to a uniform aspect computed from the provided artworks.
   */
  forcedDesktopAspect?: number;
};

type RenderOptions = {
  span: "full" | "half" | "third";
  forcedAspectRatio?: number;
  sizeOverride?: string;
  centerImage?: boolean;
};

function ArtworkCard({
  artwork,
  exhibitionHandle,
  options,
  onEnquire,
  onPurchase,
  isPurchasing,
  showActions = true,
}: {
  artwork: ArtworkPayload;
  exhibitionHandle: string;
  options: RenderOptions;
  onEnquire: (artwork: ArtworkPayload) => void;
  onPurchase?: (artwork: ArtworkPayload) => void | Promise<void>;
  isPurchasing?: boolean;
  showActions?: boolean;
}) {
  const href = `/artworks/${artwork.handle}`;
  const image = artwork.featureImage;

  const sizeAttr = options.sizeOverride
    ? options.sizeOverride
    : options.span === "full"
    ? "(min-width:1024px) 100vw, 100vw"
    : options.span === "third"
    ? "(min-width:1024px) 33vw, 100vw"
    : "(min-width:1024px) 50vw, 100vw";

  const naturalAspect =
    image?.width && image?.height && image.height > 0
      ? `${image.width} / ${image.height}`
      : artwork.aspectRatio ?? undefined;
  const forcedAspect =
    typeof options.forcedAspectRatio === "number" && options.forcedAspectRatio > 0
      ? `${options.forcedAspectRatio}`
      : undefined;
  const aspectStyles: CSSProperties = {};
  if (naturalAspect) {
    aspectStyles["--artwork-aspect-mobile"] = naturalAspect;
  }
  if (forcedAspect) {
    aspectStyles["--artwork-aspect-desktop"] = forcedAspect;
  }
  const aspectClass =
    options.span === "full"
      ? "aspect-[var(--artwork-aspect-mobile,_4/3)] sm:aspect-[var(--artwork-aspect-desktop,_4/3)]"
      : "aspect-[var(--artwork-aspect-mobile,_4/5)] sm:aspect-[var(--artwork-aspect-desktop,_4/5)]";
  const wrapperClass = `relative w-full overflow-hidden bg-white ${aspectClass}${
    options.centerImage ? " flex items-center justify-center sm:block" : ""
  }`;

  return (
    <div className="artwork-card flex h-full flex-col">
      <div>
        <Link
          href={href}
          data-artwork-link="image"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {image ? (
            <div className={wrapperClass} style={Object.keys(aspectStyles).length ? aspectStyles : undefined}>
              <Image
                src={image.url}
                alt={image.altText || artwork.title}
                fill
                className="object-contain object-center sm:object-bottom transition duration-300 group-hover:scale-[1.01]"
                sizes={sizeAttr}
              />
            </div>
          ) : (
            <div className={`bg-neutral-100 ${aspectClass}`} />
          )}
        </Link>
      </div>

      <div
        className={
          showActions
            ? "mt-4 flex flex-col items-center gap-y-4 text-center text-[15px] leading-tight md:mt-5 sm:flex-wrap sm:flex-row sm:items-start sm:justify-between sm:gap-x-8 sm:gap-y-4 sm:text-left"
            : "mt-4 flex flex-col items-center gap-y-4 text-center text-[15px] leading-tight md:mt-5"
        }
      >
        <Link
          href={href}
          data-artwork-link="title"
          className={
            showActions
              ? "min-w-[200px] flex-1 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-black sm:text-left"
              : "w-full max-w-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          }
        >
          {artwork.artist ? <p className="font-medium">{artwork.artist}</p> : null}
          <p className="artwork-card__title mt-2 break-words underline-offset-4">
            <span className="italic">{artwork.title}</span>
            {showActions && artwork.year ? <span>, {artwork.year}</span> : null}
          </p>
          {!showActions && artwork.year ? (
            <p className="mt-1 text-sm text-neutral-600">{artwork.year}</p>
          ) : null}
          {artwork.priceLabel ? (
            <p className="mt-2 font-medium">{artwork.priceLabel}</p>
          ) : null}
        </Link>

        {showActions ? (
          <div className="flex shrink-0 items-center gap-x-6 text-sm">
            {artwork.canPurchase && artwork.variantId && onPurchase ? (
              <OutlineLabelButton
                onClick={() => {
                  if (onPurchase) {
                    void onPurchase(artwork);
                  }
                }}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Adding..." : "Purchase"}
              </OutlineLabelButton>
            ) : (
              <OutlineLabelButton onClick={() => onEnquire(artwork)}>
                Enquire
              </OutlineLabelButton>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function FeaturedWorksClient({
  title,
  exhibitionHandle,
  artworks,
  rows: _rows,
  showActions = true,
  forcedDesktopAspect,
}: Props) {
  const [enquiryArtwork, setEnquiryArtwork] = React.useState<ArtworkPayload | null>(null);
  const [addingId, setAddingId] = React.useState<string | null>(null);
  const { addLine, openCart } = useCart();
  void _rows;
  const uniformAspect = React.useMemo(() => {
    const factors = artworks
      .map((artwork) => artwork.heightFactor)
      .filter((value): value is number => typeof value === "number" && value > 0);
    if (!factors.length) return undefined;
    const maxFactor = Math.max(...factors);
    return maxFactor > 0 ? 1 / maxFactor : undefined;
  }, [artworks]);
  // Prefer explicit override, else compute uniform from this list
  const desktopAspect =
    typeof forcedDesktopAspect === "number" && forcedDesktopAspect > 0
      ? forcedDesktopAspect
      : uniformAspect;
  const closeEnquiry = () => setEnquiryArtwork(null);
  const handlePurchase = React.useCallback(
    async (artwork: ArtworkPayload) => {
      if (!artwork.variantId) return;
      setAddingId(artwork.id);
      try {
        await addLine({ merchandiseId: artwork.variantId, quantity: 1 });
        openCart();
      } catch (error) {
        console.error("[FeaturedWorks] Failed to add artwork to cart", error);
      } finally {
        setAddingId(null);
      }
    },
    [addLine, openCart]
  );

  const headingClasses = "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between";

  return (
    <section className="w-full border-t border-neutral-200 pt-6 pb-16 sm:pt-8 md:pt-10 md:pb-20">
      <Container>
        <div className="pt-3 sm:pt-6 md:pt-8">
          <div className={`${headingClasses} mb-6 sm:mb-8 lg:mb-12`}>
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12 xl:gap-y-14">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                exhibitionHandle={exhibitionHandle}
                options={{
                  span: "third",
                  forcedAspectRatio: desktopAspect,
                  sizeOverride: "(min-width:1024px) 33vw, (min-width:768px) 50vw, 50vw",
                  centerImage: true,
                }}
                onEnquire={(selected) => setEnquiryArtwork(selected)}
                onPurchase={handlePurchase}
                isPurchasing={addingId === artwork.id}
                showActions={showActions}
              />
            ))}
          </div>
        </div>
      </Container>
      <ArtworkEnquiryModal
        open={Boolean(enquiryArtwork)}
        onClose={closeEnquiry}
        artwork={{
          title: enquiryArtwork?.title ?? "",
          artist: enquiryArtwork?.artist ?? undefined,
          year: enquiryArtwork?.year ?? undefined,
          price: enquiryArtwork?.priceLabel,
          image: enquiryArtwork?.featureImage
            ? {
                url: enquiryArtwork.featureImage.url,
                alt: enquiryArtwork.featureImage.altText || enquiryArtwork.title,
              }
            : undefined,
        }}
      />
    </section>
  );
}
