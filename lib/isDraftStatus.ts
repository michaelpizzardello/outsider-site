const BLOCKED_STATUSES = new Set([
  "draft",
  "inactive",
  "hidden",
  "internal",
  "unpublished",
  "preview",
  "archived",
]);

/** Returns true when a status-like value represents a non-public item. */
export function isDraftStatus(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const status = value.trim().toLowerCase();
  if (!status) return false;
  if (BLOCKED_STATUSES.has(status)) return true;
  if (status.startsWith("draft")) return true;
  return false;
}

