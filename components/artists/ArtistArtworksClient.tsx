"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";
import Container from "@/components/layout/Container";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

type ArtworkPayload = {
  id: string;
  artist: string | null;
  title: string;
  year: string | null;
  priceLabel: string;
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
  enquireHref: string;
};

type LayoutRow = { layout: "full" | "pair" | "triple"; indexes: number[] };

type RenderOptions = {
  span: "full" | "half" | "third";
  forcedAspectRatio?: number;
  sizeOverride?: string;
  centerImage?: boolean;
};

type Props = {
  artworks: ArtworkPayload[];
  rows: LayoutRow[];
};

function ArtworkCard({
  artwork,
  options,
  onEnquire,
}: {
  artwork: ArtworkPayload;
  options: RenderOptions;
  onEnquire: (artwork: ArtworkPayload) => void;
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

  const media = image ? (
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
  );

  const titleBlock = (
    <>
      <p className="artwork-card__title mt-1 break-words underline-offset-4">
        <span className="italic">{artwork.title}</span>
        {artwork.year && <span>, {artwork.year}</span>}
      </p>
      <p className="mt-2 font-medium">{artwork.priceLabel}</p>
    </>
  );

  return (
    <div className="artwork-card flex h-full flex-col">
      <div>
        {href ? (
          <Link
            href={href}
            data-artwork-link="image"
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {media}
          </Link>
        ) : (
          <div className="group block">{media}</div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 text-[15px] leading-tight md:mt-5">
        {href ? (
          <Link
            href={href}
            data-artwork-link="title"
            className="min-w-[200px] flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {titleBlock}
          </Link>
        ) : (
          <div className="min-w-[200px] flex-1">{titleBlock}</div>
        )}

        <div className="flex shrink-0 items-center gap-x-6 text-sm">
          {href ? (
            <ArrowCtaLink
              href={href}
              label="View work"
              className="hidden sm:inline-flex hover:opacity-85"
              underline={false}
            />
          ) : null}
          <Link
            href={artwork.enquireHref}
            className="group inline-flex items-center gap-4 text-sm font-medium md:text-base hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            onClick={(event) => {
              if (event.defaultPrevented) return;
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              onEnquire(artwork);
            }}
          >
            <span className="underline-offset-[6px] group-hover:underline group-focus-visible:underline">
              Enquire
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ArtistArtworksClient({ artworks, rows: _rows }: Props) {
  const [enquiryArtwork, setEnquiryArtwork] = useState<ArtworkPayload | null>(null);
  void _rows;
  const uniformAspect = useMemo(() => {
    const factors = artworks
      .map((artwork) => artwork.heightFactor)
      .filter((value): value is number => typeof value === "number" && value > 0);
    if (!factors.length) return undefined;
    const maxFactor = Math.max(...factors);
    return maxFactor > 0 ? 1 / maxFactor : undefined;
  }, [artworks]);

  const closeEnquiry = () => setEnquiryArtwork(null);

  return (
    <section className="w-full border-t border-neutral-200 pt-8 pb-16 md:pt-10 md:pb-20">
      <Container>
        <div className="pt-6 md:pt-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-12">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
              Artworks
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12 xl:gap-y-14">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                options={{
                  span: "third",
                  forcedAspectRatio: uniformAspect,
                  sizeOverride: "(min-width:1024px) 33vw, (min-width:768px) 50vw, 50vw",
                  centerImage: true,
                }}
                onEnquire={(selected) => setEnquiryArtwork(selected)}
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
