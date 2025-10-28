// lib/exhibitionsShared.ts
// Shared exhibition helpers that are safe for both server and client modules.

export type ExhibitionCard = {
  handle: string;
  title: string;
  artist?: string;
  location?: string;
  openingInfo?: string;
  start?: Date;
  end?: Date;
  hero?: { url: string; width?: number; height?: number; alt?: string };
  banner?: { url: string; width?: number; height?: number; alt?: string };
  summary?: string;
  isGroup?: boolean;
  variant?: string;
  status?: string | null;
};

export function isGroupShow(
  ex: Pick<ExhibitionCard, "artist" | "isGroup" | "variant">
): boolean {
  if (ex?.isGroup === true) return true;

  const variant = ex?.variant?.trim().toLowerCase();
  if (variant && (variant.includes("group") || variant.includes("collective"))) {
    return true;
  }

  const artistValue = (ex?.artist ?? "").trim().toLowerCase();
  if (!artistValue) return false;

  const simpleMatches = [
    "group exhibition",
    "group show",
    "group",
    "various artists",
    "multiple artists",
  ];
  if (simpleMatches.includes(artistValue)) return true;

  if (
    artistValue.includes("group exhibition") ||
    artistValue.includes("group show")
  )
    return true;

  const multiArtistSeparators = [", ", " & ", " and ", " / ", "+", "/"];
  if (
    multiArtistSeparators.some((sep) => {
      if (!artistValue.includes(sep)) return false;
      const parts = artistValue.split(sep).map((part) => part.trim());
      return parts.filter(Boolean).length >= 2;
    })
  )
    return true;

  return false;
}

export function headingParts(
  ex: Pick<ExhibitionCard, "title" | "artist" | "isGroup" | "variant">
): { primary: string; secondary?: string; isGroup: boolean } {
  const group = isGroupShow(ex);
  const primary = group ? (ex.title || ex.artist || "") : (ex.artist || ex.title || "");
  const secondary = group ? ex.artist : ex.title;
  return { primary, secondary, isGroup: group };
}
