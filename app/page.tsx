// app/page.tsx
import Header from "@/components/Header";
import CurrentExhibitionHero from "@/components/CurrentExhibitionHero";
import UpcomingExhibitions from "@/components/UpcomingExhibitions";
import SiteFooter from "@/components/SiteFooter";
import { classifyExhibitions, fetchHomeExhibitions } from "@/lib/exhibitions";

export const revalidate = 60;

export default async function HomePage() {
  const nodes = await fetchHomeExhibitions();     // server-side fetch
  const { current, upcoming } = classifyExhibitions(nodes);

  return (
    <main className="bg-white text-neutral-900">
      <div className="relative">
        {/* Header sits on top of hero */}
        <Header />
        <CurrentExhibitionHero ex={current} />
      </div>

      <UpcomingExhibitions items={upcoming} />

      <SiteFooter />
    </main>
  );
}
