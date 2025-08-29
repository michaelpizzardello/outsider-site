// =====================================
// components/blocks/HomeListSwitch.tsx
// Decides which list to show after hero (upcoming else past)
// =====================================
import UpcomingShows from "@/components/UpcomingShows";
import { type ExhibitionCard } from "@/lib/exhibitions";

export default function HomeListSwitch({
  upcoming,
  past,
}: {
  upcoming: ExhibitionCard[];
  past: ExhibitionCard[];
}) {
  if (upcoming?.length)
    return <UpcomingShows items={upcoming} labelKey="upcomingExhibition" />;
  if (past?.length)
    return <UpcomingShows items={past} labelKey="pastExhibition" />;
  return null;
}
