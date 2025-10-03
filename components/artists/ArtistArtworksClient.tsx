"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

type ArtworkPayload = {
  id: string;
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

function ArtworkCard({ artwork, options }: { artwork: ArtworkPayload; options: RenderOptions }) {
  const Wrapper = artwork.href ? Link : ("div" as const);
  const wrapperProps = artwork.href
    ? {
        href: artwork.href,
        className: "block flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
      }
    : {
        className: "block flex-shrink-0",
      };

  const sizeAttr = options.sizeOverride
    ? options.sizeOverride
    : options.span === "full"
    ? "(min-width:1024px) 100vw, 100vw"
    : options.span === "third"
    ? "(min-width:1024px) 33vw, 100vw"
    : "(min-width:1024px) 50vw, 100vw";

  const wrapperAspect =
    typeof options.forcedAspectRatio === "number"
      ? `${options.forcedAspectRatio}`
      : artwork.aspectRatio ?? undefined;

  return (
    <div className="group flex h-full flex-col justify-end gap-y-8 md:gap-y-10">
      <Wrapper {...(wrapperProps as any)}>
        {artwork.featureImage ? (
          <div
            className={`relative w-full overflow-hidden bg-white${
              options.centerImage ? " flex h-full items-center" : ""
            }`}
            style={
              wrapperAspect
                ? { aspectRatio: wrapperAspect }
                : { aspectRatio: options.span === "full" ? "4 / 3" : "4 / 5" }
            }
          >
            <Image
              src={artwork.featureImage.url}
              alt={artwork.featureImage.altText || artwork.title}
              fill
              className="object-contain object-center transition duration-300 group-hover:scale-[1.01]"
              sizes={sizeAttr}
            />
          </div>
        ) : (
          <div className="bg-neutral-100" style={{ aspectRatio: options.span === "full" ? "4 / 3" : "4 / 5" }} />
        )}
      </Wrapper>

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 text-[15px] leading-snug">
        <div className="min-w-[200px] flex-1">
          <p className="mt-1 break-words underline-offset-4 group-hover:underline">
            <span className="italic">{artwork.title}</span>
            {artwork.year && <span>, {artwork.year}</span>}
          </p>
          <p className="mt-2 font-medium">{artwork.priceLabel}</p>
        </div>

        <div className="flex shrink-0 items-center gap-x-6 text-sm">
          {artwork.href ? (
            <ArrowCtaLink
              href={artwork.href}
              label="View work"
              className="hidden sm:inline-flex hover:opacity-85"
              underline={false}
            />
          ) : null}
          <Link
            href={artwork.enquireHref}
            className="group inline-flex items-center gap-4 text-sm font-medium md:text-base hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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

export default function ArtistArtworksClient({ artworks, rows }: Props) {
  const [viewAll, setViewAll] = useState(false);
  const [isBelowMd, setIsBelowMd] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsBelowMd(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isBelowMd && viewAll) setViewAll(false);
  }, [isBelowMd, viewAll]);

  const showToggle = !isBelowMd && artworks.length > rows.length;

  return (
    <section className="w-full border-t border-neutral-200 pt-8 pb-16 md:pt-10 md:pb-20">
      <Container>
        <div className="pt-6 md:pt-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-12">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
              Artworks
            </h2>
            {showToggle ? (
              <button
                type="button"
                onClick={() => setViewAll((prev) => !prev)}
                aria-pressed={viewAll}
                className="group inline-flex items-center gap-3 self-start text-sm font-medium text-neutral-900 transition-opacity hover:opacity-85 sm:self-auto md:text-base"
              >
                {viewAll ? (
                  <>
                    <span className="inline-flex h-4 w-4 items-center justify-center md:h-5 md:w-5">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        aria-hidden
                        className="h-full w-full"
                      >
                        <path d="M5 5l10 10M15 5L5 15" />
                      </svg>
                    </span>
                    <span className="underline-offset-4 group-hover:underline">Collapse all</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-3 w-3 grid-cols-3 gap-[0.5px] md:h-4 md:w-4">
                      {Array.from({ length: 9 }).map((_, idx) => (
                        <span key={idx} className="block h-full w-full bg-current" />
                      ))}
                    </span>
                    <span className="underline-offset-4 group-hover:underline">View all</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {viewAll ? (
            <div className="hidden grid-cols-1 gap-x-8 gap-y-20 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-22 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-24">
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
                />
              ))}
            </div>
          ) : null}

          {(!viewAll || !showToggle) && (
            <div className="flex flex-col gap-y-24">
              {rows.map((row, idx) => {
                const maxHeightFactor = Math.max(
                  ...row.indexes.map((itemIdx) => artworks[itemIdx]?.heightFactor || 1)
                );
                const forcedAspect = maxHeightFactor > 0 ? 1 / maxHeightFactor : undefined;

                if (row.layout === "full") {
                  const artwork = artworks[row.indexes[0]];
                  return (
                    <div key={`full-${idx}`} className="grid grid-cols-1">
                      {artwork ? (
                        <ArtworkCard
                          artwork={artwork}
                          options={{ span: "full", forcedAspectRatio: forcedAspect }}
                        />
                      ) : null}
                    </div>
                  );
                }

                if (row.layout === "pair") {
                  return (
                    <div
                      key={`pair-${idx}`}
                      className="grid grid-cols-1 gap-y-16 sm:grid-cols-2 sm:items-end sm:gap-x-[5rem] lg:gap-x-[8rem] xl:gap-x-[9.5rem]"
                    >
                      {row.indexes.map((itemIdx) => {
                        const artwork = artworks[itemIdx];
                        return artwork ? (
                          <ArtworkCard
                            key={artwork.id}
                            artwork={artwork}
                            options={{ span: "half", forcedAspectRatio: forcedAspect }}
                          />
                        ) : null;
                      })}
                    </div>
                  );
                }

                return (
                  <div
                    key={`triple-${idx}`}
                    className="grid grid-cols-1 gap-y-16 sm:grid-cols-2 sm:items-end sm:gap-x-[5rem] lg:grid-cols-3 lg:gap-x-[8.5rem] xl:gap-x-[9.5rem]"
                  >
                    {row.indexes.map((itemIdx) => {
                      const artwork = artworks[itemIdx];
                      return artwork ? (
                        <ArtworkCard
                          key={artwork.id}
                          artwork={artwork}
                          options={{ span: "third", forcedAspectRatio: forcedAspect }}
                        />
                      ) : null;
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {isBelowMd ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setViewAll(true)}
                className="group inline-flex items-center gap-3 text-sm font-medium text-neutral-900 transition-opacity hover:opacity-85 md:text-base"
              >
                <span className="grid h-3 w-3 grid-cols-3 gap-[0.5px] md:h-4 md:w-4">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <span key={idx} className="block h-full w-full bg-current" />
                  ))}
                </span>
                <span className="underline-offset-4 group-hover:underline">View all</span>
              </button>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
