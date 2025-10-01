// components/exhibitions/CurrentExhibitionHero.tsx
import Image from "next/image";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import { formatDates } from "@/lib/formatDates";
import { ExhibitionCard, headingParts } from "@/lib/exhibitions";
import { HERO_LABELS } from "@/lib/labels";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

export default function CurrentExhibitionHero({
  ex,
  topLabel = HERO_LABELS.top,
  buttonLabel = HERO_LABELS.button,
  showCta = true,
}: {
  ex: ExhibitionCard | null;
  topLabel?: string;
  buttonLabel?: string;
  showCta?: boolean;
}) {
  const bannerImage = ex?.banner ?? ex?.hero;
  const imgSrc = bannerImage?.url ?? "";
  const title = ex?.title ?? "";
  const artist = ex?.artist?.trim() ?? "";
  const imgAlt = bannerImage?.alt ?? ex?.hero?.alt ?? (title || "Exhibition");

  const dateText = formatDates(ex?.start, ex?.end) || "Details to be announced";

  const { primary, secondary, isGroup } = headingParts({
    title,
    artist,
    isGroup: ex?.isGroup,
    variant: ex?.variant,
  });

  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-hidden">
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-100" />
      )}

      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="absolute inset-0 grid place-items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="z-10 max-w-[80ch] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,.45)]">
          <ExhibitionLabel
            as="p"
            className="mb-6 md:text-[1rem] lg:text-[1.15rem] opacity-80 text-white"
          >
            {topLabel}
          </ExhibitionLabel>

          {/* Artist name/ Header 1 */}
          <h1
            className={["text-display-1", isGroup ? "italic" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {primary}
          </h1>

          {/* Exhibition Title, H2 */}
          {secondary ? (
            <h2
              className={[
                "mt-3 text-display-2 text-white/90",
                !isGroup ? "italic" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {secondary}
            </h2>
          ) : null}

          {/* Dates + location */}
          <p className="mt-10 text-display-3 opacity-90 ">{dateText}</p>

          {/* Call to action button */}
          {showCta ? (
            <ArrowCtaLink
              href={ex ? `/exhibitions/${ex.handle}` : "/exhibitions"}
              label={buttonLabel}
              align="center"
              className="mt-12 hover:opacity-85"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
