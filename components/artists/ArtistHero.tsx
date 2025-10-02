
// components/artists/ArtistHero.tsx
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
  const displayName = name.trim();
  const trimmedNationality = nationality?.trim();
  const trimmedBirthYear = birthYear?.trim();

  const nationalityLine = trimmedNationality ?? null;
  const birthLine = (() => {
    if (!trimmedBirthYear) return null;
    const lower = trimmedBirthYear.toLowerCase();
    return lower.startsWith("b.") || lower.includes("born")
      ? trimmedBirthYear
      : `b. ${trimmedBirthYear}`;
  })();

  const aspectRatio =
    cover?.width && cover?.height ? `${cover.width}/${cover.height}` : undefined;

  return (
    <section className="relative border-b border-[var(--colors-grey-dark,#e0e0e0)] bg-[var(--colors-grey-default,#f6f6f5)]">
      <Container className="grid items-center gap-y-12 py-24 sm:py-32 lg:grid-cols-2 lg:gap-x-20 lg:justify-items-center xl:gap-x-24">
        <div className="flex w-full flex-col items-center">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-light tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              {displayName}
            </h1>
            {(nationalityLine || birthLine) ? (
              <div className="mt-4 space-y-2 text-base text-neutral-600 sm:text-lg">
                {nationalityLine ? <p>{nationalityLine}</p> : null}
                {birthLine ? <p>{birthLine}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        {cover?.url ? (
          <figure className="relative flex w-full max-w-[560px] flex-col items-center self-center overflow-hidden text-center sm:max-w-none lg:max-h-[560px]">
            <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center overflow-hidden border border-[var(--colors-grey-dark,#e0e0e0)] bg-white sm:max-w-none lg:max-h-[560px]">
              <div
                className="relative w-full overflow-hidden lg:max-h-[560px]"
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
            </div>
            {cover.alt ? (
              <figcaption
                className={`${EXHIBITION_LABEL_BASE_CLASS} mt-6 text-center text-neutral-500`}
              >
                {cover.alt}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </Container>
    </section>
  );
}
