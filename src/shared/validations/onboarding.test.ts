import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./onboarding";

const VALID = {
  timezone: "Asia/Kolkata",
  missedAfterMinutes: 30,
  snoozeMinutes: 10,
  maxSnoozes: 3,
  reminderBeforeMinutes: 5,
  addSampleMed: true,
};

describe("onboardingSchema (§13 / plan.md:709)", () => {
  it("accepts a complete valid payload", () => {
    const res = onboardingSchema.safeParse(VALID);
    expect(res.success).toBe(true);
  });

  it("defaults addSampleMed to false when omitted", () => {
    const { timezone, missedAfterMinutes, snoozeMinutes, maxSnoozes, reminderBeforeMinutes } = VALID;
    const res = onboardingSchema.safeParse({ timezone, missedAfterMinutes, snoozeMinutes, maxSnoozes, reminderBeforeMinutes });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.addSampleMed).toBe(false);
  });

  it("coerces numeric string inputs (number inputs submit strings)", () => {
    const res = onboardingSchema.safeParse({
      ...VALID,
      missedAfterMinutes: "30",
      snoozeMinutes: "10",
      maxSnoozes: "3",
      reminderBeforeMinutes: "5",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.missedAfterMinutes).toBe(30);
  });

  it("rejects a non-IANA timezone", () => {
    const res = onboardingSchema.safeParse({ ...VALID, timezone: "Mars/Olympus" });
    expect(res.success).toBe(false);
  });

  it.each([
    ["missedAfterMinutes", 4, 121],
    ["snoozeMinutes", 0, 61],
    ["maxSnoozes", -1, 11],
    ["reminderBeforeMinutes", -1, 61],
  ] as const)("rejects out-of-range %s (%i / %i)", (field, below, above) => {
    expect(onboardingSchema.safeParse({ ...VALID, [field]: below }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...VALID, [field]: above }).success).toBe(false);
  });

  it("rejects non-integer reminder numbers", () => {
    const res = onboardingSchema.safeParse({ ...VALID, snoozeMinutes: 2.5 });
    expect(res.success).toBe(false);
  });
});