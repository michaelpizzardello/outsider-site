// lib/pickHero.ts
import type { ExhibitionCard } from "@/lib/exhibitions";

export type HeroSelection = {
  hero: ExhibitionCard | null;
  heroLabel: "CURRENT EXHIBITION" | "UPCOMING EXHIBITION" | "PAST EXHIBITION" | null;
  upcomingAfterHero: ExhibitionCard[];
  pastAfterHero: ExhibitionCard[];
};

export function pickHero({
  current,
  upcoming,
  past,
}: {
  current: ExhibitionCard[];
  upcoming: ExhibitionCard[];
  past: ExhibitionCard[];
}): HeroSelection {
  if (current.length) {
    return {
      hero: current[0],
      heroLabel: "CURRENT EXHIBITION",
      upcomingAfterHero: upcoming,
      pastAfterHero: past,
    };
  }

  if (upcoming.length) {
    const [first, ...rest] = upcoming;
    return {
      hero: first,
      heroLabel: "UPCOMING EXHIBITION",
      upcomingAfterHero: rest,
      pastAfterHero: past,
    };
  }

  if (past.length) {
    const [first, ...rest] = past;
    return {
      hero: first,
      heroLabel: "PAST EXHIBITION",
      upcomingAfterHero: [],
      pastAfterHero: rest,
    };
  }

  return { hero: null, heroLabel: null, upcomingAfterHero: [], pastAfterHero: [] };
}
