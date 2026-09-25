import { describe, expect, it } from "vitest";
import { deriveFrequency, formatFrequencyLabel } from "./frequency";

describe("deriveFrequency", () => {
  const allDays = [0, 1, 2, 3, 4, 5, 6];

  it("defaults to once-daily when slots list is empty or undefined", () => {
    expect(deriveFrequency([])).toBe("once-daily");
    expect(deriveFrequency(undefined)).toBe("once-daily");
    expect(deriveFrequency(null)).toBe("once-daily");
  });

  it("returns once-daily for a single daily slot", () => {
    expect(deriveFrequency([{ daysOfWeek: allDays, enabled: true }])).toBe("once-daily");
  });

  it("returns twice-daily for 2 daily slots", () => {
    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: true },
      ]),
    ).toBe("twice-daily");
  });

  it("returns n-times-daily for 3 or more daily slots", () => {
    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: true },
      ]),
    ).toBe("n-times-daily");

    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: true },
      ]),
    ).toBe("n-times-daily");
  });

  it("returns custom-weekdays if any enabled slot has fewer than 7 days", () => {
    expect(deriveFrequency([{ daysOfWeek: [1, 2, 3, 4, 5], enabled: true }])).toBe("custom-weekdays");

    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: [0, 6], enabled: true }, // weekends only
      ]),
    ).toBe("custom-weekdays");
  });

  it("ignores disabled slots when deriving frequency", () => {
    // 1 enabled daily slot + 1 disabled slot => once-daily
    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: allDays, enabled: false },
      ]),
    ).toBe("once-daily");

    // 1 enabled daily slot + 1 disabled custom-days slot => once-daily
    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: true },
        { daysOfWeek: [1, 3, 5], enabled: false },
      ]),
    ).toBe("once-daily");

    // All disabled => defaults to once-daily
    expect(
      deriveFrequency([
        { daysOfWeek: allDays, enabled: false },
      ]),
    ).toBe("once-daily");
  });
});

describe("formatFrequencyLabel", () => {
  it("formats standard labels with default text", () => {
    expect(formatFrequencyLabel("once-daily")).toBe("Once daily");
    expect(formatFrequencyLabel("twice-daily")).toBe("Twice daily");
    expect(formatFrequencyLabel("custom-weekdays")).toBe("Custom weekdays");
    expect(formatFrequencyLabel("n-times-daily")).toBe("N times daily");
  });

  it("interpolates count for n-times-daily when count > 2", () => {
    expect(formatFrequencyLabel("n-times-daily", 3)).toBe("3 times daily");
    expect(formatFrequencyLabel("n-times-daily", 4)).toBe("4 times daily");
  });
});
