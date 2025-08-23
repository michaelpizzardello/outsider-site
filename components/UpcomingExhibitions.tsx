// components/UpcomingExhibitions.tsx
import Image from "next/image";
import Link from "next/link";
import { ExhibitionCard, formatDates } from "@/lib/exhibitions";

export default function UpcomingExhibitions({ items }: { items: ExhibitionCard[] }) {
  if (!items?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <h2 className="text-xl md:text-2xl font-medium mb-6">Upcoming</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map(ex => (
          <Link key={ex.handle} href={`/exhibitions/${ex.handle}`} className="group block">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100">
              {ex.hero?.url && (
                <Image
                  src={ex.hero.url}
                  alt={ex.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </div>
            <div className="mt-3">
              <h3 className="text-lg">{ex.title}</h3>
              <p className="text-sm text-neutral-600">
                {formatDates(ex.start, ex.end) || ex.location || "Dates to be announced"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
