import Image from "next/image";
import Link from "next/link";

type Img = { url: string; width?: number; height?: number; alt?: string };

export type WorkItem = {
  image?: Img;
  title?: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  caption?: string;
  link?: string;
};

export default function FeaturedWorks({
  items,
  title = "Featured works",
}: {
  items: WorkItem[];
  title?: string;
}) {
  if (!items?.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24 py-10 md:py-14">
      <div
        className="
          grid grid-cols-1 gap-y-6
          md:[grid-template-columns:repeat(12,minmax(0,1fr))] md:gap-x-14
          xl:[grid-template-columns:repeat(24,minmax(0,1fr))] xl:gap-x-8
        "
      >
        {/* LEFT RAIL */}
        <div
          className="
            col-span-full
            md:[grid-column:1/span_3]
            xl:[grid-column:1/span_5]
            text-[11px] uppercase tracking-[0.18em] opacity-60
          "
        >
          {title}
        </div>

        {/* BODY */}
        <div
          className="
            col-span-full
            md:[grid-column:4/span_5]
            xl:[grid-column:8/span_10]
            3xl:[grid-column:9/span_9]
          "
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((w, i) => (
              <article key={i}>
                {/* Image */}
                {w.image?.url ? (
                  <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100">
                    <div className="aspect-[4/3]" />
                    <Image
                      src={w.image.url}
                      alt={w.image.alt ?? w.title ?? "Artwork"}
                      fill
                      sizes="(min-width:1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}

                {/* Meta */}
                <div className="mt-3 text-sm">
                  {w.title && (
                    <div className="text-base font-medium leading-tight">
                      {w.title}
                      {w.year ? <span className="opacity-70">, {w.year}</span> : null}
                    </div>
                  )}
                  {w.medium ? <div className="text-neutral-700">{w.medium}</div> : null}
                  {w.dimensions ? (
                    <div className="text-neutral-700">{w.dimensions}</div>
                  ) : null}
                  {w.caption ? (
                    <div className="mt-2 text-neutral-700">{w.caption}</div>
                  ) : null}

                  {w.link ? (
                    <div className="mt-3">
                      <Link
                        href={w.link}
                        className="inline-flex items-center gap-2 underline underline-offset-4"
                      >
                        <span aria-hidden>→</span>
                        View work
                      </Link>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

