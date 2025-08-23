// lib/formatDates.ts
type Dateish = Date | string | null | undefined;

const MONTH = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function toParts(v: Dateish) {
  if (!v) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return { y: v.getFullYear(), m: v.getMonth() + 1, d: v.getDate() };
  }
  if (typeof v === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
    if (m) return { y: +m[1], m: +m[2], d: +m[3] };
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return null;
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
  }
  return null;
}

export function formatDates(start?: Dateish, end?: Dateish): string {
  if (!start && !end) return "";

  const s = toParts(start);
  const e = toParts(end);

  if (s && e) {
    // same day
    if (s.y === e.y && s.m === e.m && s.d === e.d) {
      return `${s.d} ${MONTH[s.m]} ${s.y}`;
    }
    // same year
    if (s.y === e.y) {
      return s.m === e.m
        ? `${s.d} – ${e.d} ${MONTH[s.m]} ${s.y}`
        : `${s.d} ${MONTH[s.m]} – ${e.d} ${MONTH[e.m]} ${s.y}`;
    }
    // different years
    return `${s.d} ${MONTH[s.m]} ${s.y} – ${e.d} ${MONTH[e.m]} ${e.y}`;
  }

  const one = s ?? e!;
  return `${one.d} ${MONTH[one.m]} ${one.y}`;
}
