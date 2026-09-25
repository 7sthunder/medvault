/**
 * Phase 07 — timezone-aware date/time helpers (plan §9 `times.ts`).
 *
 * MedVault stores every instant as `timestamptz`; calendar days and dose "times" are
 * interpreted in the *user's* timezone (`user_preferences.timezone`, default `UTC`).
 * All "local day" math goes through these helpers so dashboard/schedule/adherence stay
 * consistent. Uses date-fns v4 + the `@date-fns/tz` timezone package.
 *
 * Pure and dependency-light: safe to import from both server and client bundles.
 */

import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

import { TIME_BUCKET_BOUNDS } from "./constants";
import type { RangePreset, TimeBucket } from "./enums";

/* ── Calendar day keys ───────────────────────────────────────────────────── */

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Local calendar-day key `YYYY-MM-DD` for an instant in `timeZone`.
 * Used everywhere a "day" is the grouping unit (adherence, history, schedule).
 */
export function localDateKey(date: Date | string | number, timeZone: string): string {
  return format(new TZDate(new Date(date), timeZone), "yyyy-MM-dd");
}

/** True when `a` and `b` fall on the same calendar day in `timeZone`. */
export function isSameLocalDay(a: Date | string | number, b: Date | string | number, timeZone: string): boolean {
  return localDateKey(a, timeZone) === localDateKey(b, timeZone);
}

/** Validate + parse an `HH:mm` string (schedule slots, wizard times). */
export function parseHhMm(input: string): { hour: number; minute: number } | null {
  const m = HHMM_RE.exec(input.trim());
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Schema-level `RegExp` export for shared validation reuse. */
export const HHMM_REGEX = HHMM_RE;

/* ── Building instants in a timezone ────────────────────────────────────── */

/**
 * Combine a local `dateKey` (`YYYY-MM-DD`) + `hhmm` (`HH:mm`) into a real instant in
 * `timeZone`. Throws on malformed input — callers validate before calling.
 */
export function combineDateAndTime(dateKey: string, hhmm: string, timeZone: string): Date {
  if (!DATE_KEY_RE.test(dateKey)) {
    throw new RangeError(`combineDateAndTime: invalid dateKey "${dateKey}"`);
  }
  const cleanHhmm = hhmm.slice(0, 5);
  const parsed = parseHhMm(cleanHhmm);
  if (!parsed) {
    throw new RangeError(`combineDateAndTime: invalid hh:mm "${hhmm}"`);
  }
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  let sec = 0;
  let ms = 0;
  if (hhmm.length > 5) {
    const timeParts = hhmm.split(":");
    if (timeParts[2]) {
      const secParts = timeParts[2].split(".");
      sec = parseInt(secParts[0] || "0", 10) || 0;
      ms = parseInt(secParts[1] || "0", 10) || 0;
    }
  }
  // TZDate rolls over month/year boundaries and applies the zone offset.
  return new TZDate(y, m - 1, d, parsed.hour, parsed.minute, sec, ms, timeZone);
}

/** `startOfDay`-equivalent but *local to the user's timezone* (returns an instant). */
export function startOfLocalDay(date: Date | string | number, timeZone: string): Date {
  return combineDateAndTime(localDateKey(date, timeZone), "00:00", timeZone);
}

/** Move a local-day start by whole days (timezone-safe; handles DST + year rollover). */
export function addLocalDays(from: Date, days: number, timeZone: string): Date {
  const zoned = localDateKey(from, timeZone);
  const [y, m, d] = zoned.split("-").map(Number) as [number, number, number];
  return new TZDate(y, m - 1, d + days, 0, 0, 0, 0, timeZone);
}

/* ── Range presets (§9 `TimeRange`, §10.5 trends) ─────────────────────────── */

/**
 * Compute the `[from, to]` window for a numeric range preset, in the user's timezone.
 * `from` is the start of the first day; `to` is the end of "today" (inclusive).
 * `custom` requires explicit `from`/`to` and returns them unmodified.
 */
export function rangeByPreset(
  preset: Exclude<RangePreset, "custom">,
  options?: { now?: Date; timeZone?: string },
): { from: Date; to: Date };
export function rangeByPreset(
  preset: "custom",
  options: { from: Date; to: Date },
): { from: Date; to: Date };
export function rangeByPreset(
  preset: RangePreset,
  options: { now?: Date; timeZone?: string; from?: Date; to?: Date } = {},
): { from: Date; to: Date } {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? "UTC";

  if (preset === "custom") {
    if (!options.from || !options.to) {
      throw new RangeError("rangeByPreset('custom') requires explicit from/to.");
    }
    return { from: options.from, to: options.to };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return {
    from: addLocalDays(startOfLocalDay(now, timeZone), -(days - 1), timeZone),
    to: combineDateAndTime(localDateKey(now, timeZone), "23:59", timeZone),
  };
}

/* ── Time-of-day buckets (plan §10.5) ────────────────────────────────────── */

/**
 * Bucket an hour-of-day (0–23) into Morning/Afternoon/Evening/Night using the §10.5
 * edges declared in `TIME_BUCKET_BOUNDS`. Hour is assumed local to the user.
 */
export function bucketOf(hour: number): TimeBucket {
  const buckets = Object.entries(TIME_BUCKET_BOUNDS) as [TimeBucket, { start: number; end: number }][];
  for (const [bucket, { start, end }] of buckets) {
    if (hour >= start && hour < end) return bucket;
  }
  return "night"; // hour 23 is the last value; fully defensive fallback
}

/* ── "Now" indirection (§10.8 demo; Phase 25 real integration) ───────────── */

type NowFn = () => Date;

let nowImpl: NowFn = () => new Date();

/**
 * The demo workspace overrides "now" with `demo_state.simulation_now` (Phase 25).
 * Every domain service + shared calc that needs the current instant calls `now()`
 * rather than `new Date()` directly, so demo time is threaded everywhere.
 */
export function now(): Date {
  return nowImpl();
}

export function setNowImpl(fn: NowFn): void {
  nowImpl = fn;
}

/** Reset any overridden clock (tests, demo reset). */
export function resetNowImpl(): void {
  nowImpl = () => new Date();
}

/**
 * Legacy alias kept for readability in demo-flavoured code paths. Identical to `now()`.
 * Prefer `now()` going forward.
 */
export const demoNow = (): Date => now();