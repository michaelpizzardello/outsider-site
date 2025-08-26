// components/UpcomingExhibitions.tsx
import Image from "next/image";
import Link from "next/link";
import { type ExhibitionCard, formatDates } from "@/lib/exhibitions";

export default function UpcomingExhibitions({ items }: { items: ExhibitionCard[] }) {
  if (!items?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <h2 className="sr-only">Upcoming exhibitions</h2>

      <div className="flex flex-col divide-y divide-neutral-200">
        {items.map((ex) => (
          <Article key={ex.handle} ex={ex} />
        ))}
      </div>
    </section>
  );
}

function Article({ ex }: { ex: ExhibitionCard }) {
  const href = `/exhibitions/${ex.handle}`;

  return (
    <article className="py-10 md:py-14 first:pt-0">
      <Link
        href={href}
        className="group grid grid-cols-1 lg:grid-cols-12 gap-y-6 md:gap-y-8 lg:gap-x-12"
      >
        {/* Image: full width on mobile/tablet; left column on desktop */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100 lg:col-span-7">
          {ex.hero?.url && (
            <Image
              src={ex.hero.url}
              alt={ex.hero?.alt ?? ex.title}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )}
        </div>

        {/* Text block */}
        <div className="lg:col-span-5 flex flex-col">
          <p className="text-[11px] md:text-xs font-medium uppercase tracking-[.22em] text-neutral-500">
            {ex.location ? "GALLERY EXHIBITION" : "EXHIBITION"}
          </p>

          <h3 className="mt-3 md:mt-4 text-3xl md:text-5xl font-medium leading-tight">
            {ex.title}
          </h3>

          {ex.summary && (
            <p className="mt-1 md:mt-2 italic text-xl md:text-2xl text-neutral-800">
              {ex.summary}
            </p>
          )}

          <div className="mt-6 md:mt-8 space-y-1 text-base md:text-xl">
            <p>{formatDates(ex.start, ex.end)}</p>
            {ex.location && <p className="font-medium">{ex.location}</p>}
          </div>

          <span className="mt-8 inline-flex items-center gap-3 text-base md:text-xl font-medium">
            <span aria-hidden>→</span>
            <span>Visit exhibition</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
