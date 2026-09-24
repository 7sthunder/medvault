import { describe, expect, it } from "vitest";

import type { medications, medicationSchedules } from "@/server/db/schema";
import { frequencyLabelOf, toMedicationDTO, toMedicationLite, toScheduleSlotDTO } from "./mapper";

type SlotRow = typeof medicationSchedules.$inferSelect;
type MedRow = typeof medications.$inferSelect;

function slot(overrides: Partial<SlotRow> = {}): SlotRow {
  return {
    id: "slot-1",
    medicationId: "med-1",
    timeOfDay: "08:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    dosageAmount: "500",
    instructionOverride: null,
    enabled: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function med(overrides: Partial<MedRow> = {}): MedRow {
  return {
    id: "med-1",
    userId: "user-1",
    name: "Metformin",
    dosageAmount: "500",
    dosageUnit: "mg",
    instructions: null,
    notes: null,
    status: "active",
    startDate: "2026-01-01",
    endDate: null,
    color: "#10b981",
    remindersEnabled: true,
    archivedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("frequencyLabelOf (§8.4)", () => {
  it("1 enabled full-week slot → once-daily", () => {
    expect(frequencyLabelOf([slot()])).toBe("once-daily");
  });

  it("2 enabled full-week slots → twice-daily", () => {
    expect(frequencyLabelOf([slot({ timeOfDay: "08:00" }), slot({ id: "slot-2", timeOfDay: "20:00" })])).toBe(
      "twice-daily",
    );
  });

  it("3+ enabled full-week slots → n-times-daily", () => {
    const rows = ["08:00", "12:00", "20:00"].map((t, i) => slot({ id: `slot-${i}`, timeOfDay: t }));
    expect(frequencyLabelOf(rows)).toBe("n-times-daily");
  });

  it("non-full week → custom-weekdays", () => {
    expect(frequencyLabelOf([slot({ daysOfWeek: [1, 3, 5] })])).toBe("custom-weekdays");
  });

  it("mixed day sets → custom-weekdays", () => {
    expect(
      frequencyLabelOf([
        slot({ daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }),
        slot({ id: "slot-2", timeOfDay: "20:00", daysOfWeek: [1, 3] }),
      ]),
    ).toBe("custom-weekdays");
  });

  it("disabled slots are ignored", () => {
    expect(frequencyLabelOf([slot({ enabled: false }), slot({ id: "slot-2", timeOfDay: "20:00", enabled: false })])).toBe(
      "custom-weekdays",
    );
  });
});

describe("mappers", () => {
  it("toMedicationDTO casts numeric dosage to a number and sorts slots by time", () => {
    const dto = toMedicationDTO(med(), [slot({ id: "s2", timeOfDay: "20:00" }), slot({ id: "s1", timeOfDay: "06:00" })]);
    expect(dto.dosageAmount).toBe(500);
    expect(dto.slots.map((s) => s.timeOfDay)).toEqual(["06:00", "20:00"]);
    expect(dto.nextDoseAt).toBeNull();
    expect(dto.adherencePercent).toBeNull();
  });

  it("toMedicationDTO honours extras", () => {
    const dto = toMedicationDTO(med(), [slot()], { nextDoseAt: new Date("2026-01-02T08:00:00Z"), adherencePercent: 90.4 });
    expect(dto.nextDoseAt).toEqual(new Date("2026-01-02T08:00:00Z"));
    expect(dto.adherencePercent).toBe(90.4);
  });

  it("toScheduleSlotDTO casts numeric dosage and passes through nulls", () => {
    const dto = toScheduleSlotDTO(slot({ dosageAmount: null, instructionOverride: "Take with food" }));
    expect(dto.dosageAmount).toBeNull();
    expect(dto.instructionOverride).toBe("Take with food");
    expect(dto.enabled).toBe(true);
  });

  it("toMedicationLite casts dosage to number", () => {
    expect(toMedicationLite(med()).dosageAmount).toBe(500);
    expect(toMedicationLite(med({ archivedAt: new Date() })).archivedAt).not.toBeNull();
  });
});