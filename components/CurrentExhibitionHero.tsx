// components/CurrentExhibitionHero.tsx
import Image from "next/image";
import Link from "next/link";
import { formatDates } from "@/lib/formatDates";
import { ExhibitionCard, headingParts } from "@/lib/exhibitions";
import { HERO_LABELS } from "@/lib/labels";

export default function CurrentExhibitionHero({
  ex,
  topLabel = HERO_LABELS.top,
  buttonLabel = HERO_LABELS.button,
}: {
  ex: ExhibitionCard | null;
  topLabel?: string;
  buttonLabel?: string;
}) {
  const imgSrc = ex?.hero?.url ?? "";
  const title = ex?.title ?? "";
  const artist = ex?.artist?.trim() ?? "";

  const dateText =
    [formatDates(ex?.start, ex?.end), ex?.location]
      .filter(Boolean)
      .join(" · ") || "Details to be announced";

  const { primary, secondary, isGroup } = headingParts({
    title,
    artist,
    isGroup: ex?.isGroup,
  });

  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-hidden">
      {/* Background image */}
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={title || "Exhibition"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-100" />
      )}

      {/* Legibility scrim */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Content */}
      <div className="absolute inset-0 grid place-items-center px-4 text-center">
        <div className="z-10 max-w-[80ch] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,.45)]">
          <p className="mb-3 text-[11px] md:text-[12px] tracking-[.28em] uppercase opacity-80">
            {topLabel}
          </p>

          <h1
            className={`text-[40px] leading-[1.08] md:text-7xl md:leading-[1.06] font-medium ${
              isGroup ? "italic" : ""
            }`}
          >
            {primary}
          </h1>

          {secondary ? (
            <p
              className={`mt-3 text-[20px] md:text-[24px] opacity-95 ${
                !isGroup ? "italic" : ""
              }`}
            >
              {secondary}
            </p>
          ) : null}

          <p className="mt-5 text-[15px] md:text-[17px] opacity-90">
            {dateText}
          </p>

          <Link
            href={ex ? `/exhibitions/${ex.handle}` : "/exhibitions"}
            className="mt-7 inline-flex items-center justify-center text-[15px] md:text-[16px] font-medium underline decoration-1 underline-offset-[6px] hover:opacity-85"
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
