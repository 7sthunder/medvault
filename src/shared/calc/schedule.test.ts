import { describe, expect, it } from "vitest";

import { combineDateAndTime, localDateKey } from "../times";
import { expandSchedule, type ScheduleMedication, type ScheduleSlot } from "./schedule";

const TZ = "Asia/Kolkata"; // UTC+5:30 fixed offset — clean probes

function med(overrides: Partial<ScheduleMedication> = {}): ScheduleMedication {
  return {
    id: "med-1",
    dosageAmount: 500,
    startDate: "2026-01-05",
    endDate: null,
    ...overrides,
  };
}

function slot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: "slot-1",
    timeOfDay: "08:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    dosageAmount: null,
    ...overrides,
  };
}

function instantIs(d: Date, dateKey: string, hhmm: string, tz = TZ): void {
  expect(d.toISOString()).toBe(combineDateAndTime(dateKey, hhmm, tz).toISOString());
}

describe("shared/calc/schedule — expandSchedule (§10.2)", () => {
  it("emits one dose per enabled full-week slot for every in-window day", () => {
    const doses = expandSchedule(
      med(),
      [slot(), slot({ id: "slot-2", timeOfDay: "20:00" })],
      "2026-01-05",
      "2026-01-06",
      TZ,
    );
    expect(doses).toHaveLength(4);
    instantIs(doses[0]!.scheduledFor, "2026-01-05", "08:00");
    instantIs(doses[1]!.scheduledFor, "2026-01-05", "20:00");
    instantIs(doses[2]!.scheduledFor, "2026-01-06", "08:00");
    instantIs(doses[3]!.scheduledFor, "2026-01-06", "20:00");
    expect(doses.map((d) => d.scheduleId)).toEqual(["slot-1", "slot-2", "slot-1", "slot-2"]);
  });

  it("per-slot dosageAmount overrides the medication dosage", () => {
    const [dose] = expandSchedule(
      med({ dosageAmount: 500 }),
      [slot({ dosageAmount: 250 })],
      "2026-01-05",
      "2026-01-05",
      TZ,
    );
    expect(dose?.dosageAmount).toBe(250);
  });

  it("falls back to the medication dosage when the slot has none", () => {
    const [dose] = expandSchedule(
      med({ dosageAmount: 500 }),
      [slot({ dosageAmount: null })],
      "2026-01-05",
      "2026-01-05",
      TZ,
    );
    expect(dose?.dosageAmount).toBe(500);
  });

  it("respects startDate/endDate bounds (inclusive)", () => {
    const sched = slot({ daysOfWeek: [1] }); // Monday
    // 2026-01-05 is a Monday; window wider than the medication window.
    const doses = expandSchedule(
      med({ startDate: "2026-01-05", endDate: "2026-01-05" }),
      [sched],
      "2026-01-03",
      "2026-01-07",
      TZ,
    );
    expect(doses).toHaveLength(1);
    instantIs(doses[0]!.scheduledFor, "2026-01-05", "08:00");
  });

  it("skips disabled slots", () => {
    const doses = expandSchedule(med(), [slot({ enabled: false })], "2026-01-05", "2026-01-05", TZ);
    expect(doses).toHaveLength(0);
  });

  it("honours the weekdays-of-week filter", () => {
    const monFri = expandSchedule(
      med(),
      [slot({ daysOfWeek: [1, 5] })],
      "2026-01-05",
      "2026-01-11",
      TZ,
    );
    expect(monFri.map((d) => localDateKey(d.scheduledFor, TZ))).toEqual([
      "2026-01-05",
      "2026-01-09",
    ]);
  });

  it("is idempotent and deterministic — same inputs give identical output", () => {
    const input = [slot(), slot({ id: "s2", timeOfDay: "20:00" })] as ScheduleSlot[];
    const a = expandSchedule(med(), input, "2026-01-05", "2026-01-08", TZ);
    const b = expandSchedule(med(), input, "2026-01-05", "2026-01-08", TZ);
    expect(a).toEqual(b);
    expect(a.length).toBe(b.length);
  });

  it("returns [] for an inverted window or empty slots", () => {
    expect(expandSchedule(med(), [slot()], "2026-01-07", "2026-01-05", TZ)).toEqual([]);
    expect(expandSchedule(med(), [], "2026-01-05", "2026-01-05", TZ)).toEqual([]);
  });

  it("is timezone-correct: pushed instants reflect the user zone", () => {
    const [dose] = expandSchedule(
      med(),
      [slot({ timeOfDay: "08:00" })],
      "2026-01-05",
      "2026-01-05",
      TZ,
    );
    // Kolkata is UTC+5:30 → local 08:00 on Jan 5 = 02:30Z (epoch-normalised).
    expect(dose!.scheduledFor.getTime()).toBe(new Date("2026-01-05T02:30:00.000Z").getTime());
  });

  it("handles year/leap boundaries cleanly", () => {
    const doses = expandSchedule(
      med({ startDate: "2023-12-31", endDate: "2024-01-02" }),
      [slot({ daysOfWeek: [0, 1, 2] })], // Sun/Mon/Tue
      "2023-12-31",
      "2024-01-02",
      TZ,
    );
    // Sun Dec 31, Mon Jan 1, Tue Jan 2 — all in window.
    expect(doses).toHaveLength(3);
    instantIs(doses[0]!.scheduledFor, "2023-12-31", "08:00");
    instantIs(doses[2]!.scheduledFor, "2024-01-02", "08:00");
  });
});
