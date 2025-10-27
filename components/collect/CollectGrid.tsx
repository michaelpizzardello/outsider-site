"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import * as Slider from "@radix-ui/react-slider";

import type { CollectArtwork } from "@/app/collect/page";
import { useCart } from "@/components/cart/CartContext";
import ArtworkEnquiryModal from "@/components/exhibition/ArtworkEnquiryModal";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";
import { formatCurrency } from "@/lib/formatCurrency";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Props = {
  artworks: CollectArtwork[];
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

function getPriceAmount(artwork: CollectArtwork): number | null {
  const amount = Number(artwork.price?.amount ?? NaN);
  return Number.isFinite(amount) ? amount : null;
}

function parseDimensionValues(input?: string | null): number[] {
  if (!input) return [];
  const matches = input.match(/[\d.,]+/g);
  if (!matches) return [];
  return matches
    .map((token) => Number(token.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
}

function getLargestDimensionMeters(artwork: CollectArtwork): number | null {
  const values: number[] = [];
  const pushCm = (value: number | null) => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      values.push(value);
    }
  };
  pushCm(artwork.widthCm ?? null);
  pushCm(artwork.heightCm ?? null);
  pushCm(artwork.depthCm ?? null);
  if (!values.length && artwork.dimensions) {
    values.push(...parseDimensionValues(artwork.dimensions));
  }
  if (!values.length) return null;
  const maxCm = Math.max(...values);
  return maxCm > 0 ? maxCm / 100 : null;
}

const SIZE_OPTIONS = ["Less than 1m", "1–2m", "More than 1m"] as const;

type SizeFilterOption = (typeof SIZE_OPTIONS)[number];

function matchesSizeBucket(largestMeters: number | null, buckets: SizeFilterOption[]) {
  if (!buckets.length) return true;
  if (largestMeters === null) return false;
  return buckets.some((bucket) => {
    switch (bucket) {
      case "Less than 1m":
        return largestMeters < 1;
      case "1–2m":
        return largestMeters >= 1 && largestMeters <= 2;
      case "More than 1m":
        return largestMeters > 2;
      default:
        return false;
    }
  });
}

function computePriceStep(min: number, max: number) {
  const span = Math.max(max - min, 1);
  const rawStep = span / 100;
  if (rawStep <= 10) return 10;
  if (rawStep <= 25) return 25;
  if (rawStep <= 50) return 50;
  if (rawStep <= 100) return 100;
  if (rawStep <= 250) return 250;
  if (rawStep <= 500) return 500;
  if (rawStep <= 1000) return 1000;
  return Math.ceil(rawStep / 1000) * 1000;
}

type FilterCheckboxGroupProps = {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

type IconProps = {
  className?: string;
};

type PriceStats = {
  min: number;
  max: number;
  hasPrice: boolean;
  currencyCode: string | null;
};

function FilterIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 5.5H17M5.5 10H14.5M8 14.5H12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterCheckboxGroup({
  id,
  label,
  options,
  selected,
  onChange,
}: FilterCheckboxGroupProps) {
  function toggleOption(option: string) {
    const exists = selected.includes(option);
    if (exists) {
      onChange(selected.filter((value) => value !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  const hasSelection = selected.length > 0;
  const selectionLabel = hasSelection
    ? `${selected.length} selected`
    : "All available";

  return (
    <section aria-labelledby={`${id}-label`} className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span
            id={`${id}-label`}
            className="text-sm font-semibold text-neutral-800"
          >
            {label}
          </span>
          <p className="mt-1 text-xs text-neutral-500">{selectionLabel}</p>
        </div>
        {hasSelection ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="max-h-60 overflow-y-auto pr-1">
        {options.map((option, index) => {
          const checkboxId = `${id}-${index}`;
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              htmlFor={checkboxId}
              className="flex cursor-pointer items-center gap-2 border-b border-neutral-100 py-2 text-sm text-neutral-700 last:border-b-0 hover:text-neutral-900"
            >
              <input
                type="checkbox"
                id={checkboxId}
                className="h-4 w-4 accent-neutral-900"
                checked={checked}
                onChange={() => toggleOption(option)}
              />
              <span>{option}</span>
            </label>
          );
        })}
        {options.length === 0 ? (
          <p className="pt-2 text-xs text-neutral-500">No options available.</p>
        ) : null}
      </div>
    </section>
  );
}

type PriceSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  currencyCode?: string | null;
  disabled?: boolean;
};

function PriceSlider({
  min,
  max,
  value,
  onChange,
  currencyCode,
  disabled = false,
}: PriceSliderProps) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || disabled) {
    return (
      <section className="space-y-3" aria-disabled="true">
        <div className="flex items-end justify-between">
          <span className="text-sm font-semibold text-neutral-800">Price</span>
          <span className="text-xs text-neutral-500">No price data</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200" aria-hidden="true" />
      </section>
    );
  }

  const [currentMin, currentMax] = value;
  const formattedMin = formatCurrency(currentMin, currencyCode ?? "GBP");
  const formattedMax = formatCurrency(currentMax, currencyCode ?? "GBP");

  if (min >= max) {
    return (
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-sm font-semibold text-neutral-800">Price</span>
          <span className="text-xs text-neutral-500">{formattedMin}</span>
        </div>
        <p className="text-xs text-neutral-500">
          All available works with listed prices share this price point.
        </p>
      </section>
    );
  }

  const step = computePriceStep(min, max);

  function handleValueChange(next: number[]) {
    if (next.length < 2) return;
    const [nextMin, nextMax] = next;
    const clampedMin = Math.min(Math.max(nextMin, min), max);
    const clampedMax = Math.max(Math.min(nextMax, max), min);
    onChange([
      Math.min(clampedMin, clampedMax),
      Math.max(clampedMin, clampedMax),
    ]);
  }

  return (
    <section aria-labelledby="price-slider-label" className="space-y-3">
      <div className="flex items-end justify-between">
        <span id="price-slider-label" className="text-sm font-semibold text-neutral-800">
          Price
        </span>
        <span className="text-xs text-neutral-500">
          {formattedMin} – {formattedMax}
        </span>
      </div>
      <div className="space-y-4">
        <Slider.Root
          value={[currentMin, currentMax]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleValueChange}
          aria-labelledby="price-slider-label"
          className="relative flex h-8 w-full items-center"
        >
          <Slider.Track className="relative h-0.5 w-full rounded bg-neutral-200">
            <Slider.Range className="absolute h-full rounded bg-neutral-900" />
          </Slider.Track>
          <Slider.Thumb
            className="block h-4 w-4 rounded-full border border-white bg-neutral-900 shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            aria-label="Minimum price"
          />
          <Slider.Thumb
            className="block h-4 w-4 rounded-full border border-white bg-neutral-900 shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            aria-label="Maximum price"
          />
        </Slider.Root>
      </div>
    </section>
  );
}

export default function CollectGrid({ artworks, artists }: Props) {
  const { addLine, openCart } = useCart();
  const [search, setSearch] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<SizeFilterOption[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [enquiryArtwork, setEnquiryArtwork] = useState<CollectArtwork | null>(
    null
  );
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showMobileFilterButton, setShowMobileFilterButton] = useState(false);

  const sizeLookup = useMemo(() => new Set<string>(SIZE_OPTIONS), []);

  const handleSizeChange = useCallback(
    (next: string[]) => {
      const filtered = next.filter((value): value is SizeFilterOption =>
        sizeLookup.has(value)
      );
      setSelectedSizes(filtered);
    },
    [sizeLookup]
  );

  const priceStats = useMemo<PriceStats>(() => {
    const priceEntries = artworks
      .map((artwork) => {
        const amount = getPriceAmount(artwork);
        return amount === null
          ? null
          : {
              amount,
              currencyCode: artwork.price?.currencyCode ?? null,
            };
      })
      .filter((entry): entry is { amount: number; currencyCode: string | null } => Boolean(entry));
    if (!priceEntries.length) {
      return { min: 0, max: 0, hasPrice: false, currencyCode: null };
    }
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const entry of priceEntries) {
      if (entry.amount < min) min = entry.amount;
      if (entry.amount > max) max = entry.amount;
    }
    const currencyCode = priceEntries.find((entry) => entry.currencyCode)?.currencyCode ?? null;
    return {
      min,
      max,
      hasPrice: Number.isFinite(min) && Number.isFinite(max),
      currencyCode,
    };
  }, [artworks]);

  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    priceStats.min,
    priceStats.max,
  ]);

  useEffect(() => {
    if (!priceStats.hasPrice) return;
    setPriceRange((prev) => {
      if (prev[0] === priceStats.min && prev[1] === priceStats.max) {
        return prev;
      }
      return [priceStats.min, priceStats.max];
    });
  }, [priceStats.hasPrice, priceStats.max, priceStats.min]);

  useEffect(() => {
    if (isDesktop) {
      setMobileFiltersOpen(false);
      setShowMobileFilterButton(false);
      return;
    }
    function handleScroll() {
      setShowMobileFilterButton(window.scrollY > 160);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDesktop]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!mobileFiltersOpen) {
      document.body.style.overflow = "";
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileFiltersOpen]);

  const priceFilterActive =
    priceStats.hasPrice &&
    (priceRange[0] > priceStats.min || priceRange[1] < priceStats.max);

  const filtered = useMemo(() => {
    const artistFilters = selectedArtists.map((value) => value.toLowerCase());
    const searchValue = search.trim().toLowerCase();
    return artworks.filter((artwork) => {
      if (artistFilters.length) {
        const artistValue = (artwork.artist ?? "").toLowerCase();
        const matchesArtist = artistFilters.includes(artistValue);
        if (!matchesArtist) return false;
      }
      if (selectedSizes.length) {
        const largestMeters = getLargestDimensionMeters(artwork);
        if (!matchesSizeBucket(largestMeters, selectedSizes)) return false;
      }
      if (priceFilterActive) {
        const amount = getPriceAmount(artwork);
        if (amount === null) return false;
        if (amount < priceRange[0] || amount > priceRange[1]) return false;
      }
      if (searchValue) {
        const haystack = [
          artwork.title,
          artwork.artist,
          artwork.medium,
          artwork.year,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchValue)) return false;
      }
      return true;
    });
  }, [
    artworks,
    search,
    selectedArtists,
    selectedSizes,
    priceFilterActive,
    priceRange,
  ]);

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

  const appliedFilterCount =
    selectedArtists.length +
    selectedSizes.length +
    (priceFilterActive ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    (sortBy !== "recent" ? 1 : 0);
  const hasActiveFilters = appliedFilterCount > 0;

  function resetFilters() {
    setSelectedArtists([]);
    setSelectedSizes([]);
    setSearch("");
    setSortBy("recent");
    if (priceStats.hasPrice) {
      setPriceRange([priceStats.min, priceStats.max]);
    }
  }

  return (
    <>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-7 border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="space-y-5">
              <label className="block">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search artworks..."
                  className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-800 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-600">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortKey)}
                  className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-800 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="recent">Recently added</option>
                  <option value="price-asc">Price (low to high)</option>
                  <option value="size">Size (largest first)</option>
                  <option value="artist">Artist (A–Z)</option>
                </select>
              </label>
            </div>
            <PriceSlider
              min={priceStats.min}
              max={priceStats.max}
              value={priceRange}
              onChange={setPriceRange}
              currencyCode={priceStats.currencyCode}
              disabled={!priceStats.hasPrice}
            />
            <FilterCheckboxGroup
              id="desktop-sizes"
              label="Size"
              options={SIZE_OPTIONS.slice()}
              selected={selectedSizes}
              onChange={handleSizeChange}
            />
            <FilterCheckboxGroup
              id="desktop-artists"
              label="Artist"
              options={artists}
              selected={selectedArtists}
              onChange={setSelectedArtists}
            />
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="h-11 w-full border border-neutral-300 px-3 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-40"
            >
              Reset filters
            </button>
          </div>
        </aside>

        <div className="space-y-20">
          <div className="border-y border-neutral-200 bg-neutral-50 lg:hidden">
            <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex h-11 items-center gap-2 border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-0"
                >
                  <FilterIcon className="h-4 w-4 text-neutral-500" />
                  <span>Filters</span>
                  {appliedFilterCount ? (
                    <span className="ml-1 flex h-[18px] min-w-[18px] items-center justify-center bg-neutral-900 px-1 text-[11px] font-medium text-white">
                      {appliedFilterCount}
                    </span>
                  ) : null}
                </button>
                <label className="sm:w-56">
                  <span className="sr-only">Sort artworks</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortKey)}
                    className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-800 focus:border-neutral-900 focus:outline-none"
                  >
                    <option value="recent">Recently added</option>
                    <option value="price-asc">Price (low to high)</option>
                    <option value="size">Size (largest first)</option>
                    <option value="artist">Artist (A–Z)</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search artworks..."
                  className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-800 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12 xl:grid-cols-4 xl:gap-x-20 xl:gap-y-14">
            {sorted.map((artwork, index) => {
              const priceLabel = formatMoney(artwork.price);
              const hasPrice =
                artwork.price &&
                Number.isFinite(Number(artwork.price.amount)) &&
                Number(artwork.price.amount) > 0;
              const status = (artwork.status || "").trim().toLowerCase();
              const forceEnquire =
                status === "enquire" ||
                status === "enquiry" ||
                status === "reserved" ||
                status === "poa" ||
                status === "price on request" ||
                status === "price_on_request" ||
                status === "on hold" ||
                status === "on_hold";
              const canPurchase =
                hasPrice &&
                artwork.available &&
                Boolean(artwork.variantId) &&
                !forceEnquire;
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
              const detailHref = `/artworks/${artwork.handle}`;

              return (
                <article key={artwork.id} className="flex h-full flex-col">
                  <div className="group bg-neutral-100">
                    <Link
                      href={detailHref}
                      aria-label={`View artwork ${artwork.title}`}
                      className="block"
                    >
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
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="mt-3 space-y-1 text-[0.95rem] leading-snug text-neutral-800">
                      {artwork.artist ? (
                        <p className="font-semibold text-neutral-900">
                          {artwork.artist}
                        </p>
                      ) : null}
                      <h3 className="text-neutral-900">
                        <Link
                          href={detailHref}
                          className="underline-offset-4 transition hover:underline"
                        >
                          <span className="italic">{artwork.title}</span>
                          {artwork.year ? <span>, {artwork.year}</span> : null}
                        </Link>
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
      </div>

      {!isDesktop && showMobileFilterButton && !mobileFiltersOpen ? (
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          aria-label="Open filters"
          className="fixed bottom-6 left-4 z-30 flex items-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-md transition hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-0 sm:left-6"
        >
          <FilterIcon className="h-4 w-4 text-neutral-500" />
          <span>Filters</span>
          {hasActiveFilters ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center bg-neutral-900 px-1 text-[11px] font-medium text-white">
              {appliedFilterCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-sm lg:hidden">
          <div
            className="flex-1"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Artwork filters"
            className="max-h-[85vh] overflow-hidden bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <h2 className="text-sm font-semibold text-neutral-700">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="mt-6 max-h-[60vh] space-y-6 overflow-y-auto pr-1">
              <label className="block">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search artworks..."
                  className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-800 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-600">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortKey)}
                  className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-800 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="recent">Recently added</option>
                  <option value="price-asc">Price (low to high)</option>
                  <option value="size">Size (largest first)</option>
                  <option value="artist">Artist (A–Z)</option>
                </select>
              </label>
              <PriceSlider
                min={priceStats.min}
                max={priceStats.max}
                value={priceRange}
                onChange={setPriceRange}
                currencyCode={priceStats.currencyCode}
                disabled={!priceStats.hasPrice}
              />
              <FilterCheckboxGroup
                id="mobile-sizes"
                label="Size"
                options={SIZE_OPTIONS.slice()}
                selected={selectedSizes}
                onChange={handleSizeChange}
              />
              <FilterCheckboxGroup
                id="mobile-artists"
                label="Artist"
                options={artists}
                selected={selectedArtists}
                onChange={setSelectedArtists}
              />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="h-11 border border-neutral-300 px-4 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-40"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="h-11 bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
