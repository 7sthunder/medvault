import { describe, expect, it } from "vitest";

import type { MedicationDTO, ScheduleSlotDTO } from "@/shared/types";

import {
  daysLabel,
  filterMedications,
  slotTimeLine,
  type MedicationStatusFilter,
} from "./medication-utils";

function slot(timeOfDay: string): ScheduleSlotDTO {
  return {
    id: `slot-${timeOfDay}`,
    medicationId: "med-1",
    timeOfDay,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    dosageAmount: null,
    instructionOverride: null,
    enabled: true,
  };
}

function med(overrides: Partial<MedicationDTO> = {}): MedicationDTO {
  return {
    id: "med-1",
    name: "Metformin",
    dosageAmount: 500,
    dosageUnit: "mg",
    instructions: null,
    notes: null,
    status: "active",
    startDate: "2026-01-05",
    endDate: null,
    color: "10b981",
    remindersEnabled: true,
    archivedAt: null,
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    frequencyLabel: "twice-daily",
    slots: [slot("08:00"), slot("20:00")],
    nextDoseAt: null,
    adherencePercent: null,
    ...overrides,
  };
}

const metformin = med();
const atorvastatin = med({
  id: "med-2",
  name: "Atorvastatin",
  dosageAmount: 10,
  dosageUnit: "mg",
  status: "paused",
  frequencyLabel: "once-daily",
  slots: [slot("09:00")],
});
// Archived rows arrive from their own query, not from the live list, and keep a normal status.
const retired = med({ id: "med-3", name: "Ibuprofen", archivedAt: new Date() });

function run(query: string, status: MedicationStatusFilter = "all") {
  return filterMedications([metformin, atorvastatin], [retired], { query, status });
}

describe("filterMedications", () => {
  it("returns every row unfiltered", () => {
    const result = run("");
    expect(result.active).toEqual([metformin]);
    expect(result.paused).toEqual([atorvastatin]);
    expect(result.archived).toEqual([retired]);
    expect(result.filteredOut).toBe(false);
  });

  it("matches on name, case-insensitively", () => {
    expect(run("metfor").active).toEqual([metformin]);
    expect(run("ATORVA").paused).toEqual([atorvastatin]);
  });

  it("matches on dosage and unit so '500' and 'mg' both find a row", () => {
    expect(run("500").active).toEqual([metformin]);
    expect(run("10").paused).toEqual([atorvastatin]);
    expect(run("mg").active).toHaveLength(1);
  });

  it("matches on a schedule time", () => {
    const result = run("09:00");
    expect(result.paused).toEqual([atorvastatin]);
    expect(result.active).toEqual([]);
  });

  it("keeps archived rows out of the live buckets", () => {
    const result = run("ibuprofen");
    expect(result.active).toEqual([]);
    expect(result.paused).toEqual([]);
    expect(result.archived).toEqual([retired]);
  });

  it("restricts to a single status on request", () => {
    expect(run("", "active").paused).toEqual([]);
    expect(run("", "active").archived).toEqual([]);
    expect(run("", "paused").active).toEqual([]);
    expect(run("", "archived").active).toEqual([]);
    expect(run("", "archived").paused).toEqual([]);
    expect(run("", "archived").archived).toEqual([retired]);
  });

  it("reports filteredOut only when rows exist but none match", () => {
    expect(run("zzz").filteredOut).toBe(true);
    expect(run("", "paused").filteredOut).toBe(false);
    expect(filterMedications([], [], { query: "anything", status: "all" }).filteredOut).toBe(false);
  });

  it("ignores surrounding whitespace in the query", () => {
    expect(run("   metformin   ").active).toEqual([metformin]);
  });
});

describe("medication display helpers", () => {
  it("renders slot times as a 24h list", () => {
    expect(slotTimeLine(metformin.slots)).toBe("08:00 · 20:00");
    expect(slotTimeLine([])).toBe("No times");
  });

  it("collapses the full week to a single label", () => {
    expect(daysLabel([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(daysLabel([1, 3, 5])).toBe("Mon · Wed · Fri");
    expect(daysLabel([])).toBe("No days");
  });
});
