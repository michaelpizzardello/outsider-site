"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";
import Container from "@/components/layout/Container";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";
import { useCart } from "@/components/cart/CartContext";

type ArtworkPayload = {
  id: string;
  handle: string;
  artist: string | null;
  title: string;
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
  href?: string | null;
};

type RenderOptions = {
  span: "full" | "half" | "third";
  forcedAspectRatio?: number;
  sizeOverride?: string;
  centerImage?: boolean;
};

type Props = {
  availableArtworks: ArtworkPayload[];
  soldArtworks: ArtworkPayload[];
};

function ArtworkCard({
  artwork,
  options,
  onEnquire,
  onPurchase,
  isPurchasing,
  showActions = true,
  layout = "available",
}: {
  artwork: ArtworkPayload;
  options: RenderOptions;
  onEnquire: (artwork: ArtworkPayload) => void;
  onPurchase?: (artwork: ArtworkPayload) => void | Promise<void>;
  isPurchasing?: boolean;
  showActions?: boolean;
  layout?: "available" | "featured";
}) {
  const href = artwork.href ?? undefined;
  const sizeAttr = options.sizeOverride
    ? options.sizeOverride
    : options.span === "full"
    ? "(min-width:1024px) 100vw, 100vw"
    : options.span === "third"
    ? "(min-width:1024px) 33vw, 100vw"
    : "(min-width:1024px) 50vw, 100vw";

  const image = artwork.featureImage;
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
    if (!forcedAspect) {
      aspectStyles["--artwork-aspect-desktop"] = naturalAspect;
    }
  }
  if (forcedAspect) {
    aspectStyles["--artwork-aspect-desktop"] = forcedAspect;
  }
  const aspectClass =
    options.span === "full"
      ? "aspect-[var(--artwork-aspect-mobile,_4/3)] sm:aspect-[var(--artwork-aspect-desktop,_4/3)]"
      : "aspect-[var(--artwork-aspect-mobile,_4/5)] sm:aspect-[var(--artwork-aspect-desktop,_4/5)]";
  const wrapperClass = `relative w-full overflow-hidden bg-white ${aspectClass}${
    options.centerImage ? " flex items-end justify-center" : ""
  }`;

  const media = image ? (
    <div className={wrapperClass} style={Object.keys(aspectStyles).length ? aspectStyles : undefined}>
      <Image
        src={image.url}
        alt={image.altText || artwork.title}
        fill
        className="object-contain object-center transition duration-300 group-hover:scale-[1.01]"
        sizes={sizeAttr}
      />
    </div>
  ) : (
    <div className={`bg-neutral-100 ${aspectClass}`} />
  );

  const showYearInline = layout !== "featured";
  const titleBlock = (
    <>
      <p className="artwork-card__title mt-1 break-words underline-offset-4">
        <span className="italic">{artwork.title}</span>
        {showYearInline && artwork.year ? <span>, {artwork.year}</span> : null}
      </p>
      {artwork.priceLabel ? (
        <p className="mt-2 font-medium">{artwork.priceLabel}</p>
      ) : null}
    </>
  );

  return (
    <div className="artwork-card flex h-full flex-col">
      <div className="flex flex-1 items-end">
        {href ? (
          <Link
            href={href}
            data-artwork-link="image"
            className="group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {media}
          </Link>
        ) : (
          <div className="group block w-full">{media}</div>
        )}
      </div>

      <div
        className={
          layout === "featured"
            ? "mt-4 flex flex-col items-center gap-y-4 text-center text-[15px] leading-tight md:mt-5"
            : "mt-4 flex flex-col items-start gap-y-4 text-left text-[15px] leading-tight md:mt-5 sm:flex-wrap sm:flex-row sm:items-start sm:justify-between sm:gap-x-8 sm:gap-y-4"
        }
      >
        {href ? (
          <Link
            href={href}
            data-artwork-link="title"
            className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              layout === "featured"
                ? "w-full max-w-xs text-center"
                : "min-w-[200px] flex-1 text-left"
            }`}
          >
            {titleBlock}
            {!showYearInline && artwork.year ? (
              <p className="mt-1 text-sm text-neutral-600">{artwork.year}</p>
            ) : null}
          </Link>
        ) : (
          <div
            className={
              layout === "featured"
                ? "w-full max-w-xs text-center"
                : "min-w-[200px] flex-1 text-left"
            }
          >
            {titleBlock}
            {!showYearInline && artwork.year ? (
              <p className="mt-1 text-sm text-neutral-600">{artwork.year}</p>
            ) : null}
          </div>
        )}

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

export default function ArtistArtworksClient({
  availableArtworks,
  soldArtworks,
}: Props) {
  const [enquiryArtwork, setEnquiryArtwork] = useState<ArtworkPayload | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addLine, openCart } = useCart();

  const closeEnquiry = () => setEnquiryArtwork(null);

  const handlePurchase = async (artwork: ArtworkPayload) => {
    if (!artwork.variantId) return;
    setAddingId(artwork.id);
    try {
      await addLine({ merchandiseId: artwork.variantId, quantity: 1 });
      openCart();
    } catch (error) {
      console.error("[ArtistArtworks] Failed to add artwork to cart", error);
    } finally {
      setAddingId(null);
    }
  };

  const renderSection = (title: string, artworks: ArtworkPayload[], showActions = true) => {
    if (!artworks.length) return null;

    return (
      <section className="w-full border-t border-neutral-200 pt-6 pb-16 sm:pt-8 md:pt-10 md:pb-20">
        <Container>
          <div className="pt-3 sm:pt-6 md:pt-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:mb-8 lg:mb-12">
              <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
                {title}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-20 xl:gap-y-24">
              {artworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  options={{
                    span: "third",
                    forcedAspectRatio: undefined,
                    sizeOverride: "(min-width:1024px) 33vw, (min-width:768px) 50vw, 50vw",
                    centerImage: true,
                  }}
                  onEnquire={(selected) => setEnquiryArtwork(selected)}
                  onPurchase={showActions ? handlePurchase : undefined}
                  isPurchasing={addingId === artwork.id}
                  showActions={showActions}
                  layout={showActions ? "available" : "featured"}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  };

  return (
    <>
      {renderSection("Available Works", availableArtworks, true)}
      {renderSection("Featured Works", soldArtworks, false)}
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
    </>
  );
}
