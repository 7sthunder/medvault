import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import {
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  doseEvents,
  medications,
  users,
} from "@/server/db/schema";
import * as adherenceService from "@/server/domain/adherence/service";
import {
  acceptInvitation,
  createMissedDoseAlerts,
  getMonitoredPatientOverview,
  inviteCaregiver,
  updateAlertStatus,
} from "./service";

vi.mock("@/server/domain/adherence/service");

describe("Phase 21 — Caregiver Domain Service", () => {
  const patientId = "patient-1";
  const caregiverId = "caregiver-2";

  const patientUser = {
    id: patientId,
    email: "patient@medvault.test",
    name: "Jane Patient",
    timezone: "UTC",
  };

  const caregiverUser = {
    id: caregiverId,
    email: "caregiver@medvault.test",
    name: "John Caregiver",
    timezone: "UTC",
  };

  const samplePermissions = {
    viewAdherence: true,
    viewMedications: false,
    receiveMissedDoseAlerts: true,
    receiveInsights: false,
    canAcknowledgeAlerts: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("inviteCaregiver", () => {
    it("throws error if patient tries to invite themselves", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([patientUser]),
            })),
          })),
        })),
      } as unknown as Db;

      await expect(
        inviteCaregiver(mockDb, patientId, {
          email: "patient@medvault.test",
          relationType: "family",
          permissions: samplePermissions,
        }),
      ).rejects.toThrow("You cannot invite yourself as a caregiver.");
    });

    it("creates invitation with unique token and default 7-day expiration", async () => {
      const insertValues = vi.fn().mockResolvedValue({});
      const updateSet = vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      }));

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            const rows = table === users ? [patientUser] : [];
            return {
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue(rows),
              })),
            };
          }),
        })),
        update: vi.fn(() => ({
          set: updateSet,
        })),
        insert: vi.fn(() => ({
          values: insertValues,
        })),
      } as unknown as Db;

      const result = await inviteCaregiver(mockDb, patientId, {
        email: "caregiver@medvault.test",
        relationType: "family",
        message: "Please watch my intake",
        permissions: samplePermissions,
      });

      expect(result.email).toBe("caregiver@medvault.test");
      expect(result.token).toBeDefined();
      expect(result.inviteUrl).toContain(result.token);
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUserId: patientId,
          email: "caregiver@medvault.test",
          status: "pending",
        }),
      );
    });
  });

  describe("acceptInvitation", () => {
    it("throws error if caregiver tries to accept an invitation for themselves", async () => {
      const mockInvitationRow = {
        id: "inv-1",
        patientUserId: patientId,
        email: "patient@medvault.test",
        message: null,
        status: "pending",
        expiresAt: new Date(Date.now() + 86400000),
        patientName: "Jane Patient",
        patientEmail: "patient@medvault.test",
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockInvitationRow]),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      await expect(
        acceptInvitation(mockDb, patientId, "valid-token"),
      ).rejects.toThrow("You cannot accept an invitation to become your own caregiver.");
    });

    it("activates relationship and marks invitation accepted", async () => {
      const mockInvitationRow = {
        id: "inv-1",
        patientUserId: patientId,
        email: "caregiver@medvault.test",
        message: JSON.stringify({
          text: "Help me track",
          permissions: samplePermissions,
          relationType: "family",
        }),
        status: "pending",
        expiresAt: new Date(Date.now() + 86400000),
        patientName: "Jane Patient",
        patientEmail: "patient@medvault.test",
      };

      const updateSet = vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      }));
      const insertValues = vi.fn().mockResolvedValue({});

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === caregiverInvitations) {
              return {
                innerJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue([mockInvitationRow]),
                  })),
                })),
              };
            }
            if (table === caregiverRelationships) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([]), // No prior relationship
                })),
              };
            }
            if (table === users) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([caregiverUser]),
                })),
              };
            }
            return {
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            };
          }),
        })),
        update: vi.fn(() => ({
          set: updateSet,
        })),
        insert: vi.fn(() => ({
          values: insertValues,
        })),
      } as unknown as Db;

      const rel = await acceptInvitation(mockDb, caregiverId, "valid-token");

      expect(rel.patientUserId).toBe(patientId);
      expect(rel.caregiverUserId).toBe(caregiverId);
      expect(rel.status).toBe("active");
      expect(rel.permissions.viewAdherence).toBe(true);

      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUserId: patientId,
          caregiverUserId: caregiverId,
          status: "active",
        }),
      );
    });
  });

  describe("createMissedDoseAlerts (Phase 13 hook)", () => {
    it("creates alert for active caregivers and deduplicates against existing alerts", async () => {
      const activeRel = {
        id: "rel-1",
        caregiverUserId: caregiverId,
        permissions: { ...samplePermissions, receiveMissedDoseAlerts: true },
      };

      const medRow = {
        name: "Metformin",
        dosageAmount: "500",
        dosageUnit: "mg",
      };

      let alertQueryCount = 0;
      const insertValues = vi.fn().mockResolvedValue({});

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === caregiverRelationships) {
              return {
                where: vi.fn().mockResolvedValue([activeRel]),
              };
            }
            if (table === users) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([patientUser]),
                })),
              };
            }
            if (table === medications) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([medRow]),
                })),
              };
            }
            if (table === caregiverAlerts) {
              alertQueryCount++;
              // Call 1: no existing alert -> returns []
              // Call 2: alert exists -> returns [{ id: 'alert-1' }]
              const rows = alertQueryCount === 1 ? [] : [{ id: "alert-1" }];
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue(rows),
                })),
              };
            }
            return {
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            };
          }),
        })),
        insert: vi.fn(() => ({
          values: insertValues,
        })),
      } as unknown as Db;

      const missedContext = {
        userId: patientId,
        medicationId: "med-1",
        doseEventId: "dose-100",
        scheduledFor: new Date("2026-03-01T08:00:00Z"),
      };

      // 1. First trigger creates alert
      const createdCount = await createMissedDoseAlerts(mockDb, missedContext);
      expect(createdCount).toBe(1);
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUserId: patientId,
          caregiverUserId: caregiverId,
          doseEventId: "dose-100",
          type: "missed_dose",
          title: "Missed dose: Metformin",
        }),
      );

      // 2. Second trigger deduplicates and skips insert
      const secondCount = await createMissedDoseAlerts(mockDb, missedContext);
      expect(secondCount).toBe(0);
    });
  });

  describe("getMonitoredPatientOverview", () => {
    it("enforces permission boundaries for viewMedications and viewAdherence", async () => {
      const mockActiveRel = {
        id: "rel-1",
        patientUserId: patientId,
        caregiverUserId: caregiverId,
        status: "active",
        relationType: "family",
        permissions: {
          viewAdherence: true,
          viewMedications: false, // Hidden medication names
          receiveMissedDoseAlerts: true,
          receiveInsights: false,
          canAcknowledgeAlerts: true,
        },
        acceptedAt: new Date(),
        createdAt: new Date(),
        patientName: "Jane Patient",
        patientEmail: "patient@medvault.test",
        patientTimezone: "UTC",
      };

      vi.mocked(adherenceService.getAdherenceSummary).mockResolvedValue({
        from: new Date(),
        to: new Date(),
        scheduled: 10,
        taken: 9,
        missed: 1,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 90,
        days: [],
        streak: { current: 3, longest: 10, currentEndsToday: true },
        trend: { daily: [], rolling7: [], direction: "stable", current7: 90, prior7: 90 },
        byBucket: [],
      });

      const mockDoseRow = {
        id: "dose-1",
        medicationId: "med-1",
        scheduleId: null,
        scheduledFor: new Date("2026-03-01T08:00:00Z"),
        status: "taken",
        takenAt: new Date(),
        skippedAt: null,
        snoozeUntil: null,
        snoozeCount: 0,
        skippedReason: null,
        missedDeadline: new Date(),
        statusUpdatedAt: new Date(),
        source: "generated",
        medicationName: "Secret Medication",
        dosageAmount: "100",
        dosageUnit: "mg",
        color: "blue",
        archivedAt: null,
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === caregiverRelationships) {
              return {
                innerJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue([mockActiveRel]),
                  })),
                })),
              };
            }
            if (table === doseEvents) {
              return {
                innerJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue([mockDoseRow]),
                    })),
                  })),
                })),
              };
            }
            if (table === caregiverAlerts) {
              return {
                innerJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue([]),
                    })),
                  })),
                })),
              };
            }
            return {
              where: vi.fn().mockResolvedValue([]),
            };
          }),
        })),
      } as unknown as Db;

      const overview = await getMonitoredPatientOverview(mockDb, caregiverId, patientId);

      expect(overview.adherenceSummary).toBeDefined();
      expect(overview.adherenceSummary?.adherencePercent).toBe(90);

      // Medication details are redacted because viewMedications is false
      expect(overview.medications).toHaveLength(0);
      expect(overview.todayDoses[0]?.medication.name).toBe("Medication");
      expect(overview.todayDoses[0]?.medication.dosageAmount).toBe(0);
    });
  });

  describe("updateAlertStatus", () => {
    it("updates alert to acknowledged or resolved", async () => {
      const mockAlertRow = {
        id: "alert-1",
        type: "missed_dose",
        title: "Missed dose",
        body: "Patient missed dose",
        status: "new",
        createdAt: new Date(),
        resolvedAt: null,
        data: {},
        patientName: "Jane Patient",
        patientEmail: "patient@medvault.test",
      };

      const updateSet = vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      }));

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockAlertRow]),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          set: updateSet,
        })),
      } as unknown as Db;

      const acknowledged = await updateAlertStatus(
        mockDb,
        caregiverId,
        "alert-1",
        "acknowledge",
      );
      expect(acknowledged.status).toBe("acknowledged");

      const resolved = await updateAlertStatus(
        mockDb,
        caregiverId,
        "alert-1",
        "resolve",
      );
      expect(resolved.status).toBe("resolved");
      expect(resolved.resolvedAt).toBeDefined();
    });
  });
});
