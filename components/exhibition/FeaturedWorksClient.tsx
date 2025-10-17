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
  const href = `/exhibitions/${exhibitionHandle}/artworks/${artwork.handle}`;
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

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 text-[15px] leading-snug md:mt-5">
        <Link
          href={href}
          data-artwork-link="title"
          className="min-w-[200px] flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {artwork.artist && <p className="font-medium">{artwork.artist}</p>}
          <p className="artwork-card__title mt-1 break-words underline-offset-4">
            <span className="italic">{artwork.title}</span>
            {artwork.year && <span>, {artwork.year}</span>}
          </p>
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
    <section className="w-full border-t border-neutral-200 pt-8 pb-16 md:pt-10 md:pb-20">
      <Container>
        <div className="pt-6 md:pt-8">
          <div className={`${headingClasses} mb-8 lg:mb-12`}>
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-16">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                exhibitionHandle={exhibitionHandle}
                options={{
                  span: "third",
                  forcedAspectRatio: uniformAspect,
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
