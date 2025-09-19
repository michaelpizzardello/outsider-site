import Image from "next/image";
import Link from "next/link";

type Img = { url: string; width?: number; height?: number; alt?: string };

export default function AboutArtistWithPortrait({
  title = "About the artist",
  name,
  bioHtml,
  handle,
  portrait,
  captionHtml,
}: {
  title?: string;
  name?: string | null;
  bioHtml?: string | null;
  handle?: string | null;
  portrait?: Img | null;
  captionHtml?: string | null;
}) {
  if (!bioHtml && !portrait && !handle) return null;

  const figAlt = portrait?.alt || (name ? `Portrait of ${name}` : "Portrait");

  return (
    <section className="w-full">
      {/* Header aligned with page grid/margins */}
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24 py-10 md:py-14">
        {/* Header row: match other sections (left rail micro label) */}
        <div className="grid grid-cols-1 md:[grid-template-columns:repeat(12,minmax(0,1fr))] xl:[grid-template-columns:repeat(24,minmax(0,1fr))] md:gap-x-14 xl:gap-x-8">
          <div className="col-span-full md:[grid-column:1/span_3] xl:[grid-column:1/span_5] text-[11px] uppercase tracking-[0.18em] opacity-60">
            {title}
          </div>
        </div>

        {/* Content row aligned to body columns */}
        <div className="mt-6 grid grid-cols-1 md:[grid-template-columns:repeat(12,minmax(0,1fr))] xl:[grid-template-columns:repeat(24,minmax(0,1fr))] md:gap-x-14 xl:gap-x-8">
          <div className="col-span-full md:[grid-column:4/span_9] xl:[grid-column:6/span_18]">
            <div className="flex flex-col lg:flex-row gap-y-8 lg:gap-x-10 xl:gap-x-10 items-start">
              {/* Portrait */}
              {portrait ? (
                <figure className="w-full lg:w-1/2">
                  {portrait.width && portrait.height ? (
                    <Image
                      src={portrait.url}
                      alt={figAlt}
                      width={portrait.width}
                      height={portrait.height}
                      sizes="(min-width:1536px) 50vw, (min-width:1024px) 50vw, 100vw"
                      className="w-full h-auto object-cover"
                      priority
                    />
                  ) : (
                    <div className="relative w-full">
                      <div className="aspect-[3/2] w-full" />
                      <Image
                        src={portrait.url}
                        alt={figAlt}
                        fill
                        sizes="(min-width:1536px) 50vw, (min-width:1024px) 50vw, 100vw"
                        className="object-contain"
                        priority
                      />
                    </div>
                  )}
                  {captionHtml ? (
                    <figcaption
                      className="text-sm max-w-prose mt-3 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: captionHtml }}
                    />
                  ) : null}
                </figure>
              ) : null}

              {/* Bio text */}
              <div className={portrait ? "w-full lg:w-1/2" : "w-full"}>
                {bioHtml ? (
                  <div className="max-w-[60ch] w-full md:mx-auto">
                    <div
                      className="prose max-w-none prose-p:mb-4 prose-ul:my-4 prose-ol:my-4 text-[1rem] min-[900px]:text-[0.96rem] xl:text-[1rem]"
                      dangerouslySetInnerHTML={{ __html: bioHtml }}
                    />
                  </div>
                ) : null}

                {handle ? (
                  <div className="mt-4">
                    <Link
                      href={`/artists/${handle}`}
                      className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
                    >
                      <span aria-hidden>→</span>
                      View {name || "artist"} profile
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
