// =====================================
// components/blocks/HomeHero.tsx
// Wraps CurrentExhibitionHero + empty state copy
// =====================================
import CurrentExhibitionHero from "@/components/CurrentExhibitionHero";
import { heroLabels } from "@/lib/labels";
import { type ExhibitionCard } from "@/lib/exhibitions";

export default function HomeHero({
  hero,
  heroLabel,
}: {
  hero: ExhibitionCard | null;
  heroLabel: any;
}) {
  if (!hero) {
    return (
      <section className="py-14 text-center text-neutral-500">
        No exhibitions to display. Please check back soon.
      </section>
    );
  }
  const { top, button } = heroLabels(heroLabel);
  return (
    <CurrentExhibitionHero ex={hero} topLabel={top} buttonLabel={button} />
  );
}
