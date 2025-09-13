// components/exhibition/Details.tsx
// Purpose: Left rail (Dates / Location / Share) + Right column (essay with Read more)
// Notes:
// - No location in the HERO; location only appears here (per your instruction).
// - Dates are formatted in Australia/Sydney using your helper.
// - Share uses a tiny client button that falls back to copy-to-clipboard.

import { formatDates } from "@/lib/formatDates";
import ShareButton from "./ShareButton";
import ExpandableText from "./ExpandableText";

type Dateish = Date | string | null | undefined;

type Props = {
  startDate?: Dateish;
  endDate?: Dateish;
  location?: string | null;
  longTextHtml?: string | null;
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

  // Hide the whole block if there’s no text and no meta
  const hasMeta = !!(startDate || endDate || location);
  const hasText = !!longTextHtml;

  if (!hasMeta && !hasText) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-12">
        {/* LEFT RAIL: meta */}
        <aside className="md:col-span-4 space-y-6 text-sm">
          {/* Dates */}
          {(startDate || endDate) && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
                Dates
              </div>
              <div className="mt-1">{dateRange}</div>
            </div>
          )}

          {/* Location */}
          {location && location.trim().length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
                Location
              </div>
              <div className="mt-1 whitespace-pre-line">{location}</div>
            </div>
          )}

          {/* Share */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
              Share
            </div>
            <div className="mt-1">
              <ShareButton url={shareUrl} />
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: long text with Read more/less */}
        {hasText ? (
          <div className="md:col-span-8">
            <ExpandableText html={longTextHtml!} clampLines={12} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
