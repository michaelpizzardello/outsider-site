// app/page.tsx
import Header from "@/components/Header";
import CurrentExhibitionHero from "@/components/CurrentExhibitionHero";
import UpcomingExhibitions from "@/components/UpcomingExhibitions";
import SiteFooter from "@/components/SiteFooter";
// If you added the banner component, uncomment these lines:
// import HolidayBanner from "@/components/HolidayBanner";

import { classifyExhibitions, fetchHomeExhibitions, type ExhibitionCard } from "@/lib/exhibitions";
import { pickHero } from "@/lib/pickHero";

export const revalidate = 60;

export default async function HomePage() {
  // 1) Fetch exhibitions (server-side)
  const nodes = await fetchHomeExhibitions();

  // 2) Classify into current / upcoming / past
  // Make sure classifyExhibitions returns { current: ExhibitionCard|null, upcoming: ExhibitionCard[], past: ExhibitionCard[] }
  const { current, upcoming, past }: {
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

  // 4) Button/label copy (small tweak: Upcoming hero uses “View details”)
  const topLabel = heroLabel || "EXHIBITION";
  const buttonLabel =
    heroLabel === "UPCOMING EXHIBITION" ? "View details" : "View exhibition";

  return (
    <main className="bg-white text-neutral-900">
      {/* Optional site-wide banner. Uncomment if you created HolidayBanner.tsx
      <HolidayBanner
        show={process.env.NEXT_PUBLIC_BANNER_ENABLED === "true"}
        message={process.env.NEXT_PUBLIC_BANNER_MESSAGE || "Closed for installation. Reopening soon."}
      />
      */}

      <div className="relative">
        {/* Header sits on top of hero */}
        <Header />

        {/* Hero (Current → Upcoming → Past) */}
        {hero ? (
          <CurrentExhibitionHero
            ex={hero}
            topLabel={topLabel}
            buttonLabel={buttonLabel}
          />
        ) : (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 text-center text-neutral-500">
            No exhibitions to display. Please check back soon.
          </section>
        )}
      </div>

      {/* After hero: show ONE list only */}
{upcomingAfterHero.length > 0 ? (
  <UpcomingExhibitions items={upcomingAfterHero} title="Upcoming" />
) : pastAfterHero.length > 0 ? (
  <UpcomingExhibitions items={pastAfterHero} title="Past Exhibitions" />
) : null}


      <SiteFooter />
    </main>
  );
}
