// ===============================
// components/cards/ExhibitionCard.tsx
// Single card (image + text)
// ===============================
import Link from "next/link";
import Image from "next/image";
import { type ExhibitionCard } from "@/lib/exhibitions";
import CardText from "@/components/cards/ExhibitionCardText";
import { heroLabels, type PickHeroLabel } from "@/lib/labels";

export default function ExhibitionCard({
  ex,
  kind,
}: {
  ex: ExhibitionCard;
  kind: "current" | "upcoming" | "past";
}) {
  const labelKey = (
    kind === "current"
      ? "CURRENT EXHIBITION"
      : kind === "upcoming"
      ? "UPCOMING EXHIBITION"
      : "PAST EXHIBITION"
  ) as PickHeroLabel;
  const { top, button } = heroLabels(labelKey);
  return (
    <article className="group">
      <Link href={`/exhibitions/${ex.handle}`} className="block">
        {ex.hero?.url && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={ex.hero.url}
              alt={ex.hero.alt ?? ex.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <CardText ex={ex} topLabel={top} buttonLabel={button} />
      </Link>
    </article>
  );
}
