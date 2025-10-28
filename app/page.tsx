// app/page.tsx
import "server-only";
import type { Metadata } from "next";

import CurrentExhibitionHero from "@/components/exhibitions/CurrentExhibitionHero";
import UpcomingShows from "@/components/exhibitions/UpcomingShows";
import Container from "@/components/layout/Container";
// import HolidayBanner from "@/components/HolidayBanner";

import {
  classifyExhibitions,
  fetchHomeExhibitions,
  type ExhibitionCard,
} from "@/lib/exhibitions";
import { pickHero } from "@/lib/pickHero";
import { heroLabels } from "@/lib/labels";
import { siteConfig } from "@/lib/siteConfig";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Outsider Gallery | Contemporary Art Gallery in Sydney | Surry Hills",
  description: siteConfig.description,
  openGraph: {
    title: "Outsider Gallery | Contemporary Art Gallery in Sydney | Surry Hills",
    description: siteConfig.description,
    url: siteConfig.siteUrl,
  },
  twitter: {
    title: "Outsider Gallery | Contemporary Art Gallery in Sydney | Surry Hills",
    description: siteConfig.description,
  },
};

export default async function HomePage() {
  // 1) Fetch exhibitions (server-side)
  const nodes = await fetchHomeExhibitions();

  // 2) Classify into current / upcoming / past
  const {
    current,
    upcoming,
    past,
  }: {
    current: ExhibitionCard | null;
    upcoming: ExhibitionCard[];
    past: ExhibitionCard[];
  } = classifyExhibitions(nodes);

  // 3) Pick the hero and leftover lists
  const { hero, heroLabel, upcomingAfterHero, pastAfterHero } = pickHero({
    current: current ? [current] : [],
    upcoming,
    past,
  });

  // 4) Hero copy from central labels helper
  const { top, button } = heroLabels(heroLabel);

  const hasFollowupSection =
    upcomingAfterHero.length > 0 || pastAfterHero.length > 0;
  const nextSectionId = hasFollowupSection ? "home-next-section" : undefined;

  return (
    <main className="bg-white text-neutral-900">
      {/* Optional site-wide banner
      <HolidayBanner
        show={process.env.NEXT_PUBLIC_BANNER_ENABLED === "true"}
        message={
          process.env.NEXT_PUBLIC_BANNER_MESSAGE ||
          "Closed for installation. Reopening soon."
        }
      />
      */}

      <div className="relative">
        {/* Hero (Current → Upcoming → Past) */}
        {hero ? (
          <CurrentExhibitionHero
            ex={hero}
            topLabel={top}
            buttonLabel={button}
            scrollTargetId={nextSectionId}
          />
        ) : (
          <section className="py-14 text-center text-neutral-500">
            <Container>
              No exhibitions to display. Please check back soon.
            </Container>
          </section>
        )}
      </div>

      {/* After hero: show ONE list only */}
      {upcomingAfterHero.length > 0 ? (
        <UpcomingShows
          id={nextSectionId}
          items={upcomingAfterHero}
          labelKey="upcomingExhibition"
        />
      ) : pastAfterHero.length > 0 ? (
        <UpcomingShows
          id={nextSectionId}
          items={pastAfterHero}
          labelKey="pastExhibition"
        />
      ) : null}
    </main>
  );
}
