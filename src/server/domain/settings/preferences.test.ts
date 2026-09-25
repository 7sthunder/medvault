import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/shared/validations/onboarding";
import { DEFAULT_ONBOARDING_STATE } from "@/features/onboarding/types";

describe("Phase 10 — Onboarding & Preferences validation contract", () => {
  it("DEFAULT_ONBOARDING_STATE satisfies onboardingSchema", () => {
    const parsed = onboardingSchema.safeParse(DEFAULT_ONBOARDING_STATE);
    expect(parsed.success).toBe(true);
  });

  it("accepts valid IANA timezones and converts strings to numbers", () => {
    const input = {
      timezone: "America/New_York",
      missedAfterMinutes: "45",
      snoozeMinutes: "15",
      maxSnoozes: "5",
      reminderBeforeMinutes: "10",
      addSampleMed: false,
    };

    const parsed = onboardingSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.missedAfterMinutes).toBe(45);
      expect(parsed.data.snoozeMinutes).toBe(15);
      expect(parsed.data.maxSnoozes).toBe(5);
      expect(parsed.data.reminderBeforeMinutes).toBe(10);
      expect(parsed.data.addSampleMed).toBe(false);
    }
  });

  it("rejects invalid timezones outside the supported list", () => {
    const parsed = onboardingSchema.safeParse({
      ...DEFAULT_ONBOARDING_STATE,
      timezone: "Mars/Olympus_Mons",
    });
    expect(parsed.success).toBe(false);
  });

  it("enforces VALUE_LIMITS on reminder grace and snooze values", () => {
    // missedAfterMinutes < 5
    expect(
      onboardingSchema.safeParse({
        ...DEFAULT_ONBOARDING_STATE,
        missedAfterMinutes: 2,
      }).success,
    ).toBe(false);

    // missedAfterMinutes > 120
    expect(
      onboardingSchema.safeParse({
        ...DEFAULT_ONBOARDING_STATE,
        missedAfterMinutes: 200,
      }).success,
    ).toBe(false);

    // maxSnoozes > 10
    expect(
      onboardingSchema.safeParse({
        ...DEFAULT_ONBOARDING_STATE,
        maxSnoozes: 15,
      }).success,
    ).toBe(false);

    // snoozeMinutes < 1
    expect(
      onboardingSchema.safeParse({
        ...DEFAULT_ONBOARDING_STATE,
        snoozeMinutes: 0,
      }).success,
    ).toBe(false);
  });
});
