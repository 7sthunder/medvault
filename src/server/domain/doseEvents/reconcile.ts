/**
 * Phase 13 — reconcile: applies the §10.3 status machine to persisted rows (§10.3 write
 * path). Drives `dose_events` to their deterministic next status at "now": `upcoming → due`,
 * expired `snoozed → due`, and `|upcoming, due, snoozed| → missed` once the (possibly
 * extended) deadline passes. Every transition is a conditional single-statement update so
 * concurrent readers/actions can never double-transition (the §10.3 atomicity rule).
 *
 * Reads are canonical: `reconcileUser` is cheap (only pending rows are scanned via the
 * `(userId, status)` index) and runs before any adherence/schedule read, plus on the
 * scheduler interval as the safety net.
 */

import { and, eq, inArray } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { doseActions, doseEvents, userPreferences, users } from "@/server/db/schema";
import type { DoseEventStatus } from "@/shared/enums";
import { MISSED_AFTER_DEFAULT } from "@/shared/constants";
import { deriveNextStatus, PENDING_EVENT_STATUSES } from "@/shared/calc/doseState";
import type { PendingEventLike } from "@/shared/calc/doseState";
import { now as sharedNow } from "@/shared/times";

import { missedFlowProducers } from "./producers";
import type { MissedDoseRef } from "./producers";

/** One dose-event row as reconcile sees it (join shape). */
type PendingRow = typeof doseEvents.$inferSelect & PendingEventLike;

export interface ReconcileOptions {
  now?: Date;
}

export interface ReconcileResult {
  scanned: number;
  reconciled: number;
  missed: number;
}

async function settingsFor(db: DbClient, userId: string): Promise<{ missedAfterMinutes: number }> {
  const [prefs] = await db
    .select({ missedAfterMinutes: userPreferences.missedAfterMinutes })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return { missedAfterMinutes: prefs?.missedAfterMinutes ?? MISSED_AFTER_DEFAULT };
}

/**
 * Reconcile a single pending event and persist whatever changed. Idempotent and
 * atomic: the conditional `WHERE status IN (pending)` guard means a second caller
 * (a concurrent take, a double scheduling tick) matches zero rows. Returns the
 * derived state so callers know what happened.
 */
export async function applyReconcileToEvent(
  db: DbClient,
  event: PendingRow,
  opts: { userId: string; now: Date; missedAfterMinutes: number },
): Promise<{ status: DoseEventStatus; changed: boolean; transition: "missed" | "due" | "snooze-expired" | null }> {
  const derived = deriveNextStatus(event, opts.now, opts.missedAfterMinutes);
  if (!derived.changed || derived.at === null) return derived;

  if (derived.status === "missed") {
    const [hit] = await db
      .update(doseEvents)
      .set({ status: "missed", statusUpdatedAt: derived.at })
      .where(and(eq(doseEvents.id, event.id), inArray(doseEvents.status, PENDING_EVENT_STATUSES)))
      .returning({ id: doseEvents.id });
    if (hit) {
      const ref: MissedDoseRef = {
        id: event.id,
        medicationId: event.medicationId,
        scheduledFor: event.scheduledFor,
        missedDeadline: derived.at,
      };
      await db.insert(doseActions).values({
        id: uuidv7(),
        userId: opts.userId,
        doseEventId: event.id,
        action: "missed_auto",
        occurredAt: derived.at,
        meta: { source: "reconcile", missedAt: derived.at.toISOString() },
      });
      await missedFlowProducers.onMissed(db, opts.userId, ref, opts.now);
    }
  } else if (derived.status === "due") {
    await db
      .update(doseEvents)
      .set({ status: "due", statusUpdatedAt: derived.at })
      .where(and(eq(doseEvents.id, event.id), eq(doseEvents.status, event.status)));
  }

  return derived;
}

/**
 * Reconcile every pending event for one user at `now` (defaults to the shared clock so
 * demo time flows through). Returns a tally for logging/test assertions.
 */
export async function reconcileUser(db: DbClient, userId: string, options: ReconcileOptions = {}): Promise<ReconcileResult> {
  const at = options.now ?? sharedNow();
  const { missedAfterMinutes } = await settingsFor(db, userId);

  const pending = (await db
    .select()
    .from(doseEvents)
    .where(and(eq(doseEvents.userId, userId), inArray(doseEvents.status, PENDING_EVENT_STATUSES)))) as PendingRow[];

  let reconciled = 0;
  let missed = 0;
  for (const event of pending) {
    const derived = await applyReconcileToEvent(db, event, { userId, now: at, missedAfterMinutes });
    if (derived.changed) {
      reconciled += 1;
      if (derived.status === "missed") missed += 1;
    }
  }
  return { scanned: pending.length, reconciled, missed };
}

/** Reconcile all onboarded users (scheduler safety net). */
export async function reconcileAll(db: DbClient, options: ReconcileOptions = {}): Promise<{ users: number; reconciled: number; missed: number }> {
  const onboarded = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.onboardingCompleted, true));
  let reconciled = 0;
  let missed = 0;
  for (const user of onboarded) {
    const result = await reconcileUser(db, user.id, options);
    reconciled += result.reconciled;
    missed += result.missed;
  }
  return { users: onboarded.length, reconciled, missed };
}

export { missedFlowProducers };