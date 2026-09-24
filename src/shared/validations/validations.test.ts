import { describe, expect, it } from "vitest";

import { caregiverAcceptSchema, caregiverInviteSchema, caregiverPermissionsSchema } from "./caregiver";
import { emailSchema, timezoneSchema, uuidSchema } from "./common";
import { doseActionSchema } from "./doseAction";
import { medicationSchema } from "./medication";
import { onboardingSchema } from "./onboarding";
import { reportsSchema, reportsSchemaFor } from "./reports";
import { scheduleSchema } from "./schedule";
import { appearanceSchema, profileSchema, reminderSettingsSchema } from "./settings";

describe("common primitives", () => {
  it("normalises and validates email", () => {
    expect(emailSchema.parse("  Alice@Example.COM ")).toBe("alice@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("validates uuids and timezones", () => {
    expect(uuidSchema.safeParse("0193b8f0-6c1a-7f46-8000-000000000000").success).toBe(true);
    expect(uuidSchema.safeParse("nope").success).toBe(false);
    expect(timezoneSchema.safeParse("Asia/Kolkata").success).toBe(true);
    expect(timezoneSchema.safeParse("Mars/Olympus").success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  const base = {
    timezone: "Asia/Kolkata",
    missedAfterMinutes: 30,
    snoozeMinutes: 10,
    maxSnoozes: 3,
    reminderBeforeMinutes: 5,
    addSampleMed: false,
  };

  it("accepts a complete valid payload (coerced numbers from form inputs)", () => {
    const r = onboardingSchema.safeParse({ ...base, missedAfterMinutes: "30", addSampleMed: true });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.missedAfterMinutes).toBe(30);
      expect(r.data.addSampleMed).toBe(true);
    }
  });

  it("strips unknown keys", () => {
    const r = onboardingSchema.safeParse({ ...base, evil: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>).evil).toBeUndefined();
  });

  it("rejects invalid timezones and out-of-range numbers", () => {
    expect(onboardingSchema.safeParse({ ...base, timezone: "Not/AZone" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, missedAfterMinutes: 4 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, snoozeMinutes: 61 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, maxSnoozes: -1 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, reminderBeforeMinutes: 120 }).success).toBe(false);
  });
});

describe("medicationSchema", () => {
  const base = {
    name: "Metformin",
    dosageAmount: "500",
    dosageUnit: "mg",
    status: "active",
    startDate: "2026-01-01",
    remindersEnabled: true,
    reminderBeforeMinutes: 5,
  };

  it("accepts a valid medication and coerces numeric dosage", () => {
    const r = medicationSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.dosageAmount).toBe(500);
  });

  it("accepts nullable instructions/notes and an end date after start", () => {
    expect(medicationSchema.safeParse({ ...base, instructions: null, notes: "take with food", endDate: "2026-12-31" }).success)
      .toBe(true);
  });

  it("rejects control characters, empty names, huge dosages, and reversed dates", () => {
    expect(medicationSchema.safeParse({ ...base, name: "Bad\u0000Name" }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, dosageAmount: "100001" }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, dosageAmount: "0" }).success).toBe(false);
    const r = medicationSchema.safeParse({ ...base, startDate: "2026-02-01", endDate: "2026-01-01" });
    expect(r.success).toBe(false);
  });
});

describe("scheduleSchema", () => {
  const slot = (timeOfDay: string, daysOfWeek: number[], overrides: Record<string, unknown> = {}) => ({
    timeOfDay,
    daysOfWeek,
    ...overrides,
  });

  it("accepts once-daily and twice-daily schedules", () => {
    expect(scheduleSchema.safeParse({ slots: [slot("08:00", [0, 1, 2, 3, 4, 5, 6])] }).success).toBe(true);
    expect(
      scheduleSchema.safeParse({ slots: [slot("08:00", [0, 1, 2, 3, 4, 5, 6]), slot("20:00", [0, 1, 2, 3, 4, 5, 6])] })
        .success,
    ).toBe(true);
  });

  it("rejects bad times, empty daysets, duplicate days, and >6 slots", () => {
    expect(scheduleSchema.safeParse({ slots: [slot("24:00", [0, 1, 2, 3, 4, 5, 6])] }).success).toBe(false);
    expect(scheduleSchema.safeParse({ slots: [slot("08:00", [])] }).success).toBe(false);
    expect(scheduleSchema.safeParse({ slots: [slot("08:00", [1, 1, 2])] }).success).toBe(false);
    const many = Array.from({ length: 7 }, (_, i) => slot(`${String(i + 8).padStart(2, "0")}:00`, [1]));
    expect(scheduleSchema.safeParse({ slots: many }).success).toBe(false);
    expect(scheduleSchema.safeParse({ slots: [] }).success).toBe(false);
  });

  it("rejects duplicate (time, dayset) pairs", () => {
    const r = scheduleSchema.safeParse({
      slots: [slot("08:00", [1, 3]), slot("08:00", [3, 1])], // same pair, different order
    });
    expect(r.success).toBe(false);
  });

  it("allows the same time on disjoint daysets", () => {
    expect(scheduleSchema.safeParse({ slots: [slot("08:00", [1]), slot("08:00", [3])] }).success).toBe(true);
  });

  it("tolerates per-slot dosage override and instruction text", () => {
    expect(
      scheduleSchema.safeParse({ slots: [slot("08:00", [1], { dosageAmount: "250", instructionOverride: "half tablet" })] })
        .success,
    ).toBe(true);
  });
});

