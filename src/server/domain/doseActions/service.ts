/**
 * Phase 13 — dose actions (§10.4). Each action is one transaction: reconcile the event
 * to its live status, validate, apply a conditional single-statement update (so repeated
 * or racing requests are idempotent no-ops, never double-transitions), append the audit
 * row, then recompute the affected `adherence_daily` day(s). All writes are owner-scoped.
 */

import { TRPCError } from "@trpc/server";
import { and, eq, inArray, lt } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { doseActions, doseEvents, userPreferences } from "@/server/db/schema";
import type { DoseEventStatus } from "@/shared/enums";
import { HORIZON_DAYS, MAX_SNOOZES_DEFAULT, MISSED_AFTER_DEFAULT, REMINDER_BEFORE_DEFAULT, SNOOZE_MIN_DEFAULT } from "@/shared/constants";
import {
  applySnooze,
  canSkipDoseStatus,
  canSnoozeDoseStatus,
  canTakeDoseStatus,
  canTakeUpcoming,
  deriveNextStatus,
} from "@/shared/calc/doseState";
import { localDateKey, now as sharedNow } from "@/shared/times";
import { recomputeDay } from "@/server/domain/adherence/materialize";
import { applyReconcileToEvent } from "@/server/domain/doseEvents/reconcile";

export interface TakeOptions {
  occurredAt?: Date;
  timeZone: string;
}

export interface SnoozeOptions {
  timeZone: string;
}

export interface SkipOptions {
  skipReason?: string;
  timeZone: string;
}

export interface DoseActionResult {
  doseId: string;
  changed: boolean;
  status: DoseEventStatus;
  takenLate?: boolean;
  snoozeCount?: number;
  snoozeUntil?: Date | null;
}

interface ActionSettings {
  missedAfterMinutes: number;
  snoozeMinutes: number;
  maxSnoozes: number;
  reminderBeforeMinutes: number;
}

async function loadOwnedEvent(tx: DbClient, userId: string, doseId: string) {
  const [event] = await tx
    .select()
    .from(doseEvents)
    .where(and(eq(doseEvents.id, doseId), eq(doseEvents.userId, userId)))
    .limit(1);
  if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Dose not found." });
  return event;
}

async function loadSettings(tx: DbClient, userId: string): Promise<ActionSettings> {
  const [prefs] = await tx
    .select({
      missedAfterMinutes: userPreferences.missedAfterMinutes,
      snoozeMinutes: userPreferences.snoozeMinutes,
      maxSnoozes: userPreferences.maxSnoozes,
      reminderBeforeMinutes: userPreferences.reminderBeforeMinutes,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return {
    missedAfterMinutes: prefs?.missedAfterMinutes ?? MISSED_AFTER_DEFAULT,
    snoozeMinutes: prefs?.snoozeMinutes ?? SNOOZE_MIN_DEFAULT,
    maxSnoozes: prefs?.maxSnoozes ?? MAX_SNOOZES_DEFAULT,
    reminderBeforeMinutes: prefs?.reminderBeforeMinutes ?? REMINDER_BEFORE_DEFAULT,
  };
}

async function insertAudit(
  tx: DbClient,
  input: { userId: string; doseEventId: string; action: "take" | "snooze" | "skip"; occurredAt: Date; meta: Record<string, unknown> },
): Promise<void> {
  await tx.insert(doseActions).values({
    id: uuidv7(),
    userId: input.userId,
    doseEventId: input.doseEventId,
    action: input.action,
    occurredAt: input.occurredAt,
    meta: input.meta,
  });
}

async function recomputeDaysFor(tx: DbClient, userId: string, timeZone: string, ...instants: (Date | null)[]): Promise<void> {
  const keys = new Set<string>();
  for (const instant of instants) {
    if (instant) keys.add(localDateKey(instant, timeZone));
  }
  for (const key of keys) {
    await recomputeDay(tx, { userId, dateKey: key, timeZone });
  }
}

export const doseActionsService = {
  /** §10.4 take — incl. take-late from `missed`; repeated takes are idempotent no-ops. */
  async take(db: DbClient, userId: string, doseId: string, opts: TakeOptions): Promise<DoseActionResult> {
    const at = opts.occurredAt ?? sharedNow();
    return db.transaction(async (tx) => {
      const id = doseId;
      const event = await loadOwnedEvent(tx, userId, doseId);
      const settings = await loadSettings(tx, userId);

      // Reconcile to the live status first (upcoming → due, expired snooze → due, late → missed).
      await applyReconcileToEvent(tx, event, { userId, now: at, missedAfterMinutes: settings.missedAfterMinutes });
      const liveStatus = deriveLiveStatus(event, at, settings.missedAfterMinutes);

      if (!canTakeDoseStatus(liveStatus)) {
        return { doseId: id, changed: false, status: event.status };
      }
      if (liveStatus === "upcoming" && !canTakeUpcoming(event.scheduledFor, at, settings.reminderBeforeMinutes)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This dose is not due yet." });
      }

      const [hit] = await tx
        .update(doseEvents)
        .set({ status: "taken", takenAt: at, statusUpdatedAt: at })
        .where(
          and(
            eq(doseEvents.id, doseId),
            eq(doseEvents.userId, userId),
            inArray(doseEvents.status, ["upcoming", "due", "snoozed", "missed"]),
          ),
        )
        .returning({ takenAt: doseEvents.takenAt });
      if (!hit) return { doseId: id, changed: false, status: liveStatus }; // already resolved → idempotent no-op

      const takenLate = liveStatus === "missed";
      await insertAudit(tx, {
        userId,
        doseEventId: doseId,
        action: "take",
        occurredAt: at,
        meta: { fromStatus: liveStatus, takenLate, source: "dose-actions" },
      });
      await recomputeDaysFor(tx, userId, opts.timeZone, event.scheduledFor, at);
      return { doseId: id, changed: true, status: "taken", takenLate };
    });
  },

  /** §10.4 snooze — respects the per-dose cap and extends the miss grace deadline. */
  async snooze(db: DbClient, userId: string, doseId: string, opts: SnoozeOptions): Promise<DoseActionResult> {
    const at = sharedNow();
    return db.transaction(async (tx) => {
      const id = doseId;
      const event = await loadOwnedEvent(tx, userId, doseId);
      const settings = await loadSettings(tx, userId);

      await applyReconcileToEvent(tx, event, { userId, now: at, missedAfterMinutes: settings.missedAfterMinutes });
      const liveStatus = deriveLiveStatus(event, at, settings.missedAfterMinutes);

      if (!canSnoozeDoseStatus(liveStatus, event.snoozeCount, settings.maxSnoozes)) {
        return { doseId: id, changed: false, status: liveStatus, snoozeCount: event.snoozeCount, snoozeUntil: event.snoozeUntil };
      }

      const horizonEnd = new Date(at.getTime() + HORIZON_DAYS * 86_400_000);
      const fields = applySnooze(event, {
        now: at,
        snoozeMinutes: settings.snoozeMinutes,
        missedAfterMinutes: settings.missedAfterMinutes,
        horizonEnd,
      });

      const [hit] = await tx
        .update(doseEvents)
        .set({
          status: "snoozed",
          snoozeCount: fields.snoozeCount,
          snoozeUntil: fields.snoozeUntil,
          missedDeadline: fields.missedDeadline,
          statusUpdatedAt: at,
        })
        .where(
          and(
            eq(doseEvents.id, doseId),
            eq(doseEvents.userId, userId),
            inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
            lt(doseEvents.snoozeCount, settings.maxSnoozes),
          ),
        )
        .returning({ id: doseEvents.id });
      if (!hit) return { doseId: id, changed: false, status: liveStatus };

      await insertAudit(tx, {
        userId,
        doseEventId: doseId,
        action: "snooze",
        occurredAt: at,
        meta: { snoozeMinutes: settings.snoozeMinutes, snoozeUntil: fields.snoozeUntil.toISOString(), snoozeCount: fields.snoozeCount },
      });
      await recomputeDaysFor(tx, userId, opts.timeZone, event.scheduledFor);
      return { doseId: id, changed: true, status: "snoozed", snoozeCount: fields.snoozeCount, snoozeUntil: fields.snoozeUntil };
    });
  },

  /** §10.4 skip — from `due|snoozed` only; optional reason is audited. */
  async skip(db: DbClient, userId: string, doseId: string, opts: SkipOptions): Promise<DoseActionResult> {
    const at = sharedNow();
    return db.transaction(async (tx) => {
      const id = doseId;
      const event = await loadOwnedEvent(tx, userId, doseId);
      const settings = await loadSettings(tx, userId);

      await applyReconcileToEvent(tx, event, { userId, now: at, missedAfterMinutes: settings.missedAfterMinutes });
      const liveStatus = deriveLiveStatus(event, at, settings.missedAfterMinutes);

      if (!canSkipDoseStatus(liveStatus)) {
        return { doseId: id, changed: false, status: liveStatus }; // incl. already-missed → not skippable
      }

      const [hit] = await tx
        .update(doseEvents)
        .set({ status: "skipped", skippedAt: at, skippedReason: opts.skipReason ?? null, statusUpdatedAt: at })
        .where(
          and(
            eq(doseEvents.id, doseId),
            eq(doseEvents.userId, userId),
            inArray(doseEvents.status, ["due", "snoozed"]),
          ),
        )
        .returning({ id: doseEvents.id });
      if (!hit) return { doseId: id, changed: false, status: liveStatus };

      await insertAudit(tx, {
        userId,
        doseEventId: doseId,
        action: "skip",
        occurredAt: at,
        meta: { reason: opts.skipReason ?? null },
      });
      await recomputeDaysFor(tx, userId, opts.timeZone, event.scheduledFor);
      return { doseId: id, changed: true, status: "skipped" };
    });
  },
};

/* What the event's status is right now (post-reconcile), never the stale row we loaded. */
function deriveLiveStatus(
  event: Pick<typeof doseEvents.$inferSelect, "status" | "scheduledFor" | "missedDeadline" | "snoozeUntil">,
  at: Date,
  missedAfterMinutes: number,
): DoseEventStatus {
  return deriveNextStatus(event, at, missedAfterMinutes).status;
}