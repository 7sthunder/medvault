import { describe, expect, it } from "vitest";
import {
  calculateSnoozeTimes,
  canSkipDose,
  canSnoozeDose,
  canTakeDose,
  isDoseDue,
  isDoseMissed,
} from "./doseState";

describe("Phase 13 — doseState (pure transition rules)", () => {
  describe("canTakeDose", () => {
    it("allows taking upcoming, due, snoozed, and missed doses", () => {
      expect(canTakeDose("upcoming")).toBe(true);
      expect(canTakeDose("due")).toBe(true);
      expect(canTakeDose("snoozed")).toBe(true);
      expect(canTakeDose("missed")).toBe(true); // Taking late allowed per plan
    });

    it("rejects taking already taken, skipped, or canceled doses", () => {
      expect(canTakeDose("taken")).toBe(false);
      expect(canTakeDose("skipped")).toBe(false);
      expect(canTakeDose("canceled")).toBe(false);
    });
  });

  describe("canSnoozeDose", () => {
    it("allows snoozing upcoming, due, and snoozed doses if snoozeCount < maxSnoozes", () => {
      expect(canSnoozeDose("due", 0, 3)).toBe(true);
      expect(canSnoozeDose("due", 2, 3)).toBe(true);
      expect(canSnoozeDose("snoozed", 1, 3)).toBe(true);
      expect(canSnoozeDose("upcoming", 0, 3)).toBe(true);
    });

    it("rejects snoozing if snoozeCount reaches maxSnoozes", () => {
      expect(canSnoozeDose("due", 3, 3)).toBe(false);
      expect(canSnoozeDose("due", 4, 3)).toBe(false);
    });

    it("rejects snoozing missed, taken, skipped, or canceled doses", () => {
      expect(canSnoozeDose("missed", 0, 3)).toBe(false);
      expect(canSnoozeDose("taken", 0, 3)).toBe(false);
      expect(canSnoozeDose("skipped", 0, 3)).toBe(false);
      expect(canSnoozeDose("canceled", 0, 3)).toBe(false);
    });
  });

  describe("canSkipDose", () => {
    it("allows skipping upcoming, due, and snoozed doses", () => {
      expect(canSkipDose("due")).toBe(true);
      expect(canSkipDose("snoozed")).toBe(true);
      expect(canSkipDose("upcoming")).toBe(true);
    });

    it("rejects skipping missed doses (per grill-me decision)", () => {
      expect(canSkipDose("missed")).toBe(false);
    });

    it("rejects skipping taken, already skipped, or canceled doses", () => {
      expect(canSkipDose("taken")).toBe(false);
      expect(canSkipDose("skipped")).toBe(false);
      expect(canSkipDose("canceled")).toBe(false);
    });
  });

  describe("calculateSnoozeTimes", () => {
    it("computes snoozeUntil and extends missedDeadline when greater than current", () => {
      const now = new Date("2026-03-01T08:15:00Z");
      const currentMissedDeadline = new Date("2026-03-01T08:30:00Z");

      const res = calculateSnoozeTimes({
        now,
        snoozeMinutes: 15,
        currentMissedDeadline,
        missedAfterMinutes: 30,
      });

      // snoozeUntil = 08:15 + 15m = 08:30
      expect(res.snoozeUntil.toISOString()).toBe("2026-03-01T08:30:00.000Z");
      // extendedDeadline = 08:30 + 30m = 09:00 (which is > current 08:30)
      expect(res.missedDeadline.toISOString()).toBe("2026-03-01T09:00:00.000Z");
    });

    it("preserves currentMissedDeadline if it is further out than extended deadline", () => {
      const now = new Date("2026-03-01T08:00:00Z");
      const currentMissedDeadline = new Date("2026-03-01T10:00:00Z");

      const res = calculateSnoozeTimes({
        now,
        snoozeMinutes: 10,
        currentMissedDeadline,
        missedAfterMinutes: 30,
      });

      // extended = 08:10 + 30m = 08:40 < 10:00 -> preserves 10:00
      expect(res.missedDeadline.toISOString()).toBe("2026-03-01T10:00:00.000Z");
    });
  });

  describe("isDoseMissed and isDoseDue", () => {
    it("detects missed status when now > missedDeadline for unresolved statuses", () => {
      const deadline = new Date("2026-03-01T08:30:00Z");
      const past = new Date("2026-03-01T08:31:00Z");
      const before = new Date("2026-03-01T08:29:00Z");

      expect(isDoseMissed(past, deadline, "due")).toBe(true);
      expect(isDoseMissed(past, deadline, "upcoming")).toBe(true);
      expect(isDoseMissed(past, deadline, "snoozed")).toBe(true);
      expect(isDoseMissed(before, deadline, "due")).toBe(false);
      // Already taken -> not missed
      expect(isDoseMissed(past, deadline, "taken")).toBe(false);
    });

    it("detects due status when now >= scheduledFor", () => {
      const scheduled = new Date("2026-03-01T08:00:00Z");
      expect(isDoseDue(new Date("2026-03-01T08:00:00Z"), scheduled, "upcoming")).toBe(true);
      expect(isDoseDue(new Date("2026-03-01T08:05:00Z"), scheduled, "upcoming")).toBe(true);
      expect(isDoseDue(new Date("2026-03-01T07:59:00Z"), scheduled, "upcoming")).toBe(false);
      expect(isDoseDue(new Date("2026-03-01T08:05:00Z"), scheduled, "due")).toBe(false);
    });
  });
});
