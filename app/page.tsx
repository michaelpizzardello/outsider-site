// app/page.tsx
import "server-only";

import CurrentExhibitionHero from "@/components/CurrentExhibitionHero";
import UpcomingShows from "@/components/UpcomingShows";
// import HolidayBanner from "@/components/HolidayBanner";

import {
  classifyExhibitions,
  fetchHomeExhibitions,
  type ExhibitionCard,
} from "@/lib/exhibitions";
import { pickHero } from "@/lib/pickHero";
import { heroLabels } from "@/lib/labels";

export const revalidate = 60;

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

  // 4) Hero copy from central labels helper (only if we have a hero)
  const { top, button } = hero
    ? heroLabels(heroLabel)
    : { top: "", button: "" };

  return (
    <main>
      {/* Optional site-wide banner
      <HolidayBanner
        show={process.env.NEXT_PUBLIC_BANNER_ENABLED === "true"}
        message={
          process.env.NEXT_PUBLIC_BANNER_MESSAGE ||
          "Closed for installation. Reopening soon."
        }
      />
      */}

      {/* FIRST BLOCK — no extra top padding; Header uses overlay in app/layout.tsx */}
      {hero ? (
        <CurrentExhibitionHero ex={hero} topLabel={top} buttonLabel={button} />
      ) : (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 text-center text-neutral-500">
          No exhibitions to display. Please check back soon.
        </section>
      )}

      {/* After hero: show ONE list only */}
      {upcomingAfterHero.length > 0 ? (
        <UpcomingShows
          items={upcomingAfterHero}
          labelKey="upcomingExhibition"
        />
      ) : pastAfterHero.length > 0 ? (
        <UpcomingShows items={pastAfterHero} labelKey="pastExhibition" />
      ) : null}
    </main>
  );
}
