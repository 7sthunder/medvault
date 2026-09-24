import type { Db } from "@/server/db/helpers";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import { catchUp } from "@/server/domain/doseEvents/service";

/**
 * Phase 12 — hourly-ish reconcile job skeleton (§10.2 / plan Phase 12+13).
 *
 * NOT a client timer: a server-side `setInterval` safety net that calls `catchUp` for
 * every onboarded user. Reads are the primary catch-up path (they call `catchUp` on
 * demand); this job only backstops day-boundary gaps. Phase 13 threads `reconcile`
 * (missed detection) into this same loop. Never auto-starts — callers opt in.
 */

export interface SchedulerHandle {
  stop: () => void;
  tick: () => Promise<{ users: number; ensured: number }>;
  running: () => boolean;
}

let active = false;

/**
 * Run one catch-up pass for all users that have finished onboarding.
 * Returns the tally for logging/test assertions.
 */
export async function runCatchUpPass(db: Db): Promise<{ users: number; ensured: number }> {
  const onboarded = await db.select({ id: users.id, timezone: users.timezone }).from(users).where(eq(users.onboardingCompleted, true));
  let ensured = 0;
  for (const user of onboarded) {
    const res = await catchUp(db, user.id, user.timezone);
    ensured += res.ensured;
  }
  return { users: onboarded.length, ensured };
}

/**
 * Start the interval job. `intervalMs` defaults to one hour (dose horizon is 14 days, so a
 * drift of one hour is immaterial). Returns a handle with `stop()` for shutdown.
 */
export function startScheduler(db: Db, options: { intervalMs?: number } = {}): SchedulerHandle {
  const intervalMs = options.intervalMs ?? 60 * 60 * 1000;

  const runOnce = async (): Promise<{ users: number; ensured: number }> => {
    if (active) return { users: 0, ensured: 0 };
    active = true;
    try {
      return await runCatchUpPass(db);
    } finally {
      active = false;
    }
  };

  const timer = setInterval(() => {
    void runOnce().catch((err) => {
      // Phase 22 logs/reports these; never throw from the interval.
      console.error("[scheduler] catch-up pass failed:", err);
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