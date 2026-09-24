import { desc, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Phase 05 — full §8 schema (Drizzle, PostgreSQL, Supabase-owned database).
 *
 * Conventions (plan §8): `id text primary key` (uuidv7), `timestamptz` for instants,
 * `date` for calendar days, `createdAt/updatedAt` default now. Enums are `text` columns
 * carrying a TS union + a zod mirror (see `insert-schemas.ts`/`seed.test.ts`). All
 * user-owned tables carry `userId FK → users.id ON DELETE CASCADE`.
 */

/* ── §8.1 + §8.2 — Better Auth shape (users/session/account/verification) ── */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  timezone: text("timezone").notNull().default("UTC"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  email: text("email"),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── §8 enums (text + union; single source used by seed + services) ── */

export const MEDICATION_STATUSES = ["active", "paused"] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export const DOSE_EVENT_STATUSES = ["upcoming", "due", "snoozed", "taken", "missed", "skipped", "canceled"] as const;
export type DoseEventStatus = (typeof DOSE_EVENT_STATUSES)[number];

export const DOSE_SOURCES = ["generated", "demo"] as const;
export type DoseSource = (typeof DOSE_SOURCES)[number];

export const DOSE_ACTIONS = [
  "take",
  "skip",
  "snooze",
  "unsnooze",
  "missed_auto",
  "restored",
  "voided",
  "demo",
] as const;
export type DoseActionType = (typeof DOSE_ACTIONS)[number];

export const CAREGIVER_RELATIONSHIP_STATUSES = ["pending", "active", "declined", "revoked"] as const;
export type CaregiverRelationshipStatus = (typeof CAREGIVER_RELATIONSHIP_STATUSES)[number];

export const RELATION_TYPES = ["family", "friend", "professional", "other"] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const CAREGIVER_ALERT_TYPES = ["missed_dose", "adherence_drop", "insight", "demo"] as const;
export type CaregiverAlertType = (typeof CAREGIVER_ALERT_TYPES)[number];

export const ALERT_STATUSES = ["new", "acknowledged", "resolved"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

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

export const SUGGESTED_ACTIONS = ["review_schedule", "review_reminders", "encourage", "review_caregiver"] as const;
export type SuggestedAction = (typeof SUGGESTED_ACTIONS)[number];

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const UI_DENSITIES = ["comfortable", "compact"] as const;
export type UiDensity = (typeof UI_DENSITIES)[number];

export const DEMO_SCENARIOS = ["baseline", "decline", "improvement", "caregiver_demo"] as const;
export type DemoSscenario = (typeof DEMO_SCENARIOS)[number];

/* ── §8.3 medications ── */

export const medications = pgTable(
  "medications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dosageAmount: numeric("dosage_amount", { precision: 10, scale: 2 }).notNull(),
    dosageUnit: text("dosage_unit").notNull(),
    instructions: text("instructions"),
    notes: text("notes"),
    status: text("status").$type<MedicationStatus>().notNull().default("active"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    color: text("color")
      .notNull()
      .default("#10b981"),
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("medications_user_archived_idx").on(t.userId, t.archivedAt),
    index("medications_user_status_idx").on(t.userId, t.status),
    uniqueIndex("medications_user_name_active_uq")
      .on(t.userId, t.name)
      .where(sql`archived_at is null`),
  ],
);

/* ── §8.4 medication_schedules ── */

export const medicationSchedules = pgTable(
  "medication_schedules",
  {
    id: text("id").primaryKey(),
    medicationId: text("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    timeOfDay: text("time_of_day").notNull(),
    daysOfWeek: smallint("days_of_week").array().notNull().default(sql`ARRAY[0,1,2,3,4,5,6]`),
    dosageAmount: numeric("dosage_amount", { precision: 10, scale: 2 }),
    instructionOverride: text("instruction_override"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("medication_schedules_med_id_idx").on(t.medicationId),
    uniqueIndex("medication_schedules_med_time_uq").on(t.medicationId, t.timeOfDay),
  ],
);

/* ── §8.5 dose_events ── */

export const doseEvents = pgTable(
  "dose_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    medicationId: text("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    scheduleId: text("schedule_id").references(() => medicationSchedules.id, { onDelete: "set null" }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    status: text("status").$type<DoseEventStatus>().notNull().default("upcoming"),
    missedDeadline: timestamp("missed_deadline", { withTimezone: true }),
    takenAt: timestamp("taken_at", { withTimezone: true }),
    skippedAt: timestamp("skipped_at", { withTimezone: true }),
    skippedReason: text("skipped_reason"),
    snoozeCount: integer("snooze_count").notNull().default(0),
    snoozeUntil: timestamp("snooze_until", { withTimezone: true }),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDemo: boolean("is_demo").notNull().default(false),
    source: text("source").$type<DoseSource>().notNull().default("generated"),
  },
  (t) => [
    uniqueIndex("dose_events_med_scheduled_uq").on(t.medicationId, t.scheduledFor),
    index("dose_events_user_scheduled_idx").on(t.userId, t.scheduledFor),
    index("dose_events_user_status_idx").on(t.userId, t.status),
    index("dose_events_user_scheduled_status_idx").on(t.userId, t.scheduledFor, t.status),
    index("dose_events_is_demo_idx").on(t.isDemo),
  ],
);

/* ── §8.6 dose_actions ── */

export const doseActions = pgTable(
  "dose_actions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    doseEventId: text("dose_event_id")
      .notNull()
      .references(() => doseEvents.id, { onDelete: "cascade" }),
    action: text("action").$type<DoseActionType>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb("meta"),
  },
  (t) => [
    index("dose_actions_user_occurred_idx").on(t.userId, t.occurredAt),
    index("dose_actions_dose_event_idx").on(t.doseEventId),
  ],
);

/* ── §8.7 adherence_daily ── */

export const adherenceDaily = pgTable(
  "adherence_daily",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    medicationId: text("medication_id").references(() => medications.id, { onDelete: "cascade" }),
    scheduled: integer("scheduled").notNull().default(0),
    taken: integer("taken").notNull().default(0),
    missed: integer("missed").notNull().default(0),
    skipped: integer("skipped").notNull().default(0),
    snoozed: integer("snoozed").notNull().default(0),
    adherencePercent: numeric("adherence_percent", { precision: 5, scale: 2 }),
    streakDay: boolean("streak_day").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("adherence_daily_user_date_med_uq").on(t.userId, t.date, t.medicationId).nullsNotDistinct(),
  ],
);

/* ── §8.8 caregiver_relationships ── */

export const caregiverRelationships = pgTable(
  "caregiver_relationships",
  {
    id: text("id").primaryKey(),
    patientUserId: text("patient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    caregiverUserId: text("caregiver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<CaregiverRelationshipStatus>().notNull().default("pending"),
    relationType: text("relation_type").$type<RelationType>().notNull().default("family"),
    permissions: jsonb("permissions"),
    invitedByUserId: text("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("caregiver_relationships_patient_idx").on(t.patientUserId),
    index("caregiver_relationships_caregiver_idx").on(t.caregiverUserId),
    uniqueIndex("caregiver_relationships_pair_uq").on(t.patientUserId, t.caregiverUserId),
  ],
);

/* ── §8.9 caregiver_invitations ── */

export const caregiverInvitations = pgTable(
  "caregiver_invitations",
  {
    id: text("id").primaryKey(),
    patientUserId: text("patient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    message: text("message"),
    status: text("status").$type<InvitationStatus>().notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '7 days'`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/* ── §8.10 caregiver_alerts ── */

export const caregiverAlerts = pgTable(
  "caregiver_alerts",
  {
    id: text("id").primaryKey(),
    patientUserId: text("patient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    caregiverUserId: text("caregiver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relationshipId: text("relationship_id").references(() => caregiverRelationships.id, {
      onDelete: "set null",
    }),
    doseEventId: text("dose_event_id").references(() => doseEvents.id, { onDelete: "set null" }),
    type: text("type").$type<CaregiverAlertType>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data"),
    status: text("status").$type<AlertStatus>().notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("caregiver_alerts_caregiver_status_idx").on(t.caregiverUserId, t.status),
    index("caregiver_alerts_patient_idx").on(t.patientUserId),
  ],
);

/* ── §8.11 notifications ── */

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_read_idx").on(t.userId, t.readAt),
    index("notifications_user_created_idx").on(t.userId, desc(t.createdAt)),
  ],
);

/* ── §8.12 ai_insights ── */

export const aiInsights = pgTable(
  "ai_insights",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").$type<InsightCategory>().notNull(),
    summary: text("summary").notNull(),
    detail: text("detail"),
    suggestedActionType: text("suggested_action_type").$type<SuggestedAction>(),
    dataSnapshot: jsonb("data_snapshot").notNull(),
    source: text("source").$type<InsightSource>().notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_insights_user_created_idx").on(t.userId, desc(t.createdAt))],
);

/* ── §8.13 user_preferences (1:1 users) ── */

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").$type<Theme>().notNull().default("light"),
  missedAfterMinutes: integer("missed_after_minutes").notNull().default(30),
  snoozeMinutes: integer("snooze_minutes").notNull().default(10),
  maxSnoozes: integer("max_snoozes").notNull().default(3),
  reminderBeforeMinutes: integer("reminder_before_minutes").notNull().default(5),
  notificationPrefs: jsonb("notification_prefs")
    .notNull()
    .default(
      sql`'{"doseReminders":true,"caregiverMissedAlerts":true,"insights":true,"sounds":true}'::jsonb`,
    ),
  caregiverAlertPrefs: jsonb("caregiver_alert_prefs")
    .notNull()
    .default(sql`'{"missedDoseOn":true,"adherenceDropThreshold":null,"dailyDigest":false}'::jsonb`),
  reduceMotion: boolean("reduce_motion").notNull().default(false),
  uiDensity: text("ui_density").$type<UiDensity>().notNull().default("comfortable"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── §8.14 demo_state (1:1 demo workspace) ── */

export const demoStates = pgTable("demo_state", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  simulationNow: timestamp("simulation_now", { withTimezone: true }),
  timeMultiplier: integer("time_multiplier").notNull().default(1),
  scenario: text("scenario").$type<DemoSscenario>().notNull().default("baseline"),
  hasCaregiverDemoData: boolean("has_caregiver_demo_data").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});