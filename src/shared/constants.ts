/**
 * Phase 07 — shared constants (plan §9). Single source for every default/limit the
 * app relies on: validation bounds, dose-engine defaults, demo identities, and the
 * §10.5 time-of-day bucket bounds. Import from here — never re-type literals.
 *
 * Dependency-free (no imports beyond `enums.ts`).
 */

import type { TimeBucket } from "./enums";

/* ── §10.2/§10.8 — Engine defaults ───────────────────────────────────────── */

/** Minutes after a dose's scheduled time before it is considered missed (§10.3 rule 2). */
export const MISSED_AFTER_DEFAULT = 30;

/** Minutes a snooze delays a due dose (§10.3 rule 3). */
export const SNOOZE_MIN_DEFAULT = 10;

/** Maximum number of snoozes per dose event before it must be resolved (§10.3). */
export const MAX_SNOOZES_DEFAULT = 3;

/** Minutes before a dose time to fire the "upcoming" reminder. */
export const REMINDER_BEFORE_DEFAULT = 5;

/** Number of days of dose events generated ahead of "now" (§10.2 horizon). */
export const HORIZON_DAYS = 14;

/** Maximum `ai_insights` rows kept per user (prune threshold §8.12). */
export const RECENT_INSIGHTS = 5;
export const INSIGHT_MAX_ROWS = 20;

/** Page size for the history cursor pagination (§11.10). */
export const HISTORY_PAGE_SIZE = 25;

/** Page size for paginated list views (notifications, caregiver alerts). */
export const LIST_PAGE_SIZE = 20;

/** Maximum schedule slots per medication (§13 scheduleSchema). */
export const MAX_SCHEDULE_SLOTS = 6;

/** Days an invitation token stays valid (§8.9 default `+7d`). */
export const INVITATION_TTL_DAYS = 7;

/* ── Validation bounds (shared by onboarding + settings + medication schemas) ── */

/** Centralised numeric limits so onboarding/settings ranges never drift apart. */
export const VALUE_LIMITS = {
  missedAfterMinutes: { min: 5, max: 120 },
  snoozeMinutes: { min: 1, max: 60 },
  maxSnoozes: { min: 0, max: 10 },
  reminderBeforeMinutes: { min: 0, max: 60 },
} as const;

export const MED_NAME_MAX = 100;
export const INSTRUCTIONS_MAX = 500;
export const NOTES_MAX = 1000;
export const DOSAGE_AMOUNT_MAX = 100000;
export const SKIP_REASON_MAX = 200;
export const CAREGIVER_MESSAGE_MAX = 300;
/** Per-slot `instructionOverride` (schedule schema). */
export const INSTRUCTION_OVERRIDE_MAX = 200;

/** Maximum report span in days (§13 reportsSchema). */
export const REPORT_MAX_SPAN_DAYS = 366;

/* ── §19 / §10.8 — Demo identities ────────────────────────────────────────── */

export const DEMO_USER_EMAIL = "demo@medvault.demo";
export const DEMO_USER_NAME = "MedVault Demo";
export const DEMO_PASSWORD_HINT = "auto-generated demo credentials";

/** The seed demo patient (plan §19, shared with `demo-seed.ts`). */
export const DEMO_PATIENT_NAME = "Arun Kumar";

/** Project-wide day keys + time defaults for wizard presets (§11.6). */
export const DEFAULT_SLOT_TIMES = ["08:00", "20:00"] as const;

/* ── §10.5 — Time-of-day bucket bounds (single authority for bucketOf) ────── */

/**
 * Bucket edges per plan §10.5: Morning `<12`, Afternoon `12–17`, Evening `17–21`,
 * Night `≥21`. Buckets are half-open `[start, end)`.
 */
export const TIME_BUCKET_BOUNDS: Readonly<Record<TimeBucket, { start: number; end: number }>> = {
  morning: { start: 0, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
  night: { start: 21, end: 24 },
};