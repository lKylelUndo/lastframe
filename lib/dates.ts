import { formatInTimeZone } from "date-fns-tz";

const MANILA_TZ = "Asia/Manila";
const MANILA_OFFSET = "+08:00";

/**
 * Given a date string in YYYY-MM-DD, return the start and end of that
 * calendar day in the Asia/Manila timezone as ISO strings.
 */
export function manilaDayRange(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T00:00:00${MANILA_OFFSET}`);
  const end = new Date(`${dateStr}T23:59:59${MANILA_OFFSET}`);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Returns today's date in Manila as a YYYY-M-D string (no leading zeros).
 */
export function todayManilaYMD(): string {
  return formatInTimeZone(new Date(), MANILA_TZ, "yyyy-M-d");
}

/**
 * Format a Date (or ISO string) in the Asia/Manila timezone.
 * Default format: "yyyy-MM-dd HH:mm:ss"
 */
export function formatManila(
  date: Date | string,
  fmt: string = "yyyy-MM-dd HH:mm:ss",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, MANILA_TZ, fmt);
}
