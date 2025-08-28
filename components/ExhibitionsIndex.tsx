"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExhibitionCard } from "@/lib/exhibitions"; // type-only (erased at build)
import { formatDates } from "@/lib/formatDates"; // safe utility
import Container from "@/components/Container";
import clsx from "clsx";

// Local helper to avoid importing runtime from server-only lib
function headingParts({
  title,
  artist,
  isGroup,
}: {
  title: string;
  artist?: string;
  isGroup?: boolean;
}) {
  const a = (artist ?? "").trim().toLowerCase();
  const group =
    !!isGroup ||
    a === "group exhibition" ||
    a === "group show" ||
    a === "group";

  if (group)
    return { primary: title, secondary: undefined, isGroup: true as const };
  if (artist)
    return { primary: artist, secondary: title, isGroup: false as const };
  return { primary: title, secondary: undefined, isGroup: false as const };
}

export default function ExhibitionsIndex({
  items,
  total,
  page,
  pageSize,
  status,
  year,
}: {
  items: ExhibitionCard[];
  total: number;
  page: number;
  pageSize: number;
  status: "current" | "upcoming" | "past";
  year?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    if (key !== "page") params.delete("page"); // reset pagination
    router.push(`/exhibitions?${params.toString()}`);
  };

  return (
    <main className="py-12 sm:py-16">
      <Container>
        {/* Tabs */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          {(["current", "upcoming", "past"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setParam("status", k)}
              className={clsx(
                "rounded-full px-3 py-1 border",
                k === status
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 hover:border-black"
              )}
              aria-current={k === status ? "page" : undefined}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}

          {/* Year filter only for Past */}
          {status === "past" && (
            <select
              className="ml-auto rounded border border-neutral-300 px-3 py-1 text-sm"
              value={year ?? ""}
              onChange={(e) => setParam("year", e.target.value || undefined)}
            >
              <option value="">All years</option>
              {getYearOptions().map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {items.map((ex) => {
            const { primary, secondary } = headingParts({
              title: ex.title,
              artist: ex.artist,
              isGroup: ex.isGroup,
            });
            return (
              <article key={ex.handle} className="group">
                <Link href={`/exhibitions/${ex.handle}`} className="block">
                  {ex.hero?.url && (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={ex.hero.url}
                        alt={ex.hero.alt ?? ex.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <h3 className="mt-4 text-base font-medium leading-snug">
                    <span className="block">{primary}</span>
                    {secondary && (
                      <span className="block text-neutral-500">
                        {secondary}
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {ex.start
                      ? formatDates(ex.start, ex.end)
                      : ex.summary ?? ""}
                  </p>
                  {ex.location && (
                    <p className="text-sm text-neutral-500">{ex.location}</p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="mt-12 flex items-center justify-center gap-2 text-sm"
            aria-label="Pagination"
          >
            <button
              className="rounded border border-neutral-300 px-3 py-1 disabled:opacity-40"
              onClick={() => setParam("page", String(Math.max(1, page - 1)))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              className="rounded border border-neutral-300 px-3 py-1 disabled:opacity-40"
              onClick={() =>
                setParam("page", String(Math.min(totalPages, page + 1)))
              }
              disabled={page >= totalPages}
            >
              Next
            </button>
          </nav>
        )}
      </Container>
    </main>
  );
}

function getYearOptions() {
  const now = new Date();
  const thisYear = now.getFullYear();
  const start = thisYear - 12;
  return Array.from(
    { length: thisYear - start + 1 },
    (_, i) => start + i
  ).reverse();
}
