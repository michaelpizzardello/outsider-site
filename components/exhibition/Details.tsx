import Container from "@/components/layout/Container";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import { formatDates } from "@/lib/formatDates";
import ShareButton from "./ShareButton";
import ExpandableText from "./ExpandableText";

type Dateish = Date | string | null | undefined;

type Props = {
  startDate?: Dateish;
  endDate?: Dateish;
  location?: string | null;
  shortText?: string | null;
  longTextHtml?: string | null; // HTML string
  shareUrl?: string;
};

export default function Details({
  startDate,
  endDate,
  location,
  shortText,
  longTextHtml,
  shareUrl,
}: Props) {
  const dateRange = formatDates(startDate, endDate);
  const hasMeta = Boolean(
    startDate || endDate || (location && location.trim())
  );
  const hasText = Boolean(
    (shortText && shortText.trim()) || (longTextHtml && longTextHtml.trim())
  );
  if (!hasMeta && !hasText) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        {/* 1 col on mobile → fixed left rail + fluid body at md+ */}
        <div
          className="
          grid grid-cols-1 gap-y-10
          md:[grid-template-columns:minmax(240px,max-content)_minmax(0,0.78fr)]
          md:gap-x-[clamp(32px,4vw,48px)]
        "
        >
          {/* LEFT RAIL */}
          <aside
            className="
            col-span-full
            md:col-span-1 md:col-start-1
            space-y-6 text-sm leading-relaxed
          "
          >
            {(startDate || endDate) && (
              <div>
                <ExhibitionLabel as="div">
                  Dates
                </ExhibitionLabel>
                <div className="text-[1rem]">{dateRange}</div>
              </div>
            )}

            {location && location.trim() && (
              <div>
                <ExhibitionLabel as="div">
                  Location
                </ExhibitionLabel>
                <div className="whitespace-pre-wrap">{location}</div>
              </div>
            )}

            <div>
              <ExhibitionLabel as="div">
                Share
              </ExhibitionLabel>
              <div>
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
              <div className="max-w-[68ch] w-full md:ml-auto md:mr-0">
                <ExpandableText
                  shortText={shortText}
                  longTextHtml={longTextHtml}
                  clampLines={12}
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
