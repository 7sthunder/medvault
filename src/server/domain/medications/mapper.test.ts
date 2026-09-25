import { describe, expect, it } from "vitest";
import type { MedicationRecord, ScheduleSlotRecord } from "./mapper";
import { toMedicationDTO, toMedicationLite, toScheduleSlotDTO } from "./mapper";

describe("Phase 11 — Medication DTO mappers", () => {
  const baseSlotRecord: ScheduleSlotRecord = {
    id: "slot-1",
    medicationId: "med-1",
    timeOfDay: "08:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    dosageAmount: "250.50",
    instructionOverride: "With breakfast",
    enabled: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const baseMedRecord: MedicationRecord = {
    id: "med-1",
    userId: "user-1",
    name: "Amoxicillin",
    dosageAmount: "500",
    dosageUnit: "mg",
    instructions: "Take with food",
    notes: "For sinus infection",
    status: "active",
    startDate: "2026-03-01",
    endDate: "2026-03-10",
    color: "#10b981",
    remindersEnabled: true,
    archivedAt: null,
    createdAt: new Date("2026-03-01T08:00:00Z"),
    updatedAt: new Date("2026-03-01T08:00:00Z"),
  };

  describe("toScheduleSlotDTO", () => {
    it("converts raw schedule slot row into ScheduleSlotDTO with numeric dosage", () => {
      const dto = toScheduleSlotDTO(baseSlotRecord);
      expect(dto).toEqual({
        id: "slot-1",
        medicationId: "med-1",
        timeOfDay: "08:00",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        dosageAmount: 250.5,
        instructionOverride: "With breakfast",
        enabled: true,
      });
    });

    it("handles nullish dosageAmount and instructionOverride", () => {
      const dto = toScheduleSlotDTO({
        ...baseSlotRecord,
        dosageAmount: null,
        instructionOverride: null,
        daysOfWeek: [1, 3, 5],
      });
      expect(dto.dosageAmount).toBeNull();
      expect(dto.instructionOverride).toBeNull();
      expect(dto.daysOfWeek).toEqual([1, 3, 5]);
    });
  });

  describe("toMedicationDTO", () => {
    it("converts medication row and sorts slots by timeOfDay ascending", () => {
      const eveningSlot: ScheduleSlotRecord = {
        ...baseSlotRecord,
        id: "slot-2",
        timeOfDay: "20:00",
      };
      const morningSlot: ScheduleSlotRecord = {
        ...baseSlotRecord,
        id: "slot-1",
        timeOfDay: "08:00",
      };

      const dto = toMedicationDTO(baseMedRecord, [eveningSlot, morningSlot]);

      expect(dto.id).toBe("med-1");
      expect(dto.name).toBe("Amoxicillin");
      expect(dto.dosageAmount).toBe(500);
      expect(dto.dosageUnit).toBe("mg");
      expect(dto.status).toBe("active");
      expect(dto.startDate).toBe("2026-03-01");
      expect(dto.endDate).toBe("2026-03-10");
      expect(dto.color).toBe("#10b981");
      expect(dto.remindersEnabled).toBe(true);
      expect(dto.archivedAt).toBeNull();

      // Slots are sorted: 08:00 before 20:00
      expect(dto.slots).toHaveLength(2);
      expect(dto.slots[0]?.timeOfDay).toBe("08:00");
      expect(dto.slots[1]?.timeOfDay).toBe("20:00");

      // Frequency derived as twice-daily
      expect(dto.frequencyLabel).toBe("twice-daily");
      expect(dto.nextDoseAt).toBeNull();
      expect(dto.adherencePercent).toBeNull();
    });

    it("attaches optional extra stats when provided", () => {
      const nextDose = new Date("2026-03-02T08:00:00Z");
      const dto = toMedicationDTO(baseMedRecord, [baseSlotRecord], {
        nextDoseAt: nextDose,
        adherencePercent: 95.5,
      });

      expect(dto.nextDoseAt).toEqual(nextDose);
      expect(dto.adherencePercent).toBe(95.5);
      expect(dto.frequencyLabel).toBe("once-daily");
    });
  });

  describe("toMedicationLite", () => {
    it("extracts concise snapshot fields", () => {
      const lite = toMedicationLite(baseMedRecord);
      expect(lite).toEqual({
        id: "med-1",
        name: "Amoxicillin",
        dosageAmount: 500,
        dosageUnit: "mg",
        color: "#10b981",
        archivedAt: null,
      });
    });
  });
});
