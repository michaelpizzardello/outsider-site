// components/exhibitions/UpcomingShows.tsx
import Container from "@/components/layout/Container";
import labels, { type LabelKey } from "@/lib/labels";
import { type ExhibitionCard } from "@/lib/exhibitions";
import ExhibitionFeatureWhiteCube from "@/components/exhibitions/ExhibitionFeatureWhiteCube";

type Props = {
  items: ExhibitionCard[];
  labelKey?: LabelKey;
  ctaText?: string;
  className?: string;
  id?: string;
};

export default function UpcomingShows({
  items,
  labelKey = "galleryExhibition",
  ctaText = "Visit Exhibition",
  className = "",
  id,
}: Props) {
  if (!items?.length) return null;

  const sectionStyle = id ? { scrollMarginTop: "var(--header-tight-h, 64px)" } : undefined;

  return (
    <section id={id} className={className} style={sectionStyle}>
      <Container>
        <div className="flex flex-col divide-y divide-neutral-200">
          {items.map((ex) => (
            <div key={ex.handle} className="py-10 md:py-16">
              <ExhibitionFeatureWhiteCube
                ex={ex}
                label={labels[labelKey]}
                ctaText={ctaText}
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
