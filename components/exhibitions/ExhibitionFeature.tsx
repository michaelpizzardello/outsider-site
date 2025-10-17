// components/exhibitions/ExhibitionFeature.tsx
import Image from "next/image";
import Link from "next/link";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import { formatDates } from "@/lib/formatDates";
import { headingParts, type ExhibitionCard } from "@/lib/exhibitions";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

type Props = {
  ex: ExhibitionCard;
  label: string;
  ctaText: string;
  className?: string;
  headingLevel?: keyof JSX.IntrinsicElements;
};

export default function ExhibitionFeature({
  ex,
  label,
  ctaText,
  className = "",
  headingLevel = "h2",
}: Props) {
  const { primary, secondary, isGroup } = headingParts({
    title: ex.title,
    artist: ex.artist,
    isGroup: ex.isGroup,
    variant: ex.variant,
  });

  const HeadingTag = headingLevel;

  const hasDates = Boolean(ex.start || ex.end);

  return (
    <article className={className}>
      <div className="grid items-start grid-cols-1 lg:grid-cols-12 lg:gap-12 xl:gap-14 2xl:gap-16">
        <div className="order-1 lg:order-2 lg:col-span-7 2xl:col-span-7">
          <Link
            href={`/exhibitions/${ex.handle}`}
            className="group relative block w-full overflow-hidden bg-neutral-100"
            aria-label={ex.title}
            title={ex.title}
          >
            <div className="aspect-[16/9]" />
            {ex.hero?.url ? (
              <Image
                src={ex.hero.url}
                alt={ex.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
                No image
              </div>
            )}
          </Link>
        </div>

        <div className="order-2 mt-5 lg:order-1 lg:col-span-5 2xl:col-span-5 lg:mt-0">
          <ExhibitionLabel as="p">{label}</ExhibitionLabel>

          <div className="mt-2">
            <HeadingTag
              className={`text-2xl font-medium leading-tight md:text-3xl xl:text-4xl ${
                isGroup ? "italic" : ""
              }`}
            >
              <Link
                href={`/exhibitions/${ex.handle}`}
                className="underline-offset-[6px] hover:underline focus:underline"
              >
                {primary}
              </Link>
            </HeadingTag>

            {secondary ? (
              <div
                className={`mt-0.5 text-lg md:text-xl xl:text-2xl ${
                  !isGroup ? "italic" : ""
                }`}
              >
                {secondary}
              </div>
            ) : null}
          </div>

          <div className="mt-3 space-y-[2px] text-[14px] text-neutral-700 md:text-[16px] xl:text-[17px]">
            <div>{hasDates ? formatDates(ex.start, ex.end) : null}</div>
          </div>

          {ex.summary ? (
            <p className="hidden text-neutral-800 md:mt-5 md:block md:text-[15px] md:leading-7 lg:max-w-prose">
              {ex.summary}
            </p>
          ) : null}

          <ArrowCtaLink
            href={`/exhibitions/${ex.handle}`}
            label={ctaText}
            className="mt-7 md:mt-8"
            aria-label={`${ctaText}: ${ex.artist ? `${ex.artist} — ` : ""}${ex.title}`}
            underline={false}
          />
        </div>
      </div>
    </article>
  );
}
