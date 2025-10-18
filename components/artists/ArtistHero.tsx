// components/artists/ArtistHero.tsx
// ---------------------------------------------------------------------------
// Artist detail heading: responsive two-column layout that stacks portrait and
// metadata on compact screens, then splits to side-by-side at `lg`.
// ---------------------------------------------------------------------------

import Image from "next/image";

import Container from "@/components/layout/Container";
import { EXHIBITION_LABEL_BASE_CLASS } from "@/components/exhibitions/ExhibitionLabel";

export type ArtistHeroProps = {
  name: string;
  nationality?: string;
  birthYear?: string;
  cover?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  } | null;
};

export default function ArtistHero({
  name,
  nationality,
  birthYear,
  cover,
}: ArtistHeroProps) {
  // Normalise display strings so spacing/formatting is predictable.
  const displayName = name.trim();
  const trimmedNationality = nationality?.trim();
  const trimmedBirthYear = birthYear?.trim();

  const nationalityLine = trimmedNationality ?? null;
  const birthLine = (() => {
    // Shopify sometimes stores birth year as "Born 1980" or "1980".
    if (!trimmedBirthYear) return null;
    const lower = trimmedBirthYear.toLowerCase();
    if (lower.startsWith("b.")) {
      return trimmedBirthYear.replace(/^b\./i, "B.");
    }
    if (lower.startsWith("born")) {
      return `Born ${trimmedBirthYear.slice(4).trimStart()}`;
    }
    return `B. ${trimmedBirthYear}`;
  })();

  // Preserve the uploaded artwork aspect ratio when available.
  const aspectRatio =
    cover?.width && cover?.height
      ? `${cover.width}/${cover.height}`
      : undefined;

  return (
    // Background tone and padding mirror other hero bands across the site.
    <section className="relative border-b border-[var(--colors-grey-dark,#e0e0e0)] bg-[var(--colors-grey-default,#f6f6f5)] py-10 sm:py-16 lg:py-20">
      {/* Grid: single column until `lg`, then image/text columns. */}
      <Container className="grid items-center gap-y-6 py-0 sm:gap-y-10 lg:grid-cols-2 lg:gap-x-20 lg:justify-items-center xl:gap-x-24">
        {cover?.url ? (
          // Portrait block. Constrains max width on smaller breakpoints so the
          // image doesn't overwhelm the viewport, but allows full bleed at `lg+`.
          <figure className="relative flex w-full max-w-[360px] flex-col items-center self-center pt-1 pb-6 text-center sm:max-w-[460px] sm:pt-0 sm:pb-0 md:max-w-[560px] justify-self-center lg:max-w-none lg:order-2 lg:justify-self-end lg:my-auto">
            <div
              className="relative w-full xl:max-h-[50vh] xl:overflow-hidden"
              style={{ aspectRatio: aspectRatio ?? "4 / 5" }}
            >
              <Image
                src={cover.url}
                alt={cover.alt || `${displayName} — artwork`}
                fill
                sizes="(max-width: 1024px) 90vw, (max-width: 1440px) 42vw, 38vw"
                className="h-full w-full object-contain object-center"
                priority
              />
            </div>
            {cover.alt ? (
              <figcaption
                className={`${EXHIBITION_LABEL_BASE_CLASS} mt-6 text-center text-black`}
              >
                {cover.alt}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {/* Text column: artist name, nationality and birth info. */}
        <div className="flex w-full flex-col items-center lg:order-1 lg:justify-self-start lg:my-auto">
          <div className="mx-auto max-w-2xl text-center">
            {/* Responsive type scale to balance against the portrait sizing. */}
            <h1 className="text-[2.15rem] font-normal tracking-tight text-black sm:text-[2.55rem] md:text-[2.9rem] lg:text-[3.1rem] xl:text-[3.6rem]">
              {displayName}
            </h1>
            {nationalityLine || birthLine ? (
              <div className="mt-4 space-y-1 pb-8 text-black sm:space-y-1.5 lg:pb-0">
                {nationalityLine ? (
                  <p className="text-sm font-normal sm:text-base lg:text-lg">
                    {nationalityLine}
                  </p>
                ) : null}
                {birthLine ? (
                  <p className="text-sm font-semibold sm:text-lg lg:text-xl">
                    {birthLine}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
