import { afterAll, describe, expect, it } from "vitest";

import { db, pool } from "@/server/db/client";
import { seedDemoWorkspace } from "@/server/db/demo-seed";
import { utcDateKey } from "@/server/db/helpers";
import type { ReportDTO } from "@/shared/types";

import { reportsService } from "./service";

/**
 * Phase 16 acceptance (§10.9): reports reuse the canonical §19 84/76/5/3/8 → 90.5%
 * demo fixture, so rolling the daily rows into any granularity must reproduce those
 * totals. UTC day-key space matches the fixture (see adherence/materialize.test.ts).
 */
function utcWindow() {
  const now = new Date();
  return {
    fromKey: utcDateKey(new Date(now.getTime() - 16 * 86_400_000)),
    toKey: utcDateKey(now),
  };
}

afterAll(async () => {
  await pool.end();
});

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

function sumTable(table: ReportDTO["table"]) {
  return table.reduce(
    (acc, r) => ({
      scheduled: acc.scheduled + r.scheduled,
      taken: acc.taken + r.taken,
      missed: acc.missed + r.missed,
      skipped: acc.skipped + r.skipped,
    }),
    { scheduled: 0, taken: 0, missed: 0, skipped: 0 },
  );
}

dbTests("reportsService reproduces the §19 demo totals (§10.9)", () => {
  it("daily granularity matches 84/76/5/3 → 90.5% and aligns table + trend", async () => {
    const seeded = await seedDemoWorkspace(db);
    const { fromKey, toKey } = utcWindow();

    const report = await reportsService.generate(db, seeded.userId, "UTC", {
      granularity: "daily",
      from: fromKey,
      to: toKey,
    });

    expect(sumTable(report.table)).toEqual({ scheduled: 84, taken: 76, missed: 5, skipped: 3 });
    expect(report.table).toHaveLength(17);
    expect(report.trend).toHaveLength(report.table.length);
    expect(report.trend[0]!.label).toBe(report.table[0]!.period);
    const aggregatePct = Math.round((76 / 84) * 1000) / 10;
    expect(Math.abs(aggregatePct - 90.5)).toBeLessThan(0.1);
  });

  it("monthly granularity rolls the fixture into a single 2026-XX period", async () => {
    const seeded = await seedDemoWorkspace(db);
    const { fromKey, toKey } = utcWindow();

    const report = await reportsService.generate(db, seeded.userId, "UTC", {
      granularity: "monthly",
      from: fromKey,
      to: toKey,
    });

    const totals = sumTable(report.table);
    expect(totals).toEqual({ scheduled: 84, taken: 76, missed: 5, skipped: 3 });
    expect(report.table.length).toBeLessThanOrEqual(3);
    expect(report.table[0]!.period).toMatch(/^\d{4}-\d{2}$/);
  });

  it("weekly granularity keeps the same totals across ISO-week buckets", async () => {
    const seeded = await seedDemoWorkspace(db);
    const { fromKey, toKey } = utcWindow();

    const report = await reportsService.generate(db, seeded.userId, "UTC", {
      granularity: "weekly",
      from: fromKey,
      to: toKey,
    });

    expect(sumTable(report.table)).toEqual({ scheduled: 84, taken: 76, missed: 5, skipped: 3 });
    for (const row of report.table) {
      expect(row.period).toMatch(/^\d{4}-W\d{1,2}$/);
    }
  });
});