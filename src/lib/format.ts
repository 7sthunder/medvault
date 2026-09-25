/**
 * Phase 08 — pure display formatters for dates, times, percentages and counts.
 *
 * All functions are React-free so they can be unit-tested in Node and reused by
 * server-rendered pages. Date keys are treated as timezone-less `YYYY-MM-DD`;
 * formatting pins them to UTC so output never depends on the host timezone.
 */

import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

function keyDate(dateKey: string): Date {
  return new TZDate(new Date(`${dateKey}T00:00:00.000Z`), "UTC");
}

/** `2026-05-20` → `"May 20, 2026"`. */
export function formatDateKey(dateKey: string, style: "long" | "short" = "long"): string {
  return format(keyDate(dateKey), style === "long" ? "MMM d, yyyy" : "MMM d");
}

/** `2026-05-20` → `"Wed, May 20"` (heading use, e.g. Today's Schedule). */
export function formatDayHeading(dateKey: string): string {
  return format(keyDate(dateKey), "EEE, MMM d");
}

/** `"08:00"` → `"8:00 AM"` (12h) or `"08:00"` (24h, hour12: false). */
export function formatHhmm(hhmm: string, options: { hour12?: boolean } = {}): string {
  const [hour = "0", minute = "0"] = hhmm.split(":");
  // Build the base instant in UTC so the wall clock never depends on the host tz.
  const d = new TZDate(new Date(Date.UTC(2000, 0, 2, Number(hour), Number(minute), 0, 0)), "UTC");
  const pattern = options.hour12 === false ? "HH:mm" : "h:mm a";
  return format(d, pattern);
}

/** An instant shown as local wall-clock time in `timeZone`, e.g. `"8:30 AM"`. */
export function formatInstant(instant: Date | string | number, timeZone: string): string {
  return format(new TZDate(new Date(instant), timeZone), "h:mm a");
}

/** `0.905` → `"90.5%"`; `1` → `"100%"`. Rounds to `fractionDigits`. */
export function formatPercent(value: number, fractionDigits = 1): string {
  const pct = Math.round(value * 100 * 10 ** fractionDigits) / 10 ** fractionDigits;
  return `${pct}%`;
}

/** `1240` → `"1,240"` (grouped thousands). */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** `12400` → `"12.4k"`, `1_340_000` → `"1.3M"` (stat-card compact values). */
export function formatCompactNumber(value: number): string {
  if (value < 1_000) return String(value);
  const units = [
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "k"],
  ] as const;
  for (const [threshold, suffix] of units) {
    if (value >= threshold) {
      const scaled = value / threshold;
      const rounded = scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
      return `${new Intl.NumberFormat("en-US").format(rounded)}${suffix}`;
    }
  }
  return String(value);
}

/** `3` + `"dose"` → `"3 doses"`; pass an explicit plural for irregular words. */
export function plural(count: number, singular: string, pluralForm?: string): string {
  const word = count === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${formatCount(count)} ${word}`;
}

/** Inclusive `[from, to]` label: `"May 1 – May 10"` (same year) / `"May 1, 2025 – May 10, 2026"`. */
export function formatDateRange(from: string, to: string): string {
  const fromYear = from.slice(0, 4);
  const toYear = to.slice(0, 4);
  if (fromYear === toYear)
    return `${formatDateKey(from, "short")} – ${formatDateKey(to, "short")}, ${toYear}`;
  return `${formatDateKey(from)} – ${formatDateKey(to)}`;
}

/** `5` → `"5-day streak"` style window label. */
export function formatDurationLabel(days: number): string {
  return days === 1 ? "1 day" : formatCount(days) + " days";
}

/**
 * Whole-day shift on a `YYYY-MM-DD` key (clamped-shifts; no end-of-year handling:
 * the schedule header shows ± a few days around today, so overflow is unreachable).
 * Input is assumed already-validated by callers.
 */
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
