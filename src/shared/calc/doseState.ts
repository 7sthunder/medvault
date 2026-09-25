/**
 * Phase 13 — pure dose status machine (§10.3).
 *
 * The whole app reasons about dose statuses through these functions: reconcile
 * (server job + read path) applies them atomically; dose actions validate against
 * `canTakeDose`/`canSnoozeDose`/`canSkipDose`; tests assert the transition table.
 * No DB, no I/O — deterministic and timezone-free (every input is already an instant).
 *
 * Transition map (§10.3): `upcoming → due → snoozed ⇄ due → missed | taken | skipped`;
 * any unresolved → `canceled`; `missed → taken` (take-late) is the single restore edge.
 */

import type { DoseEventStatus } from "../enums";

/** Statuses that still need reconciliation (the only rows reconcile ever touches). */
export const PENDING_EVENT_STATUSES: readonly DoseEventStatus[] = [
  "upcoming",
  "due",
  "snoozed",
] as const;

export function isPendingStatus(status: DoseEventStatus): boolean {
  return (PENDING_EVENT_STATUSES as readonly DoseEventStatus[]).includes(status);
}

/** Legal transitions per §10.3. Every state-change a service makes must pass `isLegalTransition`. */
export const TRANSITION_TABLE: Readonly<Record<DoseEventStatus, readonly DoseEventStatus[]>> = {
  upcoming: ["due", "snoozed", "missed", "taken", "canceled"],
  due: ["snoozed", "missed", "taken", "skipped", "canceled"],
  snoozed: ["due", "snoozed", "missed", "taken", "skipped", "canceled"],
  taken: [],
  missed: ["taken"],
  skipped: [],
  canceled: [],
};

export function isLegalTransition(from: DoseEventStatus, to: DoseEventStatus): boolean {
  return TRANSITION_TABLE[from].includes(to);
}

/** §10.3 rule 2 — original (pre-snooze) miss deadline. */
export function computeOriginalDeadline(scheduledFor: Date, missedAfterMinutes: number): Date {
  return new Date(scheduledFor.getTime() + missedAfterMinutes * 60_000);
}

/** §10.3 rule 3 — snoozing extends grace: `max(deadline, snoozeUntil + missedAfterMinutes)`. */
export function extendDeadlineForSnooze(
  missedDeadline: Date,
  snoozeUntil: Date,
  missedAfterMinutes: number,
): Date {
  const extended = snoozeUntil.getTime() + missedAfterMinutes * 60_000;
  const current = missedDeadline.getTime();
  return new Date(extended > current ? extended : current);
}

/** §10.3 rule 1 — a persisted `upcoming` row flips to `due` as soon as `now ≥ scheduledFor`. */
export function isDueNow(scheduledFor: Date, now: Date): boolean {
  return now.getTime() >= scheduledFor.getTime();
}

/** §10.3 rule 2 — `now > missedDeadline` (exactly-at the deadline is NOT yet missed). */
export function isPastDeadline(
  event: Pick<PendingEventLike, "scheduledFor" | "missedDeadline">,
  now: Date,
  missedAfterMinutes: number,
): boolean {
  const deadline =
    event.missedDeadline ?? computeOriginalDeadline(event.scheduledFor, missedAfterMinutes);
  return now.getTime() > deadline.getTime();
}

/** Minimal event shape the pure derivation needs. */
export interface PendingEventLike {
  status: DoseEventStatus;
  scheduledFor: Date;
  missedDeadline: Date | null;
  snoozeUntil: Date | null;
}

export type DerivedTransition = "missed" | "due" | "snooze-expired";

export interface DerivedState {
  status: DoseEventStatus;
  /** Instant the transition should be recorded at (`missedDeadline` retroactively for misses). */
  at: Date | null;
  changed: boolean;
  transition: DerivedTransition | null;
}

/**
 * Deterministic next status for a pending event at `now`. Priority order (§10.3):
 * 1. past extended deadline → missed (recorded at the deadline, retroactive accuracy)
 * 2. `upcoming` with `now ≥ scheduledFor` → due
 * 3. expired `snoozed` → back to due
 * Returns the current status unchanged when nothing applies.
 */
export function deriveNextStatus(
  evt: PendingEventLike,
  now: Date,
  missedAfterMinutes: number,
): DerivedState {
  if (isPastDeadline(evt, now, missedAfterMinutes)) {
    const deadline =
      evt.missedDeadline ?? computeOriginalDeadline(evt.scheduledFor, missedAfterMinutes);
    return { status: "missed", at: deadline, changed: true, transition: "missed" };
  }
  if (evt.status === "upcoming" && isDueNow(evt.scheduledFor, now)) {
    return { status: "due", at: now, changed: true, transition: "due" };
  }
  if (
    evt.status === "snoozed" &&
    evt.snoozeUntil !== null &&
    now.getTime() >= evt.snoozeUntil.getTime()
  ) {
    return { status: "due", at: now, changed: true, transition: "snooze-expired" };
  }
  return { status: evt.status, at: null, changed: false, transition: null };
}

/* ── §10.3 + §10.4 action validity ────────────────────────────────────────── */

/** Take is allowed from everything except a terminal non-miss state. */
export function canTakeDoseStatus(status: DoseEventStatus): boolean {
  return status === "due" || status === "snoozed" || status === "upcoming" || status === "missed";
}

/** §10.4 — an `upcoming` dose may only be taken inside the pre-dose reminder window. */
export function canTakeUpcoming(
  scheduledFor: Date,
  now: Date,
  reminderBeforeMinutes: number,
): boolean {
  return now.getTime() >= scheduledFor.getTime() - reminderBeforeMinutes * 60_000;
}

/** §10.3 rule 5 — skip only from `due | snoozed` (already-missed rows are not skippable). */
export function canSkipDoseStatus(status: DoseEventStatus): boolean {
  return status === "due" || status === "snoozed";
}

/** §10.3 rule 3 — snoozable while unresolved and under the per-dose snooze cap. */
export function canSnoozeDoseStatus(
  status: DoseEventStatus,
  snoozeCount: number,
  maxSnoozes: number,
): boolean {
  return (
    (status === "due" || status === "snoozed" || status === "upcoming") && snoozeCount < maxSnoozes
  );
}

/* ── Snooze math (§10.3 rule 3) ───────────────────────────────────────────── */

export interface SnoozedFields {
  snoozeCount: number;
  snoozeUntil: Date;
  missedDeadline: Date;
}

/**
 * Compute the post-snooze fields: `snoozeCount += 1`, `snoozeUntil = now + snoozeMinutes`
 * capped to the shared horizon, and the extended grace deadline.
 */
export function applySnooze(
  evt: { scheduledFor: Date; missedDeadline: Date | null; snoozeCount: number },
  opts: { now: Date; snoozeMinutes: number; missedAfterMinutes: number; horizonEnd: Date },
): SnoozedFields {
  const rawSnoozeUntil = opts.now.getTime() + opts.snoozeMinutes * 60_000;
  const snoozeUntil = new Date(Math.min(rawSnoozeUntil, opts.horizonEnd.getTime()));
  const baseDeadline =
    evt.missedDeadline ?? computeOriginalDeadline(evt.scheduledFor, opts.missedAfterMinutes);
  const missedDeadline = extendDeadlineForSnooze(
    baseDeadline,
    snoozeUntil,
    opts.missedAfterMinutes,
  );
  return { snoozeCount: evt.snoozeCount + 1, snoozeUntil, missedDeadline };
}
