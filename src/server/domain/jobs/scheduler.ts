/**
 * Phase 12 — Server-side scheduler skeleton (plan §10.2).
 *
 * Runs periodic maintenance:
 * - Extends the 14-day dose event horizon as time advances ("catch-up").
 * - Prepares the hook for Phase 13 auto-missed reconciliation.
 */

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import type { Db } from "@/server/db/helpers";
import { users } from "@/server/db/schema";
import { catchUpDoseEvents } from "@/server/domain/doseEvents/service";

export interface ReconcileJobStats {
  usersProcessed: number;
  totalGenerated: number;
  errors: Array<{ userId: string; error: string }>;
}

/**
 * Runs a single pass of the schedule extension job across all active users.
 */
export async function runReconcileJob(client: Db = db): Promise<ReconcileJobStats> {
  const stats: ReconcileJobStats = {
    usersProcessed: 0,
    totalGenerated: 0,
    errors: [],
  };

  const activeUsers = await client
    .select({ id: users.id, timezone: users.timezone })
    .from(users)
    .where(eq(users.onboardingCompleted, true));

  for (const user of activeUsers) {
    try {
      const res = await catchUpDoseEvents(client, user.id, user.timezone);
      stats.usersProcessed++;
      stats.totalGenerated += res.generatedCount;
    } catch (err) {
      stats.errors.push({
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return stats;
}

let intervalTimer: NodeJS.Timeout | null = null;

/**
 * Start recurring background scheduler (for persistent server environments).
 */
export function startScheduler(client: Db = db, intervalMs: number = 3600000): void {
  if (intervalTimer) return;
  intervalTimer = setInterval(async () => {
    try {
      await runReconcileJob(client);
    } catch (e) {
      console.error("[Scheduler] Error running reconcile job:", e);
    }
  }, intervalMs);
}

/**
 * Stop recurring background scheduler.
 */
export function stopScheduler(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}
