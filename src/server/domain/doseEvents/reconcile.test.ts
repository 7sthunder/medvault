import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import { registerMissedDoseHandlers, type MissedDoseContext } from "./attachments";
import { reconcileDoseStatuses } from "./reconcile";

describe("Phase 13 — Missed-dose scanner & reconciliation", () => {
  const userId = "user-123";
  const medId = "med-xyz";
  const doseId = "dose-expired";

  const expiredDose = {
    id: doseId,
    userId,
    medicationId: medId,
    scheduleId: "slot-1",
    scheduledFor: new Date("2026-03-01T08:00:00Z"),
    status: "due",
    missedDeadline: new Date("2026-03-01T08:30:00Z"), // 08:30 was deadline
    takenAt: null,
    skippedAt: null,
    snoozeCount: 0,
    snoozeUntil: null,
    statusUpdatedAt: new Date("2026-03-01T08:00:00Z"),
    source: "generated",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects expired doses, marks them missed, audits missed_auto, and triggers hook seam", async () => {
    const missedDose = {
      ...expiredDose,
      status: "missed",
    };

    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    const insertMock = vi.fn().mockReturnValue({ values: insertValuesMock });

    // Mock missed updates returning updated row
    const returningMock = vi.fn().mockResolvedValue([missedDose]);
    const whereUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereUpdateMock });
    const updateMock = vi.fn().mockReturnValue({ set: setMock });

    // Mock select query finding expired dose
    const selectMock = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([expiredDose]),
      })),
    }));

    const mockDb = {
      select: selectMock,
      update: updateMock,
      insert: insertMock,
    };

    const capturedEvents: MissedDoseContext[] = [];
    registerMissedDoseHandlers((ctx) => {
      capturedEvents.push(ctx);
    });

    const nowTime = new Date("2026-03-01T08:45:00Z"); // 15 mins past deadline

    const res = await reconcileDoseStatuses(mockDb as unknown as Db, {
      userId,
      now: nowTime,
    });

    expect(mockDb.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "missed" }),
    );
    expect(mockDb.insert).toHaveBeenCalled();
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        doseEventId: doseId,
        action: "missed_auto",
      }),
    );
    expect(res.autoMissedCount).toBe(1);

    // Seam check: registered handler received event
    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0]?.doseEventId).toBe(doseId);
    expect(capturedEvents[0]?.medicationId).toBe(medId);
  });
});
