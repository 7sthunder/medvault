import { describe, expect, it } from "vitest";

import {
  applySnooze,
  canSnoozeDoseStatus,
  canSkipDoseStatus,
  canTakeDoseStatus,
  canTakeUpcoming,
  computeOriginalDeadline,
  deriveNextStatus,
  extendDeadlineForSnooze,
  isLegalTransition,
  TRANSITION_TABLE,
} from "./doseState";

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const t = (ms: number) => new Date(1_700_000_000_000 + ms);
const scheduled = t(0);

function pending(
  over: Partial<{
    status: "upcoming" | "due" | "snoozed";
    scheduledFor: Date;
    missedDeadline: Date | null;
    snoozeUntil: Date | null;
  }> = {},
) {
  return {
    status: over.status ?? "upcoming",
    scheduledFor: over.scheduledFor ?? scheduled,
    missedDeadline:
      over.missedDeadline ?? computeOriginalDeadline(over.scheduledFor ?? scheduled, 30),
    snoozeUntil: over.snoozeUntil ?? null,
  };
}

describe("doseState transition table (§10.3)", () => {
  it("maps every configured transition as a legal edge", () => {
    expect(isLegalTransition("upcoming", "due")).toBe(true);
    expect(isLegalTransition("upcoming", "snoozed")).toBe(true);
    expect(isLegalTransition("upcoming", "missed")).toBe(true);
    expect(isLegalTransition("due", "snoozed")).toBe(true);
    expect(isLegalTransition("due", "taken")).toBe(true);
    expect(isLegalTransition("due", "skipped")).toBe(true);
    expect(isLegalTransition("due", "missed")).toBe(true);
    expect(isLegalTransition("snoozed", "due")).toBe(true);
    expect(isLegalTransition("snoozed", "taken")).toBe(true);
    expect(isLegalTransition("missed", "taken")).toBe(true); // take-late
  });

  it("rejects illegal transitions", () => {
    expect(isLegalTransition("taken", "due")).toBe(false);
    expect(isLegalTransition("skipped", "taken")).toBe(false);
    expect(isLegalTransition("canceled", "taken")).toBe(false);
    expect(isLegalTransition("missed", "skipped")).toBe(false); // no skip after missed
    expect(isLegalTransition("taken", "missed")).toBe(false);
    expect(TRANSITION_TABLE.taken).toHaveLength(0);
    expect(TRANSITION_TABLE.skipped).toHaveLength(0);
  });
});

describe("deriveNextStatus (§10.3)", () => {
  it("due exactly when now === scheduledFor (rule 1)", () => {
    const r = deriveNextStatus(pending(), t(0), 30);
    expect(r).toEqual({ status: "due", at: t(0), changed: true, transition: "due" });
  });

  it("upcoming stays upcoming before its time", () => {
    const r = deriveNextStatus(pending(), t(-1), 30);
    expect(r.changed).toBe(false);
    expect(r.status).toBe("upcoming");
  });

  it("missed only AFTER the deadline — exactly-at is still due (rule 2)", () => {
    expect(deriveNextStatus(pending(), t(30 * MIN), 30).status).toBe("due");
    expect(deriveNextStatus(pending(), t(30 * MIN + 1), 30)).toEqual({
      status: "missed",
      at: t(30 * MIN),
      changed: true,
      transition: "missed",
    });
  });

  it("applies the extended (snoozed) deadline, and flips expired snoozes back to due", () => {
    const snoozedAt = new Date(t(5 * MIN).getTime());
    const snoozeUntil = new Date(snoozedAt.getTime() + 10 * MIN);
    const deadline = extendDeadlineForSnooze(t(30 * MIN), snoozeUntil, 30);
    const evt = pending({ status: "snoozed", snoozeUntil, missedDeadline: deadline });

    // Before snoozeUntil expires → still snoozed.
    expect(deriveNextStatus(evt, new Date(snoozedAt.getTime() + 9 * MIN), 30).status).toBe(
      "snoozed",
    );
    // Snooze expired but grace not past → due.
    expect(deriveNextStatus(evt, snoozeUntil, 30)).toEqual({
      status: "due",
      at: snoozeUntil,
      changed: true,
      transition: "snooze-expired",
    });
    // Past the extended deadline → missed (at = extended deadline).
    expect(deriveNextStatus(evt, new Date(deadline.getTime() + 1), 30)).toEqual({
      status: "missed",
      at: deadline,
      changed: true,
      transition: "missed",
    });
  });
});

