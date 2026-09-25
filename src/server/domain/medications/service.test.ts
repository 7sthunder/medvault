import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { MedicationRecord, ScheduleSlotRecord } from "./mapper";
import * as repo from "./repo";
import {
  archiveMedication,
  clearMedicationChangeHandlers,
  createMedication,
  getMedication,
  listMedications,
  registerMedicationChangeHandler,
  setMedicationStatus,
  unarchiveMedication,
  updateMedication,
  type MedicationChangeEvent,
} from "./service";

vi.mock("./repo");

describe("Phase 11 — Medication domain service", () => {
  const dummyDb = {} as never;
  const userId = "user-123";

  const sampleMedRecord: MedicationRecord = {
    id: "med-1",
    userId,
    name: "Lisinopril",
    dosageAmount: "10",
    dosageUnit: "mg",
    instructions: "Once in morning",
    notes: "For blood pressure",
    status: "active",
    startDate: "2026-01-01",
    endDate: null,
    color: "#10b981",
    remindersEnabled: true,
    archivedAt: null,
    createdAt: new Date("2026-01-01T08:00:00Z"),
    updatedAt: new Date("2026-01-01T08:00:00Z"),
  };

  const sampleSlotRecord: ScheduleSlotRecord = {
    id: "slot-1",
    medicationId: "med-1",
    timeOfDay: "08:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    dosageAmount: "10",
    instructionOverride: null,
    enabled: true,
    createdAt: new Date("2026-01-01T08:00:00Z"),
    updatedAt: new Date("2026-01-01T08:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearMedicationChangeHandlers();
  });

  describe("createMedication", () => {
    it("creates a medication with default 08:00 slot when slots are omitted", async () => {
      vi.mocked(repo.findActiveByName).mockResolvedValue(null);
      vi.mocked(repo.insertMedication).mockResolvedValue(sampleMedRecord);
      vi.mocked(repo.insertScheduleSlots).mockResolvedValue([sampleSlotRecord]);

      const events: MedicationChangeEvent[] = [];
      registerMedicationChangeHandler((e) => {
        events.push(e);
      });

      const result = await createMedication(dummyDb, userId, {
        name: "Lisinopril",
        dosageAmount: 10,
        dosageUnit: "mg",
        startDate: "2026-01-01",
      });

      expect(repo.findActiveByName).toHaveBeenCalledWith(dummyDb, userId, "Lisinopril");
      expect(repo.insertMedication).toHaveBeenCalled();
      expect(repo.insertScheduleSlots).toHaveBeenCalled();

      // Check default slot was used
      const slotsArg = vi.mocked(repo.insertScheduleSlots).mock.calls[0]?.[1];
      expect(slotsArg).toHaveLength(1);
      expect(slotsArg?.[0]?.timeOfDay).toBe("08:00");
      expect(slotsArg?.[0]?.daysOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6]);

      expect(result.id).toBe("med-1");
      expect(result.name).toBe("Lisinopril");
      expect(result.frequencyLabel).toBe("once-daily");

      // Verify event seam was called
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("created");
      expect(events[0]?.userId).toBe(userId);
    });

    it("throws CONFLICT error if an active medication with the same name already exists", async () => {
      vi.mocked(repo.findActiveByName).mockResolvedValue(sampleMedRecord);

      await expect(
        createMedication(dummyDb, userId, {
          name: "  Lisinopril  ",
          dosageAmount: 20,
          dosageUnit: "mg",
          startDate: "2026-01-01",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "An active medication with this name already exists.",
        }),
      );

      expect(repo.insertMedication).not.toHaveBeenCalled();
    });
  });

  describe("getMedication", () => {
    it("returns medication DTO when found and owned by user", async () => {
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: sampleMedRecord,
        slots: [sampleSlotRecord],
      });

      const result = await getMedication(dummyDb, userId, "med-1");
      expect(result.id).toBe("med-1");
      expect(result.dosageAmount).toBe(10);
      expect(result.slots).toHaveLength(1);
    });

    it("throws NOT_FOUND when medication does not exist or user mismatch", async () => {
      vi.mocked(repo.getMedicationById).mockResolvedValue(null);

      await expect(getMedication(dummyDb, userId, "missing-id")).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Medication not found.",
        }),
      );
    });
  });

  describe("listMedications", () => {
    it("delegates to repo and maps to DTO list", async () => {
      vi.mocked(repo.listMedications).mockResolvedValue([
        {
          medication: sampleMedRecord,
          slots: [sampleSlotRecord],
        },
      ]);

      const result = await listMedications(dummyDb, userId, { includeArchived: false });
      expect(repo.listMedications).toHaveBeenCalledWith(dummyDb, userId, { includeArchived: false });
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Lisinopril");
    });
  });

  describe("updateMedication", () => {
    it("updates medication attributes and replaces slots when provided", async () => {
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: sampleMedRecord,
        slots: [sampleSlotRecord],
      });
      vi.mocked(repo.findActiveByName).mockResolvedValue(null);
      vi.mocked(repo.updateMedicationRecord).mockResolvedValue({
        ...sampleMedRecord,
        name: "Lisinopril Updated",
        dosageAmount: "20",
      });
      const newSlot: ScheduleSlotRecord = {
        ...sampleSlotRecord,
        timeOfDay: "09:00",
      };
      vi.mocked(repo.insertScheduleSlots).mockResolvedValue([newSlot]);

      const events: MedicationChangeEvent[] = [];
      registerMedicationChangeHandler((e) => {
        events.push(e);
      });

      const result = await updateMedication(dummyDb, userId, {
        id: "med-1",
        name: "Lisinopril Updated",
        dosageAmount: 20,
        slots: [
          {
            timeOfDay: "09:00",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            enabled: true,
          },
        ],
      });

      expect(repo.deleteScheduleSlots).toHaveBeenCalledWith(expect.anything(), "med-1");
      expect(repo.insertScheduleSlots).toHaveBeenCalled();
      expect(result.name).toBe("Lisinopril Updated");
      expect(result.dosageAmount).toBe(20);

      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("updated");
    });

    it("throws CONFLICT if renaming causes duplicate with another active medication", async () => {
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: sampleMedRecord,
        slots: [sampleSlotRecord],
      });
      vi.mocked(repo.findActiveByName).mockResolvedValue({
        ...sampleMedRecord,
        id: "other-med",
        name: "Metformin",
      });

      await expect(
        updateMedication(dummyDb, userId, {
          id: "med-1",
          name: "Metformin",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "An active medication with this name already exists.",
        }),
      );
    });
  });

  describe("setStatus", () => {
    it("sets status to paused and notifies handlers", async () => {
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: sampleMedRecord,
        slots: [sampleSlotRecord],
      });
      vi.mocked(repo.setStatusRecord).mockResolvedValue({
        ...sampleMedRecord,
        status: "paused",
      });

      const events: MedicationChangeEvent[] = [];
      registerMedicationChangeHandler((e) => {
        events.push(e);
      });

      const result = await setMedicationStatus(dummyDb, userId, "med-1", "paused");
      expect(result.status).toBe("paused");
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("status_changed");
    });
  });

  describe("archiveMedication & unarchiveMedication", () => {
    it("archives medication setting archivedAt and status to paused", async () => {
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: sampleMedRecord,
        slots: [sampleSlotRecord],
      });
      const now = new Date();
      vi.mocked(repo.archiveMedicationRecord).mockResolvedValue({
        ...sampleMedRecord,
        archivedAt: now,
        status: "paused",
      });

      const events: MedicationChangeEvent[] = [];
      registerMedicationChangeHandler((e) => {
        events.push(e);
      });

      const result = await archiveMedication(dummyDb, userId, "med-1");
      expect(result.status).toBe("paused");
      expect(result.archivedAt).toEqual(now);
      expect(events[0]?.type).toBe("archived");
    });

    it("unarchives medication setting archivedAt to null and status to active", async () => {
      const archivedRecord: MedicationRecord = {
        ...sampleMedRecord,
        archivedAt: new Date(),
        status: "paused",
      };
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: archivedRecord,
        slots: [sampleSlotRecord],
      });
      vi.mocked(repo.findActiveByName).mockResolvedValue(null);
      vi.mocked(repo.unarchiveMedicationRecord).mockResolvedValue({
        ...sampleMedRecord,
        archivedAt: null,
        status: "active",
      });

      const events: MedicationChangeEvent[] = [];
      registerMedicationChangeHandler((e) => {
        events.push(e);
      });

      const result = await unarchiveMedication(dummyDb, userId, "med-1");
      expect(result.status).toBe("active");
      expect(result.archivedAt).toBeNull();
      expect(events[0]?.type).toBe("unarchived");
    });

    it("prevents unarchiving if another active medication has the same name", async () => {
      const archivedRecord: MedicationRecord = {
        ...sampleMedRecord,
        archivedAt: new Date(),
        status: "paused",
      };
      vi.mocked(repo.getMedicationById).mockResolvedValue({
        medication: archivedRecord,
        slots: [sampleSlotRecord],
      });
      vi.mocked(repo.findActiveByName).mockResolvedValue({
        ...sampleMedRecord,
        id: "active-new-med",
      });

      await expect(unarchiveMedication(dummyDb, userId, "med-1")).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "An active medication with this name already exists.",
        }),
      );
    });
  });
});
