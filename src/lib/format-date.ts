// Dates and numbers in the user's locale and time zone (CONVENTIONS §9).

export function formatDateTime(iso: string, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

/** Wall-clock time with seconds, for event timestamps (rendered in monospace). */
export function formatTime(iso: string, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso));
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

/** "3 min ago", "now". Only for the event timeline. */
export function formatRelative(iso: string, now: Date = new Date(), locale?: string): string {
  const diff = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size || unit === "second")
      return rtf.format(Math.trunc(diff / size), unit);
  }
  return rtf.format(0, "second");
}

export function formatScore(score: number | null | undefined, locale?: string): string {
  if (score === null || score === undefined) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(score);
}
