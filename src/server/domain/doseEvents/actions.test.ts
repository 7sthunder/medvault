import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { Db } from "@/server/db/helpers";
import {
  doseEvents,
  medications,
  userPreferences,
} from "@/server/db/schema";
import { skipDose, snoozeDose, takeDose } from "./actions";

function createMockDb(fixtures: {
  doses?: Record<string, unknown>[];
  medications?: Record<string, unknown>[];
  preferences?: Record<string, unknown>[];
  updatedDoses?: Record<string, unknown>[];
} = {}) {
  const insertValuesMock = vi.fn().mockResolvedValue(undefined);
  const insertMock = vi.fn().mockReturnValue({ values: insertValuesMock });

  const returningMock = vi.fn().mockResolvedValue(fixtures.updatedDoses ?? []);
  const whereUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
  const setMock = vi.fn().mockReturnValue({ where: whereUpdateMock });
  const updateMock = vi.fn().mockReturnValue({ set: setMock });

  const selectMock = vi.fn(() => ({
    from: vi.fn((table: unknown) => {
      let rows: Record<string, unknown>[] = [];
      if (table === doseEvents) rows = fixtures.doses ?? [];
      else if (table === medications) rows = fixtures.medications ?? [];
      else if (table === userPreferences) rows = fixtures.preferences ?? [];

      const queryPromise = Promise.resolve(rows);
      return {
        where: vi.fn(() =>
          Object.assign(queryPromise, {
            limit: vi.fn().mockResolvedValue(rows),
          }),
        ),
      };
    }),
  }));

  const dbObj = {
    select: selectMock,
    insert: insertMock,
    insertValues: insertValuesMock,
    update: updateMock,
    set: setMock,
    whereUpdate: whereUpdateMock,
    transaction: vi.fn(),
  };

  dbObj.transaction = vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(dbObj));
  return dbObj;
}

describe("Phase 13 — User dose actions (take, snooze, skip)", () => {
  const userId = "user-123";
  const doseId = "dose-abc";
  const medId = "med-xyz";

  const sampleMed = {
    id: medId,
    name: "Metformin",
    dosageAmount: 500,
    dosageUnit: "mg",
    color: "#10b981",
    archivedAt: null,
  };

  const sampleDose = {
    id: doseId,
    userId,
    medicationId: medId,
    scheduleId: "slot-1",
    scheduledFor: new Date("2026-03-01T08:00:00Z"),
    status: "due",
    missedDeadline: new Date("2026-03-01T08:30:00Z"),
    takenAt: null,
    skippedAt: null,
    skippedReason: null,
    snoozeCount: 0,
    snoozeUntil: null,
    statusUpdatedAt: new Date("2026-03-01T08:00:00Z"),
    source: "generated",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("takeDose", () => {
    it("atomically marks dose as taken and logs audit record", async () => {
      const takenDose = {
        ...sampleDose,
        status: "taken",
        takenAt: new Date("2026-03-01T08:05:00Z"),
      };

      const mockDb = createMockDb({
        doses: [sampleDose],
        medications: [sampleMed],
        updatedDoses: [takenDose],
      });

      const res = await takeDose(mockDb as unknown as Db, userId, doseId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "taken" }),
      );
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          doseEventId: doseId,
          action: "take",
        }),
      );
      expect(res.status).toBe("taken");
      expect(res.takenAt).not.toBeNull();
    });

    it("rejects when dose is already taken", async () => {
      const alreadyTaken = { ...sampleDose, status: "taken" };
      const mockDb = createMockDb({
        doses: [alreadyTaken],
        updatedDoses: [], // 0 rows updated
      });

      await expect(takeDose(mockDb as unknown as Db, userId, doseId)).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Dose has already been taken.",
        }),
      );
    });

    it("allows taking late/missed dose per plan §10.3 rule 4", async () => {
      const missedDose = { ...sampleDose, status: "missed" };
      const takenLateDose = { ...missedDose, status: "taken", takenAt: new Date() };

      const mockDb = createMockDb({
        doses: [missedDose],
        medications: [sampleMed],
        updatedDoses: [takenLateDose],
      });

      const res = await takeDose(mockDb as unknown as Db, userId, doseId);
      expect(res.status).toBe("taken");
    });
  });

  describe("snoozeDose", () => {
    it("delays dose by snoozeMinutes and logs audit record", async () => {
      const snoozedDose = {
        ...sampleDose,
        status: "snoozed",
        snoozeCount: 1,
        snoozeUntil: new Date("2026-03-01T08:15:00Z"),
      };

      const mockDb = createMockDb({
        doses: [sampleDose],
        preferences: [{ snoozeMinutes: 15, maxSnoozes: 3, missedAfterMinutes: 30 }],
        medications: [sampleMed],
        updatedDoses: [snoozedDose],
      });

      const res = await snoozeDose(mockDb as unknown as Db, userId, doseId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "snoozed",
          snoozeCount: 1,
        }),
      );
      expect(mockDb.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "snooze",
        }),
      );
      expect(res.status).toBe("snoozed");
      expect(res.snoozeCount).toBe(1);
    });

    it("rejects snoozing when maxSnoozes limit is reached", async () => {
      const maxedDose = { ...sampleDose, snoozeCount: 3 };
      const mockDb = createMockDb({
        doses: [maxedDose],
        preferences: [{ snoozeMinutes: 10, maxSnoozes: 3 }],
      });

      await expect(snoozeDose(mockDb as unknown as Db, userId, doseId)).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum snoozes reached (3).",
        }),
      );
    });
  });

  describe("skipDose", () => {
    it("marks dose as skipped with reason and logs audit record", async () => {
      const skippedDose = {
        ...sampleDose,
        status: "skipped",
        skippedReason: "Feeling nauseous",
      };

      const mockDb = createMockDb({
        doses: [sampleDose],
        medications: [sampleMed],
        updatedDoses: [skippedDose],
      });

      const res = await skipDose(mockDb as unknown as Db, userId, doseId, "Feeling nauseous");

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "skipped",
          skippedReason: "Feeling nauseous",
        }),
      );
      expect(mockDb.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "skip",
        }),
      );
      expect(res.status).toBe("skipped");
      expect(res.skippedReason).toBe("Feeling nauseous");
    });

    it("rejects skipping already missed dose per grill-me decision", async () => {
      const missedDose = { ...sampleDose, status: "missed" };
      const mockDb = createMockDb({
        doses: [missedDose],
        updatedDoses: [], // 0 rows updated
      });

      await expect(skipDose(mockDb as unknown as Db, userId, doseId)).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot skip a dose that is already marked as missed.",
        }),
      );
    });
  });
});
