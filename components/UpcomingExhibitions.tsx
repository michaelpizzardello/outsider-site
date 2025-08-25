// components/UpcomingExhibitions.tsx
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import { type ExhibitionCard, formatDates } from "@/lib/exhibitions";

type Props = {
  items: ExhibitionCard[];                  // List to render (returns null if empty)
  title?: string;                           // Section title (default: "Upcoming")
  headingLevel?: "h2" | "h3" | "none";      // Which heading tag to use, or none
  className?: string;                       // Optional section wrapper classes
  gridClassName?: string;                   // Optional grid override
  showDates?: boolean;                      // Toggle date line (default: true)
  datePosition?: "below" | "chip";          // Where to show dates (default: "below")
};

export default function UpcomingExhibitions({
  items,
  title = "Upcoming",
  headingLevel = "h2",
  className = "",
  gridClassName = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8",
  showDates = true,
  datePosition = "below",
}: Props) {
  if (!items?.length) return null;

  const Heading =
    headingLevel === "none" ? (() => null) as any : (headingLevel as "h2" | "h3");

  return (
    <section className={`py-10 md:py-12 ${className}`}>
      <Container>
        {/* Title */}
        {headingLevel !== "none" && (
          <Heading className="text-xl md:text-2xl font-medium mb-6">{title}</Heading>
        )}

        {/* Grid */}
        <div className={gridClassName}>
          {items.map((ex) => {
            const imgSrc = ex.hero?.url;
            const alt = ex.hero?.alt || ex.title;
            const hasDates = Boolean(ex.start && ex.end);
            const dates = showDates && hasDates ? formatDates(ex.start!, ex.end!) : null;

            return (
              <Link
                key={ex.handle}
                href={`/exhibitions/${ex.handle}`}
                className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(min-width:1536px) 640px, (min-width:768px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm">
                      No image
                    </div>
                  )}

                  {/* Optional date chip on image */}
                  {dates && datePosition === "chip" && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                      <span className="rounded-md bg-black/55 px-2.5 py-1.5 text-[11px] tracking-wide text-white backdrop-blur">
                        {dates}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="mt-3">
                  <div className="text-lg font-medium leading-snug line-clamp-2">{ex.title}</div>
                  {dates && datePosition === "below" && (
                    <div className="text-sm text-neutral-500">{dates}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
