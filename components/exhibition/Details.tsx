import { formatDates } from "@/lib/formatDates";
import ShareButton from "./ShareButton";
import ExpandableText from "./ExpandableText";

type Dateish = Date | string | null | undefined;

type Props = {
  startDate?: Dateish;
  endDate?: Dateish;
  location?: string | null;
  longTextHtml?: string | null; // HTML string
  shareUrl?: string;
};

export default function Details({
  startDate,
  endDate,
  location,
  longTextHtml,
  shareUrl,
}: Props) {
  const dateRange = formatDates(startDate, endDate);
  const hasMeta = Boolean(
    startDate || endDate || (location && location.trim())
  );
  const hasText = Boolean(longTextHtml && longTextHtml.trim());
  if (!hasMeta && !hasText) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24 py-12 md:py-16">
      {/* Section header to match Featured Works positioning */}
      {hasText && (
        <div className="grid grid-cols-1 md:[grid-template-columns:repeat(12,minmax(0,1fr))] xl:[grid-template-columns:repeat(24,minmax(0,1fr))] md:gap-x-14 xl:gap-x-8">
          <div className="col-span-full md:[grid-column:1/span_3] xl:[grid-column:1/span_5] text-[11px] uppercase tracking-[0.18em] opacity-60">
            About the exhibition
          </div>
        </div>
      )}
      {/* 1 col on mobile → fixed left rail + fluid body at md+ */}
      <div
        className="
          grid grid-cols-1 gap-y-10
          md:[grid-template-columns:minmax(220px,max-content)_minmax(0,0.85fr)]
          md:gap-x-[clamp(15px,2vw,20px)]
        "
      >
        {/* LEFT RAIL */}
        <aside
          className="
            col-span-full
            md:col-span-1 md:col-start-1
            space-y-6 text-sm
          "
        >
          {(startDate || endDate) && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
                Dates
              </div>
              <div className="mt-1">{dateRange}</div>
            </div>
          )}

          {location && location.trim() && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
                Location
              </div>
              <div className="mt-1 whitespace-pre-wrap">{location}</div>
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
              Share
            </div>
            <div className="mt-1">
              <ShareButton url={shareUrl} />
            </div>
          </div>
        </aside>

        {/* BODY */}
        {hasText && (
          <div
            className="
              col-span-full
              md:col-span-1 md:col-start-2 md:justify-self-center
            "
          >
            {/* Keep a steady reading measure; only shrink when forced by viewport */}
            <div className="max-w-[60ch] w-full md:mx-auto">
              <ExpandableText html={longTextHtml!} clampLines={12} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
