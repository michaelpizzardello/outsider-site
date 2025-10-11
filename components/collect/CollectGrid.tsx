"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { CollectArtwork } from "@/app/collect/page";
import { useCart } from "@/components/cart/CartContext";
import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";
import { formatCurrency } from "@/lib/formatCurrency";

type Props = {
  artworks: CollectArtwork[];
  mediums: string[];
  artists: string[];
};

function formatMoney(price: CollectArtwork["price"]) {
  if (!price) return "Price on request";
  const amount = Number(price.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Price on request";
  const formatted = formatCurrency(amount, price.currencyCode);
  return formatted || "Price on request";
}

export default function CollectGrid({ artworks, mediums, artists }: Props) {
  const { addLine, openCart } = useCart();
  const [search, setSearch] = useState("");
  const [medium, setMedium] = useState<string>("all");
  const [artist, setArtist] = useState<string>("all");
  const [enquiryArtwork, setEnquiryArtwork] = useState<CollectArtwork | null>(
    null
  );

  const filtered = useMemo(() => {
    return artworks.filter((artwork) => {
      if (medium !== "all") {
        const mediumValue = artwork.medium?.toLowerCase() ?? "";
        if (!mediumValue.includes(medium.toLowerCase())) return false;
      }
      if (artist !== "all") {
        if ((artwork.artist ?? "").toLowerCase() !== artist.toLowerCase())
          return false;
      }
      if (search.trim()) {
        const haystack = [
          artwork.title,
          artwork.artist,
          artwork.medium,
          artwork.year,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [artworks, artist, medium, search]);

  async function handleAddToCart(artwork: CollectArtwork) {
    if (!artwork.variantId) {
      openCart();
      return;
    }
    await addLine({ merchandiseId: artwork.variantId, quantity: 1 });
  }

  return (
    <div className="space-y-20">
      <div className="bg-white pb-2 pt-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          <label className="sm:flex-1 text-sm text-neutral-600">
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </label>
          <label className="sm:flex-1 text-sm text-neutral-600">
            <span className="sr-only">Filter by medium</span>
            <select
              value={medium}
              onChange={(event) => setMedium(event.target.value)}
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            >
              <option value="all">Filter by medium</option>
              {mediums.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:flex-1 text-sm text-neutral-600">
            <span className="sr-only">Filter by artist</span>
            <select
              value={artist}
              onChange={(event) => setArtist(event.target.value)}
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            >
              <option value="all">Filter by artist</option>
              {artists.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-3xl bg-neutral-100 px-6 py-10 sm:px-8 sm:py-12">
        {filtered.length ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-20 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-24 xl:grid-cols-4 xl:gap-x-20">
            {filtered.map((artwork) => {
              const priceLabel = formatMoney(artwork.price);
              const hasPrice =
                artwork.price &&
                Number.isFinite(Number(artwork.price.amount)) &&
                Number(artwork.price.amount) > 0;
              const canPurchase =
                hasPrice && artwork.available && Boolean(artwork.variantId);
              const wrapperAspect = "4 / 5";

              return (
                <article key={artwork.id} className="flex h-full flex-col">
                  <div className="group bg-white">
                    <div
                      className="relative w-full"
                      style={{ aspectRatio: wrapperAspect }}
                    >
                      {artwork.image?.url ? (
                        <Image
                          src={artwork.image.url}
                          alt={
                            artwork.image.altText || `${artwork.title} artwork`
                          }
                          fill
                          sizes="(min-width:1600px) 18vw, (min-width:1200px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                          className="object-contain object-bottom"
                        />
                      ) : (
                        <div className="h-full w-full bg-neutral-200" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="mt-6 space-y-2 text-[0.95rem] leading-relaxed text-neutral-800">
                      {artwork.artist ? (
                        <p className="text-neutral-900">{artwork.artist}</p>
                      ) : null}
                      <h3 className="text-neutral-900">
                        <span className="italic">{artwork.title}</span>
                        {artwork.year ? <span>, {artwork.year}</span> : null}
                      </h3>
                      {artwork.medium ? <p>{artwork.medium}</p> : null}
                      {artwork.dimensions ? (
                        <p className="text-neutral-500">
                          {artwork.dimensions}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-auto space-y-4 pt-4 text-sm text-neutral-700 sm:pt-5">
                      <p className="font-medium text-neutral-900">{priceLabel}</p>
                      {canPurchase ? (
                        <OutlineLabelButton
                          onClick={() => {
                            void handleAddToCart(artwork);
                          }}
                        >
                          Purchase
                        </OutlineLabelButton>
                      ) : (
                        <OutlineLabelButton
                          onClick={() => setEnquiryArtwork(artwork)}
                        >
                          Enquire
                        </OutlineLabelButton>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-sm text-neutral-500">
            No works match your filters. Adjust the filters or contact our team
            for tailored recommendations.
          </div>
        )}
      </div>

      <ArtworkEnquiryModal
        open={Boolean(enquiryArtwork)}
        onClose={() => setEnquiryArtwork(null)}
        artwork={
          enquiryArtwork
            ? {
                title: enquiryArtwork.title,
                artist: enquiryArtwork.artist ?? undefined,
                year: enquiryArtwork.year ?? undefined,
                medium: enquiryArtwork.medium ?? undefined,
                dimensions: enquiryArtwork.dimensions ?? undefined,
                price: formatMoney(enquiryArtwork.price),
                image: enquiryArtwork.image
                  ? {
                      url: enquiryArtwork.image.url,
                      alt: enquiryArtwork.image.altText ?? enquiryArtwork.title,
                    }
                  : undefined,
              }
            : {
                title: "",
              }
        }
      />
    </div>
  );
}