describe("snooze math (rule 3)", () => {
  it("extends the deadline past the snooze and increments the counter", () => {
    const base = computeOriginalDeadline(scheduled, 30);
    const fields = applySnooze(
      { scheduledFor: scheduled, missedDeadline: base, snoozeCount: 0 },
      {
        now: t(5 * MIN),
        snoozeMinutes: 10,
        missedAfterMinutes: 30,
        horizonEnd: new Date(t(48 * HOUR)),
      },
    );
    expect(fields.snoozeCount).toBe(1);
    expect(fields.snoozeUntil.getTime()).toBe(t(5 * MIN + 10 * MIN).getTime());
    expect(fields.missedDeadline.getTime()).toBe(t(5 * MIN + 10 * MIN + 30 * MIN).getTime());
  });

  it("caps snoozeUntil at the shared horizon", () => {
    const horizonEnd = new Date(t(48 * HOUR).getTime());
    const fields = applySnooze(
      { scheduledFor: scheduled, missedDeadline: null, snoozeCount: 2 },
      {
        now: new Date(horizonEnd.getTime() - 5 * MIN),
        snoozeMinutes: 10,
        missedAfterMinutes: 30,
        horizonEnd,
      },
    );
    expect(fields.snoozeUntil.getTime()).toBe(horizonEnd.getTime());
  });

  it("never shrinks an existing extended deadline", () => {
    const wide = computeOriginalDeadline(scheduled, 90);
    const fields = applySnooze(
      { scheduledFor: scheduled, missedDeadline: wide, snoozeCount: 1 },
      {
        now: t(1 * MIN),
        snoozeMinutes: 10,
        missedAfterMinutes: 30,
        horizonEnd: new Date(t(48 * HOUR)),
      },
    );
    expect(fields.missedDeadline.getTime()).toBe(wide.getTime()); // max semantics
  });
});

describe("action validity (§10.3/§10.4)", () => {
  it("take: allowed from due|snoozed|upcoming|missed; blocked from taken|skipped|canceled", () => {
    for (const s of ["due", "snoozed", "upcoming", "missed"] as const)
      expect(canTakeDoseStatus(s)).toBe(true);
    for (const s of ["taken", "skipped", "canceled"] as const)
      expect(canTakeDoseStatus(s)).toBe(false);
  });

  it("take-late: an upcoming dose is only takable inside the reminder window", () => {
    expect(canTakeUpcoming(scheduled, t(-4 * MIN), 5)).toBe(true);
    expect(canTakeUpcoming(scheduled, t(-6 * MIN), 5)).toBe(false);
    expect(canTakeUpcoming(scheduled, t(0), 5)).toBe(true);
  });

  it("skip: only due|snoozed", () => {
    expect(canSkipDoseStatus("due")).toBe(true);
    expect(canSkipDoseStatus("snoozed")).toBe(true);
    expect(canSkipDoseStatus("missed")).toBe(false);
    expect(canSkipDoseStatus("upcoming")).toBe(false);
  });

  it("snooze: respects the max-snoozes cap", () => {
    expect(canSnoozeDoseStatus("due", 0, 3)).toBe(true);
    expect(canSnoozeDoseStatus("snoozed", 2, 3)).toBe(true);
    expect(canSnoozeDoseStatus("snoozed", 3, 3)).toBe(false);
    expect(canSnoozeDoseStatus("taken", 0, 3)).toBe(false);
  });
});
