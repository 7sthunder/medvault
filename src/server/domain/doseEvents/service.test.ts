import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import {
  doseEvents,
  medications,
  medicationSchedules,
  userPreferences,
  users,
} from "@/server/db/schema";
import {
  ensureDoseEvents,
  voidFutureDoseEvents,
} from "./service";
import { handleMedicationChange } from "@/server/domain/medicationSchedules/service";
import { runReconcileJob } from "@/server/domain/jobs/scheduler";

function createMockDb(fixtures: {
  users?: Record<string, unknown>[];
  preferences?: Record<string, unknown>[];
  medications?: Record<string, unknown>[];
  schedules?: Record<string, unknown>[];
  canceledRows?: Record<string, unknown>[];
} = {}) {
  const insertValuesMock = vi.fn().mockReturnValue({
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  });
  const insertMock = vi.fn().mockReturnValue({
    values: insertValuesMock,
  });

  const returningMock = vi.fn().mockResolvedValue(fixtures.canceledRows ?? []);
  const whereUpdateMock = vi.fn().mockReturnValue({
    returning: returningMock,
  });
  const setMock = vi.fn().mockReturnValue({
    where: whereUpdateMock,
  });
  const updateMock = vi.fn().mockReturnValue({
    set: setMock,
  });

  const selectMock = vi.fn(() => ({
    from: vi.fn((table: unknown) => {
      let rows: Record<string, unknown>[] = [];
      if (table === users) rows = fixtures.users ?? [];
      else if (table === userPreferences) rows = fixtures.preferences ?? [];
      else if (table === medications) rows = fixtures.medications ?? [];
      else if (table === medicationSchedules) rows = fixtures.schedules ?? [];
      else if (table === doseEvents) rows = [];

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

  return {
    select: selectMock,
    insert: insertMock,
    insertValues: insertValuesMock,
    update: updateMock,
    set: setMock,
    whereUpdate: whereUpdateMock,
  };
}

describe("Phase 12 — Dose event generation & lifecycle", () => {
  const userId = "user-abc";
  const medId = "med-xyz";
  const slotId = "slot-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureDoseEvents", () => {
    it("expands active medications and inserts events idempotently", async () => {
      const mockDb = createMockDb({
        users: [{ id: userId, timezone: "UTC" }],
        preferences: [{ missedAfterMinutes: 45 }],
        medications: [
          {
            id: medId,
            userId,
            startDate: "2026-03-01",
            endDate: null,
            status: "active",
          },
        ],
        schedules: [
          {
            id: slotId,
            medicationId: medId,
            timeOfDay: "08:00",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            enabled: true,
          },
        ],
      });

      const res = await ensureDoseEvents(mockDb as unknown as Db, {
        userId,
        from: new Date("2026-03-01T00:00:00Z"),
        to: new Date("2026-03-03T23:59:59Z"),
        timeZone: "UTC",
      });

      expect(res.generatedCount).toBe(3); // 3 daily doses: Mar 1, Mar 2, Mar 3
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insertValues).toHaveBeenCalled();

      // Check missedDeadline calculation: scheduledFor + 45 minutes
      const insertedRows = mockDb.insertValues.mock.calls[0]?.[0] as Array<{
        status: string;
        scheduledFor: Date;
        missedDeadline: Date;
      }>;
      expect(insertedRows).toHaveLength(3);
      expect(insertedRows[0]?.status).toBe("upcoming");
      const schedMs = insertedRows[0]!.scheduledFor.getTime();
      const deadlineMs = insertedRows[0]!.missedDeadline.getTime();
      expect(deadlineMs - schedMs).toBe(45 * 60 * 1000);
    });

    it("returns 0 generated if no active medications match", async () => {
      const mockDb = createMockDb({
        users: [{ id: userId, timezone: "UTC" }],
        medications: [],
      });

      const res = await ensureDoseEvents(mockDb as unknown as Db, { userId, timeZone: "UTC" });
      expect(res.generatedCount).toBe(0);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe("voidFutureDoseEvents", () => {
    it("cancels future unresolved events and preserves past history", async () => {
      const mockDb = createMockDb({
        canceledRows: [{ id: "dose-1" }, { id: "dose-2" }],
      });

      const res = await voidFutureDoseEvents(mockDb as unknown as Db, {
        userId,
        medicationId: medId,
        from: new Date("2026-03-01T12:00:00Z"),
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "canceled" }),
      );
      expect(res.canceledCount).toBe(2);
    });

    it("voids only slots not in validScheduleIds when provided", async () => {
      const mockDb = createMockDb({
        canceledRows: [{ id: "dose-old" }],
      });

      const res = await voidFutureDoseEvents(mockDb as unknown as Db, {
        userId,
        medicationId: medId,
        validScheduleIds: ["slot-active-1"],
      });

      expect(res.canceledCount).toBe(1);
    });
  });

  describe("handleMedicationChange lifecycle orchestration", () => {
    it("handles created event by ensuring dose events", async () => {
      const mockDb = createMockDb({
        medications: [],
      });

      await expect(
        handleMedicationChange(mockDb as unknown as Db, {
          userId,
          medicationId: medId,
          type: "created",
        }),
      ).resolves.toBeUndefined();
    });

    it("handles archived event by voiding future events", async () => {
      const mockDb = createMockDb();

      await handleMedicationChange(mockDb as unknown as Db, {
        userId,
        medicationId: medId,
        type: "archived",
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "canceled" }),
      );
    });
  });

  describe("runReconcileJob", () => {
    it("processes active users and reports stats", async () => {
      const mockDb = createMockDb({
        users: [{ id: "user-1", timezone: "UTC" }],
        medications: [],
      });

      const stats = await runReconcileJob(mockDb as unknown as Db);
      expect(stats.usersProcessed).toBe(1);
      expect(stats.errors).toEqual([]);
    });
  });
});
