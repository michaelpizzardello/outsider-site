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
      {/* 1 col → 12 col at md (fix) → 24 col at xl */}
      <div
        className="
          grid grid-cols-1 gap-y-10
          md:[grid-template-columns:repeat(12,minmax(0,1fr))] md:gap-x-14
          xl:[grid-template-columns:repeat(24,minmax(0,1fr))] xl:gap-x-8
        "
      >
        {/* LEFT RAIL */}
        <aside
          className="
            col-span-full
            md:[grid-column:1/span_3]
            xl:[grid-column:1/span_5]
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
              md:[grid-column:4/span_5]   /* two-column starts at md now */
              xl:[grid-column:8/span_10]  /* 24-col placement like White Cube */
              3xl:[grid-column:9/span_9]
            "
          >
            {/* slightly wider measure on mid screens; xl lets span define width */}
            <div className="max-w-[60ch] md:max-w-[59ch] xl:max-w-none">
              <ExpandableText html={longTextHtml!} clampLines={12} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
