// lib/labels.ts
// Central place for text strings used across components

// Default export for small uppercase list captions (keeps Existing imports: `import labels from "@/lib/labels"`)
const labels = {
  galleryExhibition: "GALLERY EXHIBITION",
  currentExhibition: "CURRENT EXHIBITION",
  upcomingExhibition: "UPCOMING EXHIBITION",
  pastExhibition: "PAST EXHIBITION",
} as const;
export type LabelKey = keyof typeof labels;
export default labels;

// Legacy/fallback hero copy (keeps Existing imports: `import { HERO_LABELS } from "@/lib/labels"`)
export const HERO_LABELS = {
  top: "Exhibition",
  button: "View Exhibition",
} as const;

// Optional: dynamic hero copy based on pickHero’s label
export type PickHeroLabel =
  | "CURRENT EXHIBITION"
  | "UPCOMING EXHIBITION"
  | "PAST EXHIBITION"
  | null;

export function heroLabels(label: PickHeroLabel) {
  switch (label) {
    case "CURRENT EXHIBITION":
      return { top: "Current exhibition", button: "View Exhibition" };
    case "UPCOMING EXHIBITION":
      return { top: "Upcoming exhibition", button: "View details" };
    case "PAST EXHIBITION":
      return { top: "Past exhibition", button: "View Exhibition" };
    default:
      return HERO_LABELS; // fallback
  }
}
