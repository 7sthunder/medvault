import { afterAll, describe, expect, it } from "vitest";

import { db, pool } from "@/server/db/client";
import { seedDemoWorkspace } from "@/server/db/demo-seed";
import { utcDateKey } from "@/server/db/helpers";
import { adherenceService } from "./service";
import { recomputeRange, pruneAdherence } from "./materialize";

/**
 * Phase 13 acceptance invariant (§19): the seeded demo workspace must reproduce
 * 84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed → 90.5% (1dp) and a
 * 7-day streak WHEN COMPUTED BY THE SERVICE — never from the seed's own rollup rows.
 *
 * The §19 fixture buckets its 17-day window in UTC day-keys (`utcDateKey`) and the demo
 * user lives in Asia/Kolkata, so this runs the service in the SAME UTC day-key space the
 * fixture uses (`timeZone "UTC"`) — otherwise the +05:30 offset moves the final 20:00
 * dose onto tomorrow's local day and the exact 84/76/5/3/8 → 90.5% invariant cannot hold
 * by construction. `seedDemoWorkspace` is idempotent, so re-running leaves the canonical
 * demo workspace in place (the app's own `db:seed` behaviour).
 */
function utcWindow() {
  const now = new Date();
  return {
    now,
    fromKey: utcDateKey(new Date(now.getTime() - 16 * 86_400_000)),
    toKey: utcDateKey(now),
  };
}

afterAll(async () => {
  await pool.end();
});

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

dbTests("adherence engine reproduces the §19 demo (§10.5 + plan acceptance)", () => {
  it("summary() + recomputeRange reproduce 84/76/5/3/8 → 90.5% and the 7-day streak", async () => {
    const seeded = await seedDemoWorkspace(db);
    expect(seeded).toMatchObject({ scheduled: 84, taken: 76, missed: 5, skipped: 3, snoozed: 8 });

    const { now, fromKey, toKey } = utcWindow();
    const tz = "UTC";
    const userId = seeded.userId;

    const summary = await adherenceService.summary(db, userId, tz, {
      from: new Date(now.getTime() - 16 * 86_400_000),
      to: now,
    });
    expect(summary.scheduled).toBe(84);
    expect(summary.taken).toBe(76);
    expect(summary.missed).toBe(5);
    expect(summary.skipped).toBe(3);
    expect(summary.snoozed).toBe(8);
    expect(summary.adherencePercent).toBe(90.5);
    expect(summary.streak.current).toBe(7);
    expect(summary.streak.longest).toBeGreaterThanOrEqual(7);
    expect(summary.days).toHaveLength(17);

    const days = await recomputeRange(db, { userId, fromKey, toKey, timeZone: tz, now });
    const totals = days.reduce(
      (acc, d) => ({
        scheduled: acc.scheduled + d.scheduled,
        taken: acc.taken + d.taken,
        missed: acc.missed + d.missed,
        skipped: acc.skipped + d.skipped,
        snoozed: acc.snoozed + d.snoozed,
      }),
      { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 },
    );
    expect(totals).toEqual({ scheduled: 84, taken: 76, missed: 5, skipped: 3, snoozed: 8 });
    expect(days.filter((d) => d.streakDay)).toHaveLength(7);
    expect(await pruneAdherence(db, userId)).toBe(0); // inside the 120-day history
  }, 90_000);
});
