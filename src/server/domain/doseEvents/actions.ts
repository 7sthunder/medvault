/**
 * Phase 13 — User dose actions (plan §10.3, §10.4).
 *
 * Implements atomic, race-condition-free mutations for `take`, `snooze`, and `skip`.
 * Logs an append-only audit record in `dose_actions` on every action.
 */

import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { doseActions, doseEvents, medications, userPreferences } from "@/server/db/schema";
import {
  calculateSnoozeTimes,
  canSnoozeDose,
} from "@/shared/calc/doseState";
import {
  MAX_SNOOZES_DEFAULT,
  MISSED_AFTER_DEFAULT,
  SNOOZE_MIN_DEFAULT,
} from "@/shared/constants";
import { now } from "@/shared/times";
import type { DoseEventDTO } from "@/shared/types";
import { toDoseEventDTO } from "./mapper";

async function withTx<T>(db: Db | DbTx, action: (tx: DbTx) => Promise<T>): Promise<T> {
  if ("transaction" in db && typeof db.transaction === "function") {
    return db.transaction(action);
  }
  return action(db as DbTx);
}

/**
 * Record a dose as taken.
 * Plan §10.3 rule 4: taking is allowed from due, snoozed, upcoming, or missed (taking late).
 */
export async function takeDose(
  db: Db | DbTx,
  userId: string,
  doseId: string,
): Promise<DoseEventDTO> {
  const currentNow = now();

  return withTx(db, async (tx) => {
    // 1. Atomic conditional update
    const [updatedDose] = await tx
      .update(doseEvents)
      .set({
        status: "taken",
        takenAt: currentNow,
        statusUpdatedAt: currentNow,
      })
      .where(
        and(
          eq(doseEvents.id, doseId),
          eq(doseEvents.userId, userId),
          inArray(doseEvents.status, ["upcoming", "due", "snoozed", "missed"]),
        ),
      )
      .returning();

    if (!updatedDose) {
      // Diagnostic check for human-friendly error
      const existing = await tx
        .select()
        .from(doseEvents)
        .where(and(eq(doseEvents.id, doseId), eq(doseEvents.userId, userId)))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dose event not found.",
        });
      }

      const status = existing[0].status;
      if (status === "taken") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dose has already been taken.",
        });
      }
      if (status === "skipped") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot take a dose that was already skipped.",
        });
      }
      if (status === "canceled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot take a canceled dose.",
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot take dose with status "${status}".`,
      });
    }

    // 2. Append-only audit record
    await tx.insert(doseActions).values({
      id: uuidv7(),
      userId,
      doseEventId: doseId,
      action: "take",
      occurredAt: currentNow,
      meta: null,
    });

    // 3. Load medication snapshot for DTO
    const [med] = await tx
      .select()
      .from(medications)
      .where(eq(medications.id, updatedDose.medicationId))
      .limit(1);

    if (!med) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Medication record not found for dose.",
      });
    }

    return toDoseEventDTO(updatedDose, med);
  });
}

/**
 * Snooze a due or upcoming dose.
 * Plan §10.3 rule 3: delays dose by snoozeMinutes and extends missedDeadline grace.
 */
export async function snoozeDose(
  db: Db | DbTx,
  userId: string,
  doseId: string,
): Promise<DoseEventDTO> {
  const currentNow = now();

  return withTx(db, async (tx) => {
    // 1. Fetch preferences
    const [pref] = await tx
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const snoozeMinutes = pref?.snoozeMinutes ?? SNOOZE_MIN_DEFAULT;
    const maxSnoozes = pref?.maxSnoozes ?? MAX_SNOOZES_DEFAULT;
    const missedAfterMinutes = pref?.missedAfterMinutes ?? MISSED_AFTER_DEFAULT;

    // 2. Fetch current dose
    const [existing] = await tx
      .select()
      .from(doseEvents)
      .where(and(eq(doseEvents.id, doseId), eq(doseEvents.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Dose event not found.",
      });
    }

    if (!canSnoozeDose(existing.status, existing.snoozeCount, maxSnoozes)) {
      if (existing.snoozeCount >= maxSnoozes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum snoozes reached (${maxSnoozes}).`,
        });
      }
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot snooze a dose with status "${existing.status}".`,
      });
    }

    const currentMissedDeadline =
      existing.missedDeadline ??
      new Date(existing.scheduledFor.getTime() + missedAfterMinutes * 60 * 1000);

    const { snoozeUntil, missedDeadline } = calculateSnoozeTimes({
      now: currentNow,
      snoozeMinutes,
      currentMissedDeadline,
      missedAfterMinutes,
    });

    const nextSnoozeCount = existing.snoozeCount + 1;

    // 3. Atomic conditional update
    const [updatedDose] = await tx
      .update(doseEvents)
      .set({
        status: "snoozed",
        snoozeUntil,
        missedDeadline,
        snoozeCount: nextSnoozeCount,
        statusUpdatedAt: currentNow,
      })
      .where(
        and(
          eq(doseEvents.id, doseId),
          eq(doseEvents.userId, userId),
          inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
        ),
      )
      .returning();

    if (!updatedDose) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Dose status changed concurrently. Please refresh.",
      });
    }

    // 4. Append-only audit record
    await tx.insert(doseActions).values({
      id: uuidv7(),
      userId,
      doseEventId: doseId,
      action: "snooze",
      occurredAt: currentNow,
      meta: {
        snoozeCount: nextSnoozeCount,
        snoozeUntil: snoozeUntil.toISOString(),
      },
    });

    const [med] = await tx
      .select()
      .from(medications)
      .where(eq(medications.id, updatedDose.medicationId))
      .limit(1);

    if (!med) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Medication record not found for dose.",
      });
    }

    return toDoseEventDTO(updatedDose, med);
  });
}

/**
 * Skip a due or upcoming dose.
 * Plan §10.3 rule 5 & Grill-Me decision:
 * Disallowed for already-missed doses without explicit re-open.
 */
export async function skipDose(
  db: Db | DbTx,
  userId: string,
  doseId: string,
  skipReason?: string,
): Promise<DoseEventDTO> {
  const currentNow = now();
  const trimmedReason = skipReason?.trim() || null;

  return withTx(db, async (tx) => {
    // 1. Atomic conditional update
    const [updatedDose] = await tx
      .update(doseEvents)
      .set({
        status: "skipped",
        skippedAt: currentNow,
        skippedReason: trimmedReason,
        statusUpdatedAt: currentNow,
      })
      .where(
        and(
          eq(doseEvents.id, doseId),
          eq(doseEvents.userId, userId),
          inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
        ),
      )
      .returning();

    if (!updatedDose) {
      // Diagnostic check for human-friendly error
      const existing = await tx
        .select()
        .from(doseEvents)
        .where(and(eq(doseEvents.id, doseId), eq(doseEvents.userId, userId)))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dose event not found.",
        });
      }

      const status = existing[0].status;
      if (status === "missed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot skip a dose that is already marked as missed.",
        });
      }
      if (status === "taken") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot skip a dose that has already been taken.",
        });
      }
      if (status === "skipped") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dose has already been skipped.",
        });
      }
      if (status === "canceled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot skip a canceled dose.",
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot skip dose with status "${status}".`,
      });
    }

    // 2. Append-only audit record
    await tx.insert(doseActions).values({
      id: uuidv7(),
      userId,
      doseEventId: doseId,
      action: "skip",
      occurredAt: currentNow,
      meta: trimmedReason ? { reason: trimmedReason } : null,
    });

    const [med] = await tx
      .select()
      .from(medications)
      .where(eq(medications.id, updatedDose.medicationId))
      .limit(1);

    if (!med) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Medication record not found for dose.",
      });
    }

    return toDoseEventDTO(updatedDose, med);
  });
}
