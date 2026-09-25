import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as caregiverService from "@/server/domain/caregiver/service";
import { appRouter } from "../root";

vi.mock("@/server/domain/caregiver/service");

describe("Phase 21 — Caregiver tRPC Router", () => {
  const dummyDb = {} as never;

  const user = {
    id: "user-123",
    email: "user@medvault.test",
    name: "Primary User",
    timezone: "UTC",
    emailVerified: true,
    image: null,
    onboardingCompleted: true,
    isDemo: false,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated calls with UNAUTHORIZED for protected procedures", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    await expect(
      unauthedCaller.caregiver.invite({
        email: "caregiver@medvault.test",
        relationType: "family",
        permissions: {
          viewAdherence: true,
          viewMedications: false,
          receiveMissedDoseAlerts: true,
          receiveInsights: false,
          canAcknowledgeAlerts: true,
        },
      }),
    ).rejects.toThrow(TRPCError);

    await expect(unauthedCaller.caregiver.listCaregivers()).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.caregiver.listPatients()).rejects.toThrow(TRPCError);
  });

  it("allows unauthenticated callers to view invitation details (publicProcedure)", async () => {
    vi.mocked(caregiverService.getInvitationByToken).mockResolvedValue({
      id: "inv-1",
      patientUserId: "p-1",
      patientName: "Jane Patient",
      patientEmail: "patient@medvault.test",
      email: "invitee@medvault.test",
      relationType: "family",
      permissions: {
        viewAdherence: true,
        viewMedications: false,
        receiveMissedDoseAlerts: true,
        receiveInsights: false,
        canAcknowledgeAlerts: true,
      },
      message: "Please monitor me",
      status: "pending",
      expiresAt: new Date(),
    });

    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const inv = await unauthedCaller.caregiver.getInvitation({ token: "test-token" });
    expect(inv.patientName).toBe("Jane Patient");
    expect(caregiverService.getInvitationByToken).toHaveBeenCalledWith(dummyDb, "test-token");
  });

  it("executes invite caregiver mutation for authenticated patient", async () => {
    vi.mocked(caregiverService.inviteCaregiver).mockResolvedValue({
      id: "inv-1",
      email: "caregiver@medvault.test",
      message: null,
      status: "pending",
      expiresAt: new Date(),
      createdAt: new Date(),
      token: "secret-token",
      inviteUrl: "/caregiver/accept?token=secret-token",
    });

    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const result = await authedCaller.caregiver.invite({
      email: "caregiver@medvault.test",
      relationType: "family",
      permissions: {
        viewAdherence: true,
        viewMedications: false,
        receiveMissedDoseAlerts: true,
        receiveInsights: false,
        canAcknowledgeAlerts: true,
      },
    });

    expect(result.token).toBe("secret-token");
    expect(caregiverService.inviteCaregiver).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      expect.objectContaining({ email: "caregiver@medvault.test" }),
    );
  });

  it("executes accept invitation mutation for authenticated caregiver", async () => {
    vi.mocked(caregiverService.acceptInvitation).mockResolvedValue({
      id: "rel-1",
      patientUserId: "p-1",
      caregiverUserId: user.id,
      patientName: "Jane Patient",
      caregiverName: user.name,
      status: "active",
      relationType: "family",
      permissions: {
        viewAdherence: true,
        viewMedications: false,
        receiveMissedDoseAlerts: true,
        receiveInsights: false,
        canAcknowledgeAlerts: true,
      },
      acceptedAt: new Date(),
      createdAt: new Date(),
    });

    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const rel = await authedCaller.caregiver.acceptInvitation({ token: "valid-token" });
    expect(rel.status).toBe("active");
    expect(caregiverService.acceptInvitation).toHaveBeenCalledWith(dummyDb, user.id, "valid-token");
  });

  it("updates alert status (acknowledge / resolve)", async () => {
    vi.mocked(caregiverService.updateAlertStatus).mockResolvedValue({
      id: "0195e263-8a90-7000-8000-000000000001",
      type: "missed_dose",
      title: "Missed dose",
      body: "Patient missed dose",
      status: "acknowledged",
      createdAt: new Date(),
      resolvedAt: null,
      patientName: "Jane Patient",
      medicationName: null,
      scheduledFor: null,
      doseEventId: null,
    });

    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const result = await authedCaller.caregiver.updateAlert({
      alertId: "0195e263-8a90-7000-8000-000000000001",
      action: "acknowledge",
    });

    expect(result.status).toBe("acknowledged");
    expect(caregiverService.updateAlertStatus).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      "0195e263-8a90-7000-8000-000000000001",
      "acknowledge",
    );
  });
});
