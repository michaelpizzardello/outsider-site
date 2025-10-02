import type { CSSProperties } from "react";

import Container from "@/components/layout/Container";
import Image from "next/image";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

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
  const hasDimensions = Boolean(
    portrait && typeof portrait.width === "number" && portrait.width > 0 && typeof portrait.height === "number" && portrait.height > 0
  );
  const portraitAspectRatio = hasDimensions && portrait?.width && portrait?.height
    ? Math.max(portrait.width / portrait.height, 0.1)
    : 0.75;
  const portraitBoxStyle: CSSProperties | undefined = portrait
    ? {
        aspectRatio: portraitAspectRatio,
        width: "100%",
      }
    : undefined;

  return (
    <section className="w-full border-t border-neutral-200 pt-8 pb-16 md:pt-10 md:pb-20">
      <Container>
        <div className="pt-6 md:pt-8">
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>

          <div className="mt-8 grid grid-cols-1 items-center gap-y-8 md:grid-cols-2 md:gap-x-[clamp(32px,4vw,72px)]">
            {/* Portrait occupies full column */}
            {portrait ? (
              <figure className="flex w-full flex-col items-center md:items-start">
                <div className="relative max-w-full" style={portraitBoxStyle}>
                  <Image
                    src={portrait.url}
                    alt={figAlt}
                    fill
                    sizes="(min-width:1536px) 50vw, (min-width:1024px) 50vw, 100vw"
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
                {captionHtml ? (
                  <figcaption
                    className="mt-3 max-w-prose text-sm leading-relaxed [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: captionHtml }}
                  />
                ) : null}
              </figure>
            ) : null}

            {/* Bio + CTA */}
            <div className="flex flex-col justify-center text-base leading-relaxed lg:text-lg lg:leading-8">
              <div className="max-w-[60ch] w-full md:mx-auto">
                {bioHtml ? (
                  <div
                    className="prose max-w-none prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 lg:prose-lg"
                    dangerouslySetInnerHTML={{ __html: bioHtml }}
                  />
                ) : null}

                {handle ? (
                  <div className={bioHtml ? "mt-6" : "mt-4"}>
                    <ArrowCtaLink
                      href={`/artists/${handle}`}
                      label="View Artist Profile"
                      className="leading-relaxed"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
