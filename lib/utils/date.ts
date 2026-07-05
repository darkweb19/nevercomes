// Month names are hardcoded (not Intl) so SSR output is identical on every
// machine regardless of ICU version or server locale/timezone.
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const JUST_NOW_MS = 10 * 60_000;

/** "JUST NOW" inside ten minutes, then the receipt-style "MAY 18" (UTC calendar date). */
export function formatShortDate(iso: string, now: number): string {
  const t = Date.parse(iso);
  if (now - t < JUST_NOW_MS) return "JUST NOW";

  const d = new Date(t);
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${MONTHS[d.getUTCMonth()]} ${day}`;
}
