/**
 * Phase 07 — shared validation building blocks (plan §13). Reused across every form
 * schema so the email/date/timezone rules never drift between auth, caregiver, settings,
 * and reports validation.
 */

import { z } from "zod";

/** Normalised email: trimmed, lower-cased, valid address. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

/** Calendar-day key `YYYY-MM-DD` (adherence/reports/medication start/end dates). */
export const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

/** App IDs are UUIDv7 strings (schema convention `id text primary key`). */
export const uuidSchema = z.uuid("Invalid id.");

/** Human name / display text rules shared by auth + settings. */
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters.")
  .max(100, "Must be at most 100 characters.");

/** No control characters (shared by text fields in §13 schemas). */
const noControlChars = (value: string) => !/[\u0000-\u001f\u007f]/.test(value);

/** Trimmed text capped at a length, with a human message. */
export function cappedTextSchema(max: number, message = `Must be at most ${max} characters.`) {
  return z
    .string()
    .trim()
    .max(max, message)
    .refine(noControlChars, "Text must not contain control characters.");
}

/** Required text capped at a min/max length (plain labels). */
export function boundedTextSchema(min: number, max: number, minMessage: string, maxMessage: string) {
  return z
    .string()
    .trim()
    .min(min, minMessage)
    .max(max, maxMessage)
    .refine(noControlChars, "Text must not contain control characters.");
}

/* ── IANA timezone list (trimmed, plan §13 settings) ─────────────────────── */

/**
 * Curated IANA zone list for settings/onboarding. `Intl.supportedValuesOf("timeZone")`
 * would need client support; this static trimmed list keeps validation deterministic
 * and is still a true subset of IANA names (DateTimeFormat accepts any of these).
 */
export const TIMEZONE_LIST: readonly string[] = [
  "UTC",
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok",
  "Asia/Dhaka",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tehran",
  "Asia/Tokyo",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Honolulu",
] as const;

/** Rolls input back to UTC when it's not on the trimmed list (server authority re-checks). */
export const timezoneSchema = z
  .string()
  .trim()
  .refine((tz) => (TIMEZONE_LIST as readonly string[]).includes(tz), "Select a valid timezone.");