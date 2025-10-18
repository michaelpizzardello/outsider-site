import Link from "next/link";

import Container from "@/components/layout/Container";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import { formatDates } from "@/lib/formatDates";
import ExpandableText from "./ExpandableText";

type Dateish = Date | string | null | undefined;

type ArtistLink = {
  name: string;
  href?: string;
  represented?: boolean;
};

type Props = {
  id?: string;
  startDate?: Dateish;
  endDate?: Dateish;
  location?: string | null;
  openingInfo?: string | null;
  shortText?: string | null;
  longTextHtml?: string | null; // HTML string
  artists?: ArtistLink[] | null;
};

export default function Details({
  id,
  startDate,
  endDate,
  location,
  openingInfo,
  shortText,
  longTextHtml,
  artists,
}: Props) {
  const dateRange = formatDates(startDate, endDate);
  const artistList = (artists ?? []).filter((artist) => artist.name?.trim());
  const hasArtists = artistList.length > 0;
  const hasMeta = Boolean(
    startDate ||
      endDate ||
      (location && location.trim()) ||
      (openingInfo && openingInfo.trim()) ||
      hasArtists
  );
  const hasText = Boolean(
    (shortText && shortText.trim()) || (longTextHtml && longTextHtml.trim())
  );
  if (!hasMeta && !hasText) return null;

  return (
    <section
      id={id}
      className="py-12 md:py-16"
      style={{ scrollMarginTop: "var(--header-tight-h, 64px)" }}
    >
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
            space-y-8 text-sm leading-relaxed
          "
          >
            {(startDate || endDate) && (
              <div>
                <ExhibitionLabel as="div" className="mb-[2px]">
                  Dates
                </ExhibitionLabel>
                <div className="text-[1rem]">{dateRange}</div>
              </div>
            )}

            {openingInfo && openingInfo.trim() && (
              <div>
                <ExhibitionLabel as="div" className="mb-[2px]">
                  Opening Reception
                </ExhibitionLabel>
                <div className="text-[1rem] whitespace-pre-wrap">{openingInfo}</div>
              </div>
            )}

            {location && location.trim() && (
              <div>
                <ExhibitionLabel as="div" className="mb-[2px]">
                  Location
                </ExhibitionLabel>
                <div className="text-[1rem] whitespace-pre-wrap">{location}</div>
              </div>
            )}

            {hasArtists && (
              <div>
                <ExhibitionLabel as="div" className="mb-[2px]">
                  Artists
                </ExhibitionLabel>
                <ul className="space-y-1 text-[1rem]">
                  {artistList.map((artist) => {
                    const key = artist.href ?? artist.name;
                    if (!artist.name?.trim()) return null;
                    const canLink =
                      Boolean(artist.href) && artist.represented === true;
                    return (
                      <li key={key}>
                        {canLink ? (
                          <Link
                            href={artist.href}
                            className="underline-offset-2 transition hover:underline"
                          >
                            {artist.name}
                          </Link>
                        ) : (
                          <span>{artist.name}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>

          {/* BODY */}
          {hasText && (
            <div
              className="
              col-span-full
              mt-6
              md:col-span-1 md:col-start-2 md:mt-0 md:justify-self-center
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
