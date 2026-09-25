/**
 * Phase 16 — reports domain (§10.9). Reports build *exclusively* from
 * `adherenceService.summary` (the same canonical path the dashboard/adherence pages
 * read), so every number in `/reports` and the CSV export matches the rest of the app.
 * `aggregateReport` rolls the daily rows into daily/ISO-week/monthly periods.
 */

import type { DbClient } from "@/server/db/helpers";
import { adherenceService } from "@/server/domain/adherence/service";
import { combineDateAndTime, now } from "@/shared/times";
import type { ReportDTO } from "@/shared/types";
import type { ReportGranularity } from "@/shared/enums";
import { aggregateReport } from "@/shared/calc/report";

export interface GenerateReportInput {
  granularity: ReportGranularity;
  from: string;
  to: string;
  medicationId?: string | null;
}

export interface GenerateReportOptions {
  now?: Date;
}

export const reportsService = {
  /**
   * §10.9 report — reuse `adherence.summary` for a resolved local-day window (inclusive),
   * then roll the canonical `days` rows into the requested granularity. `medicationId`
   * scopes every aggregate to that med (adherence service threads it through).
   */
  async generate(
    db: DbClient,
    userId: string,
    timeZone: string,
    input: GenerateReportInput,
    options: GenerateReportOptions = {},
  ): Promise<ReportDTO> {
    const at = options.now ?? now();
    const from = combineDateAndTime(input.from, "00:00", timeZone);
    const to = combineDateAndTime(input.to, "23:59", timeZone);

    const summary = await adherenceService.summary(
      db,
      userId,
      timeZone,
      { from, to },
      input.medicationId ?? null,
      {
        now: at,
      },
    );
    const aggregate = aggregateReport(summary.days, input.granularity);

    return {
      granularity: input.granularity,
      from,
      to,
      table: aggregate.table,
      trend: aggregate.trend,
    };
  },
};
