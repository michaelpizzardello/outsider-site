// ===============================
// components/cards/ExhibitionCardText.tsx
// Text block extracted from page file
// ===============================
import {
  type ExhibitionCard,
  headingParts,
  formatDates,
} from "@/lib/exhibitions";

export default function ExhibitionCardText({
  ex,
  topLabel,
  buttonLabel,
}: {
  ex: ExhibitionCard;
  topLabel: string;
  buttonLabel: string;
}) {
  const { primary, secondary } = headingParts({
    title: ex.title,
    artist: ex.artist,
    isGroup: ex.isGroup,
  });
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-widest text-neutral-500">
        {topLabel}
      </p>
      <h3 className="mt-2 text-base font-medium leading-snug">
        <span className="block">{primary}</span>
        {secondary && (
          <span className="block text-neutral-500">{secondary}</span>
        )}
      </h3>
      <p className="mt-2 text-sm text-neutral-600">
        {ex.start ? formatDates(ex.start, ex.end) : ex.summary ?? ""}
      </p>
      {ex.location && <p className="text-sm text-neutral-500">{ex.location}</p>}
      <p className="mt-4 inline-flex items-center text-sm">
        <span className="mr-2">→</span>
        <span className="underline-offset-4 hover:underline">
          {buttonLabel}
        </span>
      </p>
    </div>
  );
}
