import type { Db, DbTx } from "@/server/db/helpers";

/**
 * Phase 11 seam — dose-event generation contract (§10.2).
 *
 * The medication service calls this after create/update/resume so generated
 * `dose_events` rows stay in lockstep with the schedule. Phase 12 implements the
 * real expansion (`shared/calc/schedule.ts` + idempotent upsert on
 * `(medicationId, scheduledFor)` + horizon rules); until then this is a thin no-op
 * so the medication CRUD contract is complete and testable on its own.
 */

export interface EnsureDoseEventsInput {
  userId: string;
  medicationId: string;
  /** Local calendar days (`YYYY-MM-DD`) to generate from. */
  from: string;
  /** Inclusive local calendar day to generate through. */
  to: string;
}

// Phase 12 replaces these no-op bodies with the real generator/voider.
export async function ensureDoseEvents(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 12 body
  _db: Db | DbTx,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 12 body
  _input: EnsureDoseEventsInput,
): Promise<{ ensured: number }> {
  return { ensured: 0 };
}

/** Void (cancel) future unresolved events for a medication from a local day on. */
export async function voidFutureEvents(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 12 body
  _db: Db | DbTx,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 12 body
  _userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 12 body
  _medicationId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 12 body
  _fromLocalDay: string,
): Promise<number> {
  return 0;
}