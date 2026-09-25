/**
 * Phase 07 — shared DTO contracts (plan §9 `types.ts`).
 *
 * Every tRPC procedure returns one of these shapes; pages never receive raw row types.
 * mappers live in `server/domain/**` and convert drizzle rows → DTOs.
 *
 * Conventions:
 * - Instants (`scheduledFor`, `takenAt`, …) are typed `Date` server-side and serialise
 *   through the tRPC transformer (superjson planned with the client in a later phase).
 * - Calendar days (`startDate`, adherence `date`) are plain `YYYY-MM-DD` strings.
 * - `number` for numeric columns — domain mappers cast `numeric`/`text` to JS numbers.
 *
 * Dependency-free (imports only `enums` + a few scalar unions).
 */

import type {
  CaregiverAlertType,
  CaregiverRelationshipStatus,
  DoseActionType,
  DoseEventStatus,
  FrequencyLabel,
  InsightCategory,
  InsightSource,
  MedicationStatus,
  NotificationType,
  RangePreset,
  RelationType,
  ReportGranularity,
  SuggestedAction,
  Theme,
  TimeBucket,
  UiDensity,
} from "./enums";

export type {
  CaregiverAlertType,
  CaregiverRelationshipStatus,
  DoseActionType,
  DoseEventStatus,
  FrequencyLabel,
  InsightCategory,
  InsightSource,
  MedicationStatus,
  NotificationType,
  RangePreset,
  RelationType,
  ReportGranularity,
  SuggestedAction,
  Theme,
  TimeBucket,
  UiDensity,
};

/* ── User ────────────────────────────────────────────────────────────────── */

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  timezone: string;
  onboardingCompleted: boolean;
}

/* ── Medications (§10.1, §8.3/§8.4) ───────────────────────────────────────── */

export interface ScheduleSlotDTO {
  id: string;
  medicationId: string;
  /** Local `HH:mm` in the user's timezone. */
  timeOfDay: string;
  /** 0=Sunday … 6=Saturday (ISO-style weekday list). */
  daysOfWeek: number[];
  dosageAmount: number | null;
  instructionOverride: string | null;
  enabled: boolean;
}

export interface MedicationDTO {
  id: string;
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  instructions: string | null;
  notes: string | null;
  status: MedicationStatus;
  /** Calendar day `YYYY-MM-DD`. */
  startDate: string;
  /** Calendar day `YYYY-MM-DD` or null when ongoing. */
  endDate: string | null;
  /** Assigned UI accent for avatar/chip tiles. */
  color: string;
  remindersEnabled: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  /** Derived from enabled slots (§8.4). */
  frequencyLabel: FrequencyLabel;
  slots: ScheduleSlotDTO[];
  /** Next unresolved dose instant, or null. Filled by list/detail joins. */
  nextDoseAt: Date | null;
  /** Period adherence % (1dp) or null when no data. Filled by adherence joins. */
  adherencePercent: number | null;
}

/** Lightweight medication snapshot embedded in dose/history DTOs. */
export interface MedicationLite {
  id: string;
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  color: string;
  archivedAt: Date | null;
}

/* ── Dose events + actions (§8.5/§8.6, §10.3/§10.4) ───────────────────────── */

export interface DoseEventDTO {
  id: string;
  medicationId: string;
  scheduleId: string | null;
  /** Instant the dose is scheduled for, in the user's timezone. */
  scheduledFor: Date;
  status: DoseEventStatus;
  missedDeadline: Date | null;
  takenAt: Date | null;
  skippedAt: Date | null;
  skippedReason: string | null;
  snoozeCount: number;
  snoozeUntil: Date | null;
  statusUpdatedAt: Date;
  source: "generated" | "demo";
  medication: MedicationLite;
}

export interface DoseActionDTO {
  id: string;
  doseEventId: string;
  action: DoseActionType;
  occurredAt: Date;
  meta: Record<string, unknown> | null;
  /** Joined snapshot for history/timeline rendering. */
  medication: MedicationLite;
  eventStatus: DoseEventStatus;
  eventScheduledFor: Date;
}

/* ── Adherence (§10.5) ────────────────────────────────────────────────────── */

export interface AdherenceDay {
  /** Calendar day `YYYY-MM-DD`. */
  date: string;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  snoozed: number;
  /** 1dp percentage or null when the day has no required doses. */
  adherencePercent: number | null;
  streakDay: boolean;
}

export interface StreakSummaryDTO {
  current: number;
  longest: number;
  /** True when today is counted (adherent-so-far) toward the current streak. */
  currentEndsToday: boolean;
}

export interface TrendDay {
  date: string;
  adherencePercent: number | null;
}

export type TrendDirection = "improving" | "declining" | "stable";

export interface TrendDTO {
  daily: TrendDay[];
  /** Rolling 7-day average curve (aligned to day end). */
  rolling7: { date: string; value: number | null }[];
  direction: TrendDirection;
  current7: number | null;
  prior7: number | null;
}

export interface TimeBucketStats {
  bucket: TimeBucket;
  scheduled: number;
  taken: number;
  missed: number;
  rate: number | null;
}

/** The one shape every adherence surface (dashboard/adherence/reports/insights) builds from. */
export interface AdherenceSummaryDTO {
  from: Date;
  to: Date;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  snoozed: number;
  /** 1dp or null when the period has no scheduled doses. */
  adherencePercent: number | null;
  days: AdherenceDay[];
  streak: StreakSummaryDTO;
  trend: TrendDTO;
  byBucket: TimeBucketStats[];
}

export interface MedicationPerformanceDTO {
  medicationId: string;
  name: string;
  color: string;
  frequencyLabel: FrequencyLabel;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  adherencePercent: number | null;
  bestBucket: TimeBucket | null;
  worstBucket: TimeBucket | null;
  lastTakenAt: Date | null;
}

/* ── Dashboard (§11.4) ────────────────────────────────────────────────────── */

export interface DashboardStatsDTO {
  /** Today's adherence % (1dp) or null before any dose resolves. */
  adherenceToday: number | null;
  currentStreak: number;
  nextDoseTime: Date | null;
  missedToday: number;
  takenToday: number;
  scheduledToday: number;
}

export interface DashboardCaregiverDTO {
  connectedCount: number;
  newAlerts: number;
}

export interface DashboardDTO {
  stats: DashboardStatsDTO;
  dueNow: DoseEventDTO[];
  nextDose: DoseEventDTO | null;
  today: DoseEventDTO[];
  week: AdherenceDay[];
  medications: MedicationDTO[];
  latestInsight: InsightDTO | null;
  caregiver: DashboardCaregiverDTO;
}

/* ── Notifications (§8.11) ────────────────────────────────────────────────── */

export interface NotifDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: "medication" | "doseEvent" | "insight" | "caregiverAlert" | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface UnreadCountDTO {
  count: number;
}

/* ── Caregiver (§8.8/§8.9/§8.10, §10.6) ───────────────────────────────────── */

export interface CaregiverPermissions {
  viewAdherence: boolean;
  viewMedications: boolean;
  receiveMissedDoseAlerts: boolean;
  receiveInsights: boolean;
  canAcknowledgeAlerts: boolean;
}

export const DEFAULT_CAREGIVER_PERMISSIONS: CaregiverPermissions = {
  viewAdherence: true,
  viewMedications: false,
  receiveMissedDoseAlerts: true,
  receiveInsights: false,
  canAcknowledgeAlerts: true,
};

export interface CaregiverRelationshipDTO {
  id: string;
  patientUserId: string;
  caregiverUserId: string;
  patientName: string;
  caregiverName: string;
  status: CaregiverRelationshipStatus;
  relationType: RelationType;
  permissions: CaregiverPermissions;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface CaregiverInvitationDTO {
  id: string;
  email: string;
  message: string | null;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: Date;
  createdAt: Date;
}

export interface CaregiverAlertDTO {
  id: string;
  type: CaregiverAlertType;
  title: string;
  body: string;
  status: "new" | "acknowledged" | "resolved";
  createdAt: Date;
  resolvedAt: Date | null;
  /** Flattened snapshot for the UI (from `data`). */
  patientName: string;
  medicationName: string | null;
  scheduledFor: Date | null;
  doseEventId: string | null;
}

/* ── AI insights (§8.12, §10.10) ──────────────────────────────────────────── */

export interface InsightDTO {
  id: string;
  category: InsightCategory;
  summary: string;
  detail: string | null;
  suggestedActionType: SuggestedAction | null;
  source: InsightSource;
  confidence: number | null;
  createdAt: Date;
}

/* ── Reports (§10.9) ──────────────────────────────────────────────────────── */

export interface ReportRow {
  /** Period label: `YYYY-MM-DD` (daily), ISO week key (weekly), `YYYY-MM` (monthly). */
  period: string;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  adherencePercent: number | null;
}

export interface ReportTrendPoint {
  label: string;
  adherence: number | null;
  taken: number;
  missed: number;
  skipped: number;
}

export interface ReportSummaryStats {
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  adherencePercent: number | null;
}

export interface ReportMissedMedicationStat {
  medicationId: string;
  name: string;
  color: string;
  missed: number;
  scheduled: number;
  adherencePercent: number | null;
}

export interface ReportMissedAnalysis {
  byBucket: TimeBucketStats[];
  byMedication: ReportMissedMedicationStat[];
}

export interface ReportDTO {
  granularity: ReportGranularity;
  from: Date;
  to: Date;
  medicationId?: string | null;
  table: ReportRow[];
  trend: ReportTrendPoint[];
  summary: ReportSummaryStats;
  missedAnalysis: ReportMissedAnalysis;
}

export interface ReportPeriodDTO {
  granularity: ReportGranularity;
  from: Date;
  to: Date;
  medicationId: string | null;
}

/* ── Preferences & settings (§8.13, §10.11) ──────────────────────────────── */

export interface NotificationPrefs {
  doseReminders: boolean;
  caregiverMissedAlerts: boolean;
  insights: boolean;
  sounds: boolean;
}

export interface CaregiverAlertPrefs {
  missedDoseOn: boolean;
  /** 0–100 threshold — 7d adherence below it triggers an alert; null disables. */
  adherenceDropThreshold: number | null;
  dailyDigest: boolean;
}

export interface ReminderSettingsDTO {
  missedAfterMinutes: number;
  snoozeMinutes: number;
  maxSnoozes: number;
  reminderBeforeMinutes: number;
  notificationPrefs: NotificationPrefs;
  caregiverAlertPrefs: CaregiverAlertPrefs;
}

export interface AppearanceSettingsDTO {
  theme: Theme;
  reduceMotion: boolean;
  uiDensity: UiDensity;
}

export interface DataOverviewDTO {
  medications: number;
  doseEvents: number;
  doseActions: number;
  insights: number;
  notifications: number;
}

/* ── Shared query input (plan §9 `TimeRange`) ─────────────────────────────── */

export interface TimeRange {
  from?: Date;
  to?: Date;
  range?: RangePreset;
}