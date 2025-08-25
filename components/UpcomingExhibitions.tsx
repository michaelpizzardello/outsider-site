// components/UpcomingExhibitions.tsx
import Image from "next/image";
import Link from "next/link";
import { type ExhibitionCard, formatDates } from "@/lib/exhibitions";

type Props = {
  items: ExhibitionCard[];                  // List to render (returns null if empty)
  title?: string;                           // Section title (default: "Upcoming")
  headingLevel?: "h2" | "h3" | "none";      // Which heading tag to use, or none
  className?: string;                       // Optional section wrapper classes
  gridClassName?: string;                   // Optional grid override
  showDates?: boolean;                      // Toggle date line (default: true)
};

export default function UpcomingExhibitions({
  items,
  title = "Upcoming",
  headingLevel = "h2",
  className = "",
  gridClassName = "grid grid-cols-1 md:grid-cols-2 gap-8",
  showDates = true,
}: Props) {
  if (!items?.length) return null;

  const Heading =
    headingLevel === "none" ? (() => null) as any : (headingLevel as "h2" | "h3");

  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-12 ${className}`}>
      {/* Title */}
      {headingLevel !== "none" && (
        <Heading className="text-xl md:text-2xl font-medium mb-6">{title}</Heading>
      )}

      {/* Grid */}
      <div className={gridClassName}>
        {items.map((ex) => {
          const imgSrc = ex.hero?.url;
          const alt = ex.hero?.alt || ex.title;
          const dates = formatDates(ex.start, ex.end);

          return (
            <Link key={ex.handle} href={`/exhibitions/${ex.handle}`} className="group block">
              {/* Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100">
                {imgSrc && (
                  <Image
                    src={imgSrc}
                    alt={alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 600px"
                  />
                )}
              </div>

              {/* Meta */}
              <div className="mt-3">
                <div className="text-lg font-medium">{ex.title}</div>
                {showDates && dates && (
                  <div className="text-sm text-neutral-500">{dates}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
