"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";

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

type SortKey = "recent" | "price-asc" | "size" | "artist";

function formatMoney(price: CollectArtwork["price"]) {
  if (!price) return "Price on request";
  const amount = Number(price.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Price on request";
  const formatted = formatCurrency(amount, price.currencyCode);
  return formatted || "Price on request";
}

function getPriceValue(artwork: CollectArtwork) {
  const amount = Number(artwork.price?.amount ?? NaN);
  return Number.isFinite(amount) ? amount : Number.POSITIVE_INFINITY;
}

function getSizeValue(artwork: CollectArtwork) {
  const width = artwork.widthCm ?? null;
  const height = artwork.heightCm ?? null;
  const depth = artwork.depthCm ?? null;
  if (width && height) return width * height;
  if (width && depth) return width * depth;
  if (height && depth) return height * depth;
  if (width) return width;
  if (height) return height;
  if (depth) return depth;
  if (!artwork.dimensions) return 0;
  const matches = artwork.dimensions.match(/[\d.,]+/g);
  if (!matches?.length) return 0;
  const values = matches
    .map((token) => Number(token.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return 0;
  if (values.length === 1) return values[0];
  return values[0] * values[1];
}

type MultiSelectDropdownProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggleOption(option: string) {
    const exists = selected.includes(option);
    if (exists) {
      onChange(selected.filter((value) => value !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  function clearSelection() {
    onChange([]);
  }

  const summary = selected.length
    ? `${label} (${selected.length})`
    : `${label} (All)`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 transition hover:border-neutral-500 focus:border-neutral-900 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{summary}</span>
        <svg
          className="h-4 w-4 text-neutral-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-hidden rounded-sm border border-neutral-300 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto py-2">
            {options.map((option) => {
              const checked = selected.includes(option);
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-neutral-900"
                    checked={checked}
                    onChange={() => toggleOption(option)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">
                No options available.
              </div>
            ) : null}
          </div>
          <div className="border-t border-neutral-200 px-3 py-2">
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-medium uppercase tracking-wide text-neutral-600 transition hover:text-neutral-900 disabled:opacity-40"
              disabled={selected.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CollectGrid({ artworks, mediums, artists }: Props) {
  const { addLine, openCart } = useCart();
  const [search, setSearch] = useState("");
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [enquiryArtwork, setEnquiryArtwork] = useState<CollectArtwork | null>(
    null
  );

  const filtered = useMemo(() => {
    const mediumFilters = selectedMediums.map((value) => value.toLowerCase());
    const artistFilters = selectedArtists.map((value) => value.toLowerCase());
    return artworks.filter((artwork) => {
      if (mediumFilters.length) {
        const mediumValue = artwork.medium?.toLowerCase() ?? "";
        const matchesMedium = mediumFilters.some((filter) =>
          mediumValue.includes(filter)
        );
        if (!matchesMedium) return false;
      }
      if (artistFilters.length) {
        const artistValue = (artwork.artist ?? "").toLowerCase();
        const matchesArtist = artistFilters.includes(artistValue);
        if (!matchesArtist) return false;
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
  }, [artworks, search, selectedArtists, selectedMediums]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    switch (sortBy) {
      case "price-asc":
        next.sort((a, b) => getPriceValue(a) - getPriceValue(b));
        break;
      case "artist":
        next.sort((a, b) => {
          const aName = (a.artist ?? "").toLowerCase();
          const bName = (b.artist ?? "").toLowerCase();
          if (aName && bName) return aName.localeCompare(bName);
          if (aName) return -1;
          if (bName) return 1;
          return 0;
        });
        break;
      case "size":
        next.sort((a, b) => getSizeValue(b) - getSizeValue(a));
        break;
      case "recent":
      default:
        break;
    }
    return next;
  }, [filtered, sortBy]);

  const aspectSets = useMemo(() => {
    const ratios = sorted.map((artwork) => {
      const width = Number(artwork.image?.width ?? 0);
      const height = Number(artwork.image?.height ?? 0);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null;
      }
      return width / height;
    });

    function buildRowAspects(columns: number) {
      if (columns <= 0) return Array(ratios.length).fill(null);
      const values: Array<number | null> = Array(ratios.length).fill(null);
      for (let start = 0; start < ratios.length; start += columns) {
        let minRatio = Number.POSITIVE_INFINITY;
        for (let index = start; index < start + columns && index < ratios.length; index += 1) {
          const ratio = ratios[index];
          if (ratio && ratio < minRatio) {
            minRatio = ratio;
          }
        }
        if (!Number.isFinite(minRatio)) {
          minRatio = Number.NaN;
        }
        for (let index = start; index < start + columns && index < ratios.length; index += 1) {
          values[index] = Number.isFinite(minRatio) ? minRatio : ratios[index];
        }
      }
      return values;
    }

    return {
      ratios,
      sm: buildRowAspects(2),
      lg: buildRowAspects(3),
      xl: buildRowAspects(4),
    };
  }, [sorted]);

  async function handleAddToCart(artwork: CollectArtwork) {
    if (!artwork.variantId) {
      openCart();
      return;
    }
    await addLine({ merchandiseId: artwork.variantId, quantity: 1 });
  }

  return (
    <div className="space-y-20">
      <div className="bg-neutral-100 pb-2 pt-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          <div className="sm:flex-1">
            <span className="sr-only">Filter by medium</span>
            <MultiSelectDropdown
              label="Medium"
              options={mediums}
              selected={selectedMediums}
              onChange={setSelectedMediums}
            />
          </div>
          <div className="sm:flex-1">
            <span className="sr-only">Filter by artist</span>
            <MultiSelectDropdown
              label="Artist"
              options={artists}
              selected={selectedArtists}
              onChange={setSelectedArtists}
            />
          </div>
          <label className="sm:flex-1 text-sm text-neutral-600">
            <span className="sr-only">Sort artworks</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            >
              <option value="recent">Sort by</option>
              <option value="price-asc">Sort by price (low to high)</option>
              <option value="size">Sort by size (largest first)</option>
              <option value="artist">Sort by artist (A–Z)</option>
            </select>
          </label>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12 xl:grid-cols-4 xl:gap-x-20 xl:gap-y-14">
        {sorted.map((artwork, index) => {
          const priceLabel = formatMoney(artwork.price);
          const hasPrice =
            artwork.price &&
            Number.isFinite(Number(artwork.price.amount)) &&
            Number(artwork.price.amount) > 0;
          const canPurchase =
            hasPrice && artwork.available && Boolean(artwork.variantId);
          const image = artwork.image;
          const naturalAspect =
            image?.width && image?.height && image.height > 0
              ? `${image.width} / ${image.height}`
              : undefined;
          const aspectStyles: CSSProperties = {};
          if (naturalAspect) {
            aspectStyles["--artwork-aspect-mobile"] = naturalAspect;
          }
          const smAspect = aspectSets.sm[index];
          const lgAspect = aspectSets.lg[index];
          const xlAspect = aspectSets.xl[index];
          if (typeof smAspect === "number" && Number.isFinite(smAspect)) {
            aspectStyles["--artwork-aspect-sm"] = `${smAspect}`;
          }
          if (typeof lgAspect === "number" && Number.isFinite(lgAspect)) {
            aspectStyles["--artwork-aspect-lg"] = `${lgAspect}`;
          }
          if (typeof xlAspect === "number" && Number.isFinite(xlAspect)) {
            aspectStyles["--artwork-aspect-xl"] = `${xlAspect}`;
          }
          const aspectClass =
            "relative w-full overflow-hidden transition group-hover:opacity-90 aspect-[var(--artwork-aspect-mobile,_4/5)] sm:aspect-[var(--artwork-aspect-sm,var(--artwork-aspect-mobile,_4/5))] lg:aspect-[var(--artwork-aspect-lg,var(--artwork-aspect-sm,var(--artwork-aspect-mobile,_4/5)))] xl:aspect-[var(--artwork-aspect-xl,var(--artwork-aspect-lg,var(--artwork-aspect-sm,var(--artwork-aspect-mobile,_4/5)))))] flex items-center justify-center sm:items-end sm:justify-start";
          const divStyle =
            Object.keys(aspectStyles).length > 0 ? aspectStyles : undefined;
          const detailHref = artwork.exhibitionHandle
            ? `/exhibitions/${artwork.exhibitionHandle}/artworks/${artwork.handle}`
            : null;

          return (
            <article key={artwork.id} className="flex h-full flex-col">
              <div className="group bg-neutral-100">
                {detailHref ? (
                  <Link href={detailHref} aria-label={`View artwork ${artwork.title}`} className="block">
                    <div className={aspectClass} style={divStyle}>
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.altText || `${artwork.title} artwork`}
                          fill
                          sizes="(min-width:1600px) 18vw, (min-width:1200px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                          className="object-contain object-center sm:object-bottom transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="h-full w-full bg-neutral-200" />
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className={aspectClass} style={divStyle}>
                    {image?.url ? (
                      <Image
                        src={image.url}
                        alt={image.altText || `${artwork.title} artwork`}
                        fill
                        sizes="(min-width:1600px) 18vw, (min-width:1200px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                        className="object-contain object-center sm:object-bottom"
                      />
                    ) : (
                      <div className="h-full w-full bg-neutral-200" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="mt-3 space-y-1 text-[0.95rem] leading-snug text-neutral-800">
                  {artwork.artist ? (
                    <p className="font-semibold text-neutral-900">
                      {artwork.artist}
                    </p>
                  ) : null}
                  <h3 className="text-neutral-900">
                    {detailHref ? (
                      <Link
                        href={detailHref}
                        className="underline-offset-4 transition hover:underline"
                      >
                        <span className="italic">{artwork.title}</span>
                        {artwork.year ? <span>, {artwork.year}</span> : null}
                      </Link>
                    ) : (
                      <>
                        <span className="italic">{artwork.title}</span>
                        {artwork.year ? <span>, {artwork.year}</span> : null}
                      </>
                    )}
                  </h3>
                  {artwork.medium ? (
                    <p className="text-sm text-neutral-700">{artwork.medium}</p>
                  ) : null}
                  {artwork.dimensions ? (
                    <p className="text-sm text-neutral-500">{artwork.dimensions}</p>
                  ) : null}
                </div>

                <div className="mt-auto space-y-4 pt-4 text-sm text-neutral-700 sm:pt-5">
                  <p className="font-bold text-neutral-900">{priceLabel}</p>
                  {canPurchase ? (
                    <OutlineLabelButton
                      onClick={() => {
                        void handleAddToCart(artwork);
                      }}
                    >
                      Purchase
                    </OutlineLabelButton>
                  ) : (
                    <OutlineLabelButton onClick={() => setEnquiryArtwork(artwork)}>
                      Enquire
                    </OutlineLabelButton>
                  )}
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
