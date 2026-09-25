import { describe, expect, it } from "vitest";
import { expandSchedule, type ExpandScheduleMedication, type ExpandScheduleSlot } from "./schedule";

describe("Phase 12 — expandSchedule (pure schedule expansion)", () => {
  const activeMed: ExpandScheduleMedication = {
    id: "med-1",
    startDate: "2026-03-01",
    endDate: "2026-03-07",
    status: "active",
  };

  const dailySlot: ExpandScheduleSlot = {
    id: "slot-1",
    timeOfDay: "08:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
  };

  it("returns empty array when medication is paused", () => {
    const events = expandSchedule(
      { ...activeMed, status: "paused" },
      [dailySlot],
      { from: "2026-03-01", to: "2026-03-07", timeZone: "UTC" },
    );
    expect(events).toEqual([]);
  });

  it("returns empty array when slots are empty or all disabled", () => {
    expect(
      expandSchedule(activeMed, [], { from: "2026-03-01", to: "2026-03-07", timeZone: "UTC" }),
    ).toEqual([]);

    expect(
      expandSchedule(activeMed, [{ ...dailySlot, enabled: false }], {
        from: "2026-03-01",
        to: "2026-03-07",
        timeZone: "UTC",
      }),
    ).toEqual([]);
  });

  it("expands a daily slot across 7 days into 7 events", () => {
    const events = expandSchedule(activeMed, [dailySlot], {
      from: "2026-03-01",
      to: "2026-03-07",
      timeZone: "UTC",
    });

    expect(events).toHaveLength(7);
    expect(events[0]?.dateKey).toBe("2026-03-01");
    expect(events[0]?.timeOfDay).toBe("08:00");
    expect(events[6]?.dateKey).toBe("2026-03-07");
    expect(events[6]?.timeOfDay).toBe("08:00");
  });

  it("expands twice-daily slots into 14 chronologically sorted events", () => {
    const eveningSlot: ExpandScheduleSlot = {
      id: "slot-2",
      timeOfDay: "20:00",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
    };

    const events = expandSchedule(activeMed, [dailySlot, eveningSlot], {
      from: "2026-03-01",
      to: "2026-03-07",
      timeZone: "UTC",
    });

    expect(events).toHaveLength(14);
    expect(events[0]?.dateKey).toBe("2026-03-01");
    expect(events[0]?.timeOfDay).toBe("08:00");
    expect(events[1]?.dateKey).toBe("2026-03-01");
    expect(events[1]?.timeOfDay).toBe("20:00");
  });

  it("respects custom weekdays filter (e.g. MWF: 1, 3, 5)", () => {
    // 2026-03-01 is Sunday (0)
    // 2026-03-02 is Monday (1)
    // 2026-03-03 is Tuesday (2)
    // 2026-03-04 is Wednesday (3)
    // 2026-03-05 is Thursday (4)
    // 2026-03-06 is Friday (5)
    // 2026-03-07 is Saturday (6)
    const mwfSlot: ExpandScheduleSlot = {
      id: "slot-mwf",
      timeOfDay: "10:00",
      daysOfWeek: [1, 3, 5],
      enabled: true,
    };

    const events = expandSchedule(activeMed, [mwfSlot], {
      from: "2026-03-01",
      to: "2026-03-07",
      timeZone: "UTC",
    });

    expect(events).toHaveLength(3);
    expect(events[0]?.dateKey).toBe("2026-03-02"); // Mon
    expect(events[1]?.dateKey).toBe("2026-03-04"); // Wed
    expect(events[2]?.dateKey).toBe("2026-03-06"); // Fri
  });

  it("clips expansion strictly to medication startDate and endDate", () => {
    const medWithBounds: ExpandScheduleMedication = {
      id: "med-bounded",
      startDate: "2026-03-03",
      endDate: "2026-03-05",
      status: "active",
    };

    const events = expandSchedule(medWithBounds, [dailySlot], {
      from: "2026-03-01",
      to: "2026-03-10",
      timeZone: "UTC",
    });

    expect(events).toHaveLength(3);
    expect(events[0]?.dateKey).toBe("2026-03-03");
    expect(events[1]?.dateKey).toBe("2026-03-04");
    expect(events[2]?.dateKey).toBe("2026-03-05");
  });

  it("produces correct UTC timestamps for different timezones", () => {
    // 08:00 AM in America/New_York (EST, UTC-5) = 13:00 UTC
    const nyEvents = expandSchedule(
      { ...activeMed, startDate: "2026-01-05", endDate: "2026-01-05" },
      [dailySlot],
      { from: "2026-01-05", to: "2026-01-05", timeZone: "America/New_York" },
    );

    expect(nyEvents).toHaveLength(1);
    expect(new Date(nyEvents[0]!.scheduledFor.getTime()).toISOString()).toBe("2026-01-05T13:00:00.000Z");

    // 08:00 AM in Asia/Kolkata (IST, UTC+5:30) = 02:30 UTC
    const istEvents = expandSchedule(
      { ...activeMed, startDate: "2026-01-05", endDate: "2026-01-05" },
      [dailySlot],
      { from: "2026-01-05", to: "2026-01-05", timeZone: "Asia/Kolkata" },
    );

    expect(istEvents).toHaveLength(1);
    expect(new Date(istEvents[0]!.scheduledFor.getTime()).toISOString()).toBe("2026-01-05T02:30:00.000Z");
  });
});