describe("doseActionSchema", () => {
  const doseId = "0193b8f0-6c1a-7f46-8000-000000000000";
  it("accepts take/snooze and skip with an optional reason", () => {
    expect(doseActionSchema.safeParse({ doseId, action: "take" }).success).toBe(true);
    expect(doseActionSchema.safeParse({ doseId, action: "snooze" }).success).toBe(true);
    expect(doseActionSchema.safeParse({ doseId, action: "skip", skipReason: "" }).success).toBe(true);
  });

  it("rejects unknown actions, non-uuid ids, and over-long reasons", () => {
    expect(doseActionSchema.safeParse({ doseId, action: "delete" }).success).toBe(false);
    expect(doseActionSchema.safeParse({ doseId: "x", action: "take" }).success).toBe(false);
    expect(doseActionSchema.safeParse({ doseId, action: "skip", skipReason: "x".repeat(201) }).success).toBe(false);
  });
});

describe("caregiverSchema", () => {
  it("invites with permissions and validates email/message bounds", () => {
    const valid = {
      email: "care@example.com",
      message: "Please help track my meds",
      relationType: "family",
      permissions: { viewAdherence: true, viewMedications: true },
    };
    const r = caregiverInviteSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.permissions.receiveMissedDoseAlerts).toBe(true); // default
    expect(caregiverInviteSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(caregiverInviteSchema.safeParse({ ...valid, message: "x".repeat(301) }).success).toBe(false);
  });

  it("accepts an invitation token and validates a permissions patch", () => {
    expect(caregiverAcceptSchema.safeParse({ token: "abc-token-123" }).success).toBe(true);
    expect(caregiverAcceptSchema.safeParse({ token: "" }).success).toBe(false);
    expect(caregiverPermissionsSchema.safeParse({}).success).toBe(true); // all defaults
  });
});

describe("settingsSchema", () => {
  it("profile: trims, validates timezone and email", () => {
    const r = profileSchema.safeParse({ name: "Alice Hartono", email: " a@b.co ", timezone: "UTC" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("a@b.co");
    expect(profileSchema.safeParse({ name: "x", email: "a@b.co", timezone: "UTC" }).success).toBe(false);
  });

  it("reminders: honours ranges and pref shapes", () => {
    const valid = {
      missedAfterMinutes: 30,
      snoozeMinutes: 10,
      maxSnoozes: 3,
      reminderBeforeMinutes: 5,
      notificationPrefs: { doseReminders: true, caregiverMissedAlerts: true, insights: true, sounds: true },
      caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: null, dailyDigest: false },
    };
    expect(reminderSettingsSchema.safeParse(valid).success).toBe(true);
    expect(reminderSettingsSchema.safeParse({ ...valid, missedAfterMinutes: 200 }).success).toBe(false);
    expect(reminderSettingsSchema.safeParse({ ...valid, caregiverAlertPrefs: { ...valid.caregiverAlertPrefs, adherenceDropThreshold: 150 } }).success)
      .toBe(false);
  });

  it("appearance: theme/density are enum-restricted", () => {
    expect(appearanceSchema.safeParse({ theme: "dark", reduceMotion: true, uiDensity: "compact" }).success).toBe(true);
    expect(appearanceSchema.safeParse({ theme: "neon", reduceMotion: false, uiDensity: "compact" }).success).toBe(false);
  });
});

describe("reportsSchema", () => {
  it("accepts a valid range and rejects reversed/oversized ones", () => {
    expect(reportsSchema.safeParse({ granularity: "daily", from: "2026-05-01", to: "2026-05-10" }).success).toBe(true);
    expect(reportsSchema.safeParse({ granularity: "monthly", from: "2026-05-10", to: "2026-05-01" }).success).toBe(false);
    expect(reportsSchema.safeParse({ granularity: "daily", from: "2024-01-01", to: "2026-01-01" }).success).toBe(false);
  });

  it("enforces to ≤ today+1 against the server clock via the factory", () => {
    const server = reportsSchemaFor("2026-05-20");
    expect(server.safeParse({ granularity: "daily", from: "2026-05-01", to: "2026-05-21" }).success).toBe(true);
    expect(server.safeParse({ granularity: "daily", from: "2026-05-01", to: "2026-05-22" }).success).toBe(false);
  });

  it("accepts an optional medication scope", () => {
    expect(
      reportsSchema.safeParse({
        granularity: "weekly",
        from: "2026-05-01",
        to: "2026-05-10",
        medicationId: "0193b8f0-6c1a-7f46-8000-000000000000",
      }).success,
    ).toBe(true);
    expect(
      reportsSchema.safeParse({ granularity: "weekly", from: "2026-05-01", to: "2026-05-10", medicationId: "bad" })
        .success,
    ).toBe(false);
  });
});