/**
 * Phase 07 — canonical enum/union single source (plan §9).
 *
 * Every string union used across the app (schema columns, DTOs, forms, nav, reports,
 * insights) is defined HERE. The database schema (`src/server/db/schema.ts`) re-exports
 * the data-model members so row types and seeds stay in sync without duplicating a
 * single literal. `status.ts` (display meta per §12) re-exports the display status set.
 *
 * Keep this file dependency-free: no imports from server, React, or lucide.
 */

/* ── §8.5 · §12 · §9 — Dose statuses ─────────────────────────────────────── */

/**
 * Display dose statuses shown in the UI (plan §12). This is a *superset* of the
 * persistent model: `due-now` is the derived "upcoming but already past its time"
 * display state and `paused` is a medication-level state surfaced on dose chips.
 */
export const DOSE_STATUSES = [
  "taken",
  "upcoming",
  "due-now",
  "missed",
  "skipped",
  "snoozed",
  "paused",
  "canceled",
] as const;
export type DoseStatus = (typeof DOSE_STATUSES)[number];

/**
 * Persistent `dose_events.status` values (schema §8.5). Contained in the display set
 * minus the two derived/display-only members (`due-now`, `paused`).
 */
export const DOSE_EVENT_STATUSES = [
  "upcoming",
  "due",
  "snoozed",
  "taken",
  "missed",
  "skipped",
  "canceled",
] as const;
export type DoseEventStatus = (typeof DOSE_EVENT_STATUSES)[number];

/* ── §8.3 — Medication lifecycle ─────────────────────────────────────────── */

export const MEDICATION_STATUSES = ["active", "paused"] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

/* ── §8.5 — Dose event provenance ────────────────────────────────────────── */

export const DOSE_SOURCES = ["generated", "demo"] as const;
export type DoseSource = (typeof DOSE_SOURCES)[number];

/* ── §8.6 — Dose action log (append-only audit) ──────────────────────────── */

export const DOSE_ACTION_TYPES = [
  "take",
  "skip",
  "snooze",
  "unsnooze",
  "missed_auto",
  "restored",
  "voided",
  "demo",
] as const;
export type DoseActionType = (typeof DOSE_ACTION_TYPES)[number];

/**
 * User-initiated actions exposed by the dose router (§13 `doseActionSchema`).
 * `missed_auto`/`voided`/`restored` are system-authored and never come from a form.
 */
export const USER_DOSE_ACTIONS = ["take", "snooze", "skip"] as const;
export type UserDoseAction = (typeof USER_DOSE_ACTIONS)[number];

/* ── §8.8–§8.10 — Caregiver domain ───────────────────────────────────────── */

export const CAREGIVER_RELATIONSHIP_STATUSES = [
  "pending",
  "active",
  "declined",
  "revoked",
] as const;
export type CaregiverRelationshipStatus = (typeof CAREGIVER_RELATIONSHIP_STATUSES)[number];

export const RELATION_TYPES = ["family", "friend", "professional", "other"] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const CAREGIVER_ALERT_TYPES = ["missed_dose", "adherence_drop", "insight", "demo"] as const;
export type CaregiverAlertType = (typeof CAREGIVER_ALERT_TYPES)[number];

export const ALERT_STATUSES = ["new", "acknowledged", "resolved"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

/* ── §8.11 — Notifications ───────────────────────────────────────────────── */

export const NOTIFICATION_TYPES = [
  "upcoming_dose",
  "due_dose",
  "missed_dose",
  "caregiver_alert",
  "system",
  "insight",
  "demo",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Notification grouping tabs on `/notifications` (§11.13). */
export const NOTIFICATION_TABS = ["all", "dose", "caregiver", "ai", "system"] as const;
export type NotificationTab = (typeof NOTIFICATION_TABS)[number];

/* ── §8.12 — AI insights ─────────────────────────────────────────────────── */

export const INSIGHT_CATEGORIES = [
  "timing_pattern",
  "adherence_decline",
  "adherence_improvement",
  "snooze_pattern",
  "medication_difference",
  "missed_analysis",
  "general",
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const INSIGHT_SOURCES = ["ai", "fallback", "demo"] as const;
export type InsightSource = (typeof INSIGHT_SOURCES)[number];

export const SUGGESTED_ACTIONS = [
  "review_schedule",
  "review_reminders",
  "encourage",
  "review_caregiver",
] as const;
export type SuggestedAction = (typeof SUGGESTED_ACTIONS)[number];

/* ── §8.13 — Preferences ─────────────────────────────────────────────────── */

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const UI_DENSITIES = ["comfortable", "compact"] as const;
export type UiDensity = (typeof UI_DENSITIES)[number];

/* ── §8.14 — Demo workspace ──────────────────────────────────────────────── */

export const DEMO_SCENARIOS = ["baseline", "decline", "improvement", "caregiver_demo"] as const;
export type DemoSscenario = (typeof DEMO_SCENARIOS)[number];
/** Corrected alias — kept alongside the schema-compatible typo name. */
export type DemoScenario = DemoSscenario;

/* ── §8.4 — Frequency labels (derived from schedule slots) ───────────────── */

export const FREQUENCY_LABELS = [
  "once-daily",
  "twice-daily",
  "n-times-daily",
  "custom-weekdays",
] as const;
export type FrequencyLabel = (typeof FREQUENCY_LABELS)[number];

export const FREQUENCY_LABEL_TEXT: Readonly<Record<FrequencyLabel, string>> = {
  "once-daily": "Once daily",
  "twice-daily": "Twice daily",
  "n-times-daily": "N times daily",
  "custom-weekdays": "Custom weekdays",
};

/* ── §10.5 — Time-of-day buckets ─────────────────────────────────────────── */

export const TIME_BUCKETS = ["morning", "afternoon", "evening", "night"] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

export const TIME_BUCKET_TEXT: Readonly<Record<TimeBucket, string>> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

/* ── §10.9/§20 — Reports & ranges ────────────────────────────────────────── */

export const REPORT_GRANULARITIES = ["daily", "weekly", "monthly"] as const;
export type ReportGranularity = (typeof REPORT_GRANULARITIES)[number];

export const REPORT_GRANULARITY_TEXT: Readonly<Record<ReportGranularity, string>> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const RANGE_PRESETS = ["7d", "30d", "90d", "custom"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const RANGE_PRESET_TEXT: Readonly<Record<RangePreset, string>> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};
