import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import {
  cancelAppointment,
  createAppointment,
  listAppointments,
} from "./service";

vi.mock("@/server/domain/notifications/service", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

describe("Appointments Domain Service", () => {
  const patientUserId = "patient-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an appointment directly for patient", async () => {
    const mockDb = {
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([{ name: "John Doe" }]),
          })),
        })),
      })),
    } as unknown as Db;

    const aptDate = new Date("2026-10-15T10:00:00Z");
    const result = await createAppointment(mockDb, patientUserId, {
      doctorName: "Dr. Smith",
      specialty: "Cardiology",
      clinicName: "Metro Heart Clinic",
      appointmentDate: aptDate,
      notes: "Follow-up checkup",
      reminderEnabled: true,
    });

    expect(result.doctorName).toBe("Dr. Smith");
    expect(result.patientUserId).toBe(patientUserId);
    expect(result.createdByUserId).toBe(patientUserId);
    expect(result.status).toBe("scheduled");
  });

  it("lists upcoming appointments for a patient", async () => {
    const aptDate = new Date("2026-10-15T10:00:00Z");
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue([
                {
                  appointment: {
                    id: "apt-1",
                    patientUserId,
                    createdByUserId: patientUserId,
                    doctorName: "Dr. Smith",
                    specialty: "Cardiology",
                    clinicName: "Metro Heart Clinic",
                    appointmentDate: aptDate,
                    notes: "Checkup",
                    status: "scheduled",
                    reminderEnabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  patientName: "John Doe",
                },
              ]),
            })),
          })),
        })),
      })),
    } as unknown as Db;

    const list = await listAppointments(mockDb, patientUserId);
    expect(list).toHaveLength(1);
    expect(list[0]?.doctorName).toBe("Dr. Smith");
    expect(list[0]?.patientName).toBe("John Doe");
  });

  it("cancels an appointment", async () => {
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: "apt-1",
                patientUserId,
              },
            ]),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      })),
    } as unknown as Db;

    const res = await cancelAppointment(mockDb, patientUserId, "apt-1");
    expect(res.success).toBe(true);
  });
});
