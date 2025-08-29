// ===============================
// components/blocks/ExhibitionSection.tsx
// Renders section title, divider, and a grid of cards
// ===============================
import { type ExhibitionCard } from "@/lib/exhibitions";
import ExhibitionCardView from "@/components/cards/ExhibitionCard";

export default function ExhibitionSection({
  label,
  items,
  kind,
}: {
  label: string;
  items: ExhibitionCard[];
  kind: "current" | "upcoming" | "past";
}) {
  return (
    <div>
      <h2 className="text-xl font-medium">{label}</h2>
      <div className="mt-6 border-t border-neutral-200" />
      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        {items.map((ex) => (
          <ExhibitionCardView key={ex.handle} ex={ex} kind={kind} />
        ))}
      </div>
    </div>
  );
}
