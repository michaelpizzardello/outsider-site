"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { CollectArtwork } from "@/app/collect/page";
import { useCart } from "@/components/cart/CartContext";
import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";

type Props = {
  artworks: CollectArtwork[];
  mediums: string[];
  artists: string[];
};

function formatMoney(price: CollectArtwork["price"]) {
  if (!price) return "Price on request";
  const amount = Number(price.amount);
  if (!Number.isFinite(amount)) return "Price on request";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: price.currencyCode,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch (error) {
    return `${price.currencyCode} ${amount.toFixed(0)}`;
  }
}

function availabilityLabel(artwork: CollectArtwork) {
  if (artwork.available) return "Available";
  if (artwork.status) return artwork.status;
  return "Sold";
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
    <div className="space-y-10">
      <div className="flex flex-col gap-6 bg-white pb-2 pt-0 md:flex-row md:items-center">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-end md:gap-4">
          <label className="flex-1 text-sm text-neutral-500">
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </label>
          <label className="flex-1 text-sm text-neutral-500">
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
          <label className="flex-1 text-sm text-neutral-500">
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

      <div className="grid grid-cols-1 gap-x-12 gap-y-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((artwork) => {
          const priceLabel = formatMoney(artwork.price);
          const status = availabilityLabel(artwork);

          return (
            <article key={artwork.id} className="flex h-full flex-col gap-5">
              <div className="relative flex h-[220px] w-full items-end justify-center overflow-hidden border border-neutral-200 bg-neutral-50">
                {artwork.image?.url ? (
                  <Image
                    src={artwork.image.url}
                    alt={artwork.image.altText || `${artwork.title} artwork`}
                    fill
                    sizes="(min-width:1600px) 18vw, (min-width:1200px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                    className="object-contain"
                    style={{ objectPosition: "center bottom" }}
                  />
                ) : null}
                {!artwork.available ? (
                  <span className="absolute right-4 top-4 bg-neutral-900 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                    {status}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="space-y-3 text-sm text-neutral-600">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-neutral-500">
                    {status}
                  </p>
                  <h3 className="text-base font-medium leading-snug text-neutral-900">
                    {artwork.title}
                    {artwork.year ? (
                      <span className="text-neutral-500">, {artwork.year}</span>
                    ) : null}
                  </h3>
                  {artwork.artist ? <p>{artwork.artist}</p> : null}
                  {artwork.medium ? <p>{artwork.medium}</p> : null}
                  {artwork.dimensions ? (
                    <p className="text-neutral-500">{artwork.dimensions}</p>
                  ) : null}
                </div>

                <div className="mt-auto space-y-3">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-900">
                    {priceLabel}
                  </p>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        void handleAddToCart(artwork);
                      }}
                      disabled={!artwork.available || !artwork.variantId}
                      className={`flex-1 border border-neutral-900 px-4 py-2 text-xs uppercase tracking-[0.24em] transition ${
                        artwork.available && artwork.variantId
                          ? "bg-neutral-900 text-white hover:bg-black"
                          : "bg-neutral-200 text-neutral-500 border-neutral-300 cursor-not-allowed"
                      }`}
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiryArtwork(artwork)}
                      className="flex-1 border border-neutral-300 px-4 py-2 text-xs uppercase tracking-[0.24em] text-neutral-900 transition hover:border-neutral-900"
                    >
                      Enquire
                    </button>
                  </div>
                  {artwork.quantityAvailable !== null ? (
                    <p className="text-xs text-neutral-500">
                      {artwork.quantityAvailable > 1
                        ? `${artwork.quantityAvailable} editions available`
                        : "Unique work"}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-sm text-neutral-500">
          No works match your filters. Adjust the filters or contact our team
          for tailored recommendations.
        </div>
      ) : null}

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
