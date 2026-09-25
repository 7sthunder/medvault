import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  queryDoseHistory,
} from "./history";

describe("Phase 19 — Dose History Service", () => {
  describe("Cursor encoding and decoding", () => {
    it("round-trips a valid Date and ID", () => {
      const now = new Date("2026-03-01T12:34:56.789Z");
      const id = "action-uuid-123";
      const cursor = encodeHistoryCursor(now, id);

      expect(typeof cursor).toBe("string");
      const decoded = decodeHistoryCursor(cursor);
      expect(decoded).not.toBeNull();
      expect(decoded?.occurredAt.toISOString()).toBe(now.toISOString());
      expect(decoded?.id).toBe(id);
    });

    it("returns null for invalid base64 or JSON payloads", () => {
      expect(decodeHistoryCursor("not-base64")).toBeNull();
      expect(decodeHistoryCursor(Buffer.from("not-json").toString("base64"))).toBeNull();
      expect(decodeHistoryCursor(Buffer.from(JSON.stringify({ t: "bad-date" })).toString("base64"))).toBeNull();
    });
  });

  describe("queryDoseHistory", () => {
    const userId = "user-1";

    it("queries dose actions joined with events and medications", async () => {
      const row1 = {
        action: {
          id: "act-1",
          userId,
          doseEventId: "dose-1",
          action: "take" as const,
          occurredAt: new Date("2026-03-01T08:05:00Z"),
          meta: { wasLate: false },
        },
        event: {
          status: "taken" as const,
          scheduledFor: new Date("2026-03-01T08:00:00Z"),
          medicationId: "med-1",
        },
        medication: {
          id: "med-1",
          userId,
          name: "Metformin",
          dosageAmount: "500",
          dosageUnit: "mg",
          color: "blue",
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve([{ count: 1 }])),
              innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue([row1]),
                  })),
                })),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      const result = await queryDoseHistory(mockDb, userId, { limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.nextCursor).toBeNull();

      const item = result.items[0];
      expect(item?.id).toBe("act-1");
      expect(item?.action).toBe("take");
      expect(item?.medication.name).toBe("Metformin");
      expect(item?.medication.dosageAmount).toBe(500);
      expect(item?.medication.archivedAt).toBeNull();
      expect(item?.eventStatus).toBe("taken");
    });

    it("preserves archived status of medication snapshot", async () => {
      const archivedDate = new Date("2026-03-02T10:00:00Z");
      const rowArchived = {
        action: {
          id: "act-2",
          userId,
          doseEventId: "dose-2",
          action: "skip" as const,
          occurredAt: new Date("2026-03-01T08:00:00Z"),
          meta: { reason: "Doctor paused" },
        },
        event: {
          status: "skipped" as const,
          scheduledFor: new Date("2026-03-01T08:00:00Z"),
          medicationId: "med-archived",
        },
        medication: {
          id: "med-archived",
          userId,
          name: "Lisinopril",
          dosageAmount: "10",
          dosageUnit: "mg",
          color: "rose",
          archivedAt: archivedDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve([{ count: 1 }])),
              innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue([rowArchived]),
                  })),
                })),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      const result = await queryDoseHistory(mockDb, userId);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.medication.archivedAt).toEqual(archivedDate);
    });

    it("generates nextCursor when results exceed limit", async () => {
      const makeRow = (id: string, minsAgo: number) => ({
        action: {
          id,
          userId,
          doseEventId: `dose-${id}`,
          action: "take" as const,
          occurredAt: new Date(Date.now() - minsAgo * 60000),
          meta: null,
        },
        event: {
          status: "taken" as const,
          scheduledFor: new Date(Date.now() - minsAgo * 60000),
          medicationId: "med-1",
        },
        medication: {
          id: "med-1",
          userId,
          name: "Metformin",
          dosageAmount: "500",
          dosageUnit: "mg",
          color: "blue",
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Requested limit = 2, so query fetches 3 rows
      const rows = [makeRow("r1", 10), makeRow("r2", 20), makeRow("r3", 30)];

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve([{ count: 10 }])),
              innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue(rows),
                  })),
                })),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      const result = await queryDoseHistory(mockDb, userId, { limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).not.toBeNull();
      const decoded = decodeHistoryCursor(result.nextCursor!);
      expect(decoded?.id).toBe("r2");
    });
  });
});
