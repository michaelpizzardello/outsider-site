import Container from "@/components/layout/Container";
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
    <section className="w-full py-10 md:py-14">
      <Container>
        <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 sm:gap-x-10 md:gap-x-12 lg:gap-x-16 xl:gap-x-20 2xl:gap-x-24 gap-y-8 items-center">
          {/* Portrait occupies full column */}
          {portrait ? (
            <figure className="w-full">
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
                  className="mt-3 max-w-prose text-sm leading-relaxed [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: captionHtml }}
                />
              ) : null}
            </figure>
          ) : null}

          {/* Bio + CTA */}
          <div className="flex flex-col justify-center text-base leading-relaxed">
            {bioHtml ? (
              <div className="max-w-[60ch] w-full md:mx-auto">
                <div
                  className="prose max-w-none prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4"
                  dangerouslySetInnerHTML={{ __html: bioHtml }}
                />
              </div>
            ) : null}

            {handle ? (
              <div className="mt-4">
                <Link
                  href={`/artists/${handle}`}
                  className="group inline-flex items-center gap-2 text-sm leading-relaxed"
                >
                  <span aria-hidden className="translate-y-[1px]">→</span>
                  <span className="underline underline-offset-4 group-hover:underline">
                    View {name || "artist"} profile
                  </span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
