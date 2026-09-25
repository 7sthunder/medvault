import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { MedicationRecord, ScheduleSlotRecord } from "@/server/domain/medications/mapper";
import * as repo from "@/server/domain/medications/repo";
import { appRouter } from "../root";

vi.mock("@/server/domain/medications/repo");

describe("Phase 11 — Medication tRPC router", () => {
  const dummyDb = {} as never;
  const user = {
    id: "user-123",
    email: "test@medvault.test",
    name: "Test User",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const session = {
    id: "sess-1",
    userId: user.id,
    expiresAt: new Date(Date.now() + 86400000),
    token: "token",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleMedRecord: MedicationRecord = {
    id: "med-1",
    userId: user.id,
    name: "Metformin",
    dosageAmount: "500",
    dosageUnit: "mg",
    instructions: "Take with food",
    notes: "Evening dose",
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
    dosageAmount: "500",
    instructionOverride: null,
    enabled: true,
    createdAt: new Date("2026-01-01T08:00:00Z"),
    updatedAt: new Date("2026-01-01T08:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests with UNAUTHORIZED", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    await expect(unauthedCaller.medication.list()).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." }),
    );
  });

  it("handles medication.create procedure with valid payload and schedules", async () => {
    vi.mocked(repo.findActiveByName).mockResolvedValue(null);
    vi.mocked(repo.insertMedication).mockResolvedValue(sampleMedRecord);
    vi.mocked(repo.insertScheduleSlots).mockResolvedValue([sampleSlotRecord]);

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.medication.create({
      name: "Metformin",
      dosageAmount: 500,
      dosageUnit: "mg",
      startDate: "2026-01-01",
      reminderBeforeMinutes: 10,
      slots: [
        {
          timeOfDay: "08:00",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          enabled: true,
        },
      ],
    });

    expect(res.id).toBe("med-1");
    expect(res.name).toBe("Metformin");
    expect(res.dosageAmount).toBe(500);
    expect(res.frequencyLabel).toBe("once-daily");
  });

  it("handles medication.list procedure", async () => {
    vi.mocked(repo.listMedications).mockResolvedValue([
      {
        medication: sampleMedRecord,
        slots: [sampleSlotRecord],
      },
    ]);

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.medication.list();
    expect(res).toHaveLength(1);
    expect(res[0]?.name).toBe("Metformin");
  });

  it("handles medication.get procedure", async () => {
    vi.mocked(repo.getMedicationById).mockResolvedValue({
      medication: sampleMedRecord,
      slots: [sampleSlotRecord],
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.medication.get({ id: "med-1" });
    expect(res.id).toBe("med-1");
    expect(res.slots).toHaveLength(1);
  });

  it("handles medication.update procedure", async () => {
    vi.mocked(repo.getMedicationById).mockResolvedValue({
      medication: sampleMedRecord,
      slots: [sampleSlotRecord],
    });
    vi.mocked(repo.findActiveByName).mockResolvedValue(null);
    vi.mocked(repo.updateMedicationRecord).mockResolvedValue({
      ...sampleMedRecord,
      name: "Metformin ER",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.medication.update({
      id: "med-1",
      name: "Metformin ER",
    });

    expect(res.name).toBe("Metformin ER");
  });

  it("handles medication.setStatus procedure", async () => {
    vi.mocked(repo.getMedicationById).mockResolvedValue({
      medication: sampleMedRecord,
      slots: [sampleSlotRecord],
    });
    vi.mocked(repo.setStatusRecord).mockResolvedValue({
      ...sampleMedRecord,
      status: "paused",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.medication.setStatus({
      id: "med-1",
      status: "paused",
    });

    expect(res.status).toBe("paused");
  });

  it("handles medication.archive and unarchive procedures", async () => {
    vi.mocked(repo.getMedicationById).mockResolvedValue({
      medication: sampleMedRecord,
      slots: [sampleSlotRecord],
    });
    vi.mocked(repo.archiveMedicationRecord).mockResolvedValue({
      ...sampleMedRecord,
      archivedAt: new Date(),
      status: "paused",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const archived = await caller.medication.archive({ id: "med-1" });
    expect(archived.status).toBe("paused");
    expect(archived.archivedAt).not.toBeNull();

    vi.mocked(repo.findActiveByName).mockResolvedValue(null);
    vi.mocked(repo.unarchiveMedicationRecord).mockResolvedValue({
      ...sampleMedRecord,
      archivedAt: null,
      status: "active",
    });

    const unarchived = await caller.medication.unarchive({ id: "med-1" });
    expect(unarchived.status).toBe("active");
    expect(unarchived.archivedAt).toBeNull();
  });
});
