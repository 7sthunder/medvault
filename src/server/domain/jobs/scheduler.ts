import type { Db } from "@/server/db/helpers";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import { catchUp } from "@/server/domain/doseEvents/service";
import { reconcileUser } from "@/server/domain/doseEvents/reconcile";
import { pruneAdherence } from "@/server/domain/adherence/materialize";
import { caregiverService } from "@/server/domain/caregiver/service";
import { log } from "@/lib/log";

/**
 * Phase 13 — hourly-ish reconcile job (§10.2 + §10.3 safety net).
 *
 * NOT a client timer: a server-side `setInterval` safety net. Every pass, per onboarded
 * user: `catchUp` (generate horizon dose events) → `reconcileUser` (missed detection, due
 * flips) → `pruneAdherence` (keep the rollup history window bounded). Reads are the primary
 * canonical path (they reconcile on demand); this job only backstops day-boundary gaps.
 * Never auto-starts — callers opt in.
 */

export interface ReconcilePassResult {
  users: number;
  ensured: number;
  reconciled: number;
  missed: number;
  pruned: number;
  adherenceDropAlerts: number;
}

let active = false;

/**
 * Run one catch-up + reconcile + prune pass for all users that finished onboarding.
 * Returns the tally for logging/test assertions.
 */
export async function runReconcilePass(db: Db): Promise<ReconcilePassResult> {
  const onboarded = await db
    .select({ id: users.id, timezone: users.timezone })
    .from(users)
    .where(eq(users.onboardingCompleted, true));
  let ensured = 0;
  let reconciled = 0;
  let missed = 0;
  let pruned = 0;
  let adherenceDropAlerts = 0;
  for (const user of onboarded) {
    const res = await catchUp(db, user.id, user.timezone);
    ensured += res.ensured;
    const rec = await reconcileUser(db, user.id);
    reconciled += rec.reconciled;
    missed += rec.missed;
    adherenceDropAlerts += await caregiverService.evaluateAdherenceDrop(db, user.id, user.timezone);
    pruned += await pruneAdherence(db, user.id);
  }
  return { users: onboarded.length, ensured, reconciled, missed, pruned, adherenceDropAlerts };
}

/** Kept as the Phase 12 alias so existing callers/tests keep working. */
export const runCatchUpPass = runReconcilePass;

/**
 * Start the interval job. `intervalMs` defaults to one hour (dose horizon is 14 days, so a
 * drift of one hour is immaterial). Returns a handle with `stop()` for shutdown.
 */
export function startScheduler(
  db: Db,
  options: { intervalMs?: number } = {},
): { stop: () => void; tick: () => Promise<ReconcilePassResult>; running: () => boolean } {
  const intervalMs = options.intervalMs ?? 60 * 60 * 1000;

  const runOnce = async (): Promise<ReconcilePassResult> => {
    if (active)
      return { users: 0, ensured: 0, reconciled: 0, missed: 0, pruned: 0, adherenceDropAlerts: 0 };
    active = true;
    try {
      return await runReconcilePass(db);
    } finally {
      active = false;
    }
  };

  const timer = setInterval(() => {
    void runOnce().catch((error) => {
      log.error("Scheduler reconcile pass failed", { error });
    });
  }, intervalMs);

  // Fire once immediately so a freshly started process catches up right away.
  void runOnce().catch(() => void 0);

  return {
    stop: () => clearInterval(timer),
    tick: runOnce,
    running: () => active,
  };
}
