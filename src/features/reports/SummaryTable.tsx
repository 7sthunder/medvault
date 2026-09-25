"use client";

import React from "react";

import { Chip } from "@/components/ui/chip";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatPercent } from "@/lib/format";
import { periodLabel } from "@/shared/calc/report";
import type { ReportGranularity } from "@/shared/enums";
import type { ReportRow } from "@/shared/types";

/**
 * §11.11 breakdown table — one row per period (day/week/month), totals + adherence%.
 * Reuses the shared `DataTable` (sort + pagination inline).
 */
export function SummaryTable({
  granularity,
  rows,
}: {
  granularity: ReportGranularity;
  rows: ReportRow[];
}) {
  const columns: readonly DataTableColumn<ReportRow>[] = [
    {
      key: "period",
      header: granularity === "daily" ? "Day" : granularity === "weekly" ? "Week" : "Month",
      value: (row) => periodLabel(row.period, granularity),
      render: (row) => (
        <span className="font-medium text-ink-900">{periodLabel(row.period, granularity)}</span>
      ),
    },
    { key: "scheduled", header: "Scheduled", value: (row) => row.scheduled, align: "right" },
    { key: "taken", header: "Taken", value: (row) => row.taken, align: "right" },
    {
      key: "missed",
      header: "Missed",
      value: (row) => row.missed,
      align: "right",
      render: (row) =>
        row.missed > 0 ? (
          <span className="font-semibold text-ink-900">{row.missed}</span>
        ) : (
          <span className="text-muted-foreground">{row.missed}</span>
        ),
    },
    { key: "skipped", header: "Skipped", value: (row) => row.skipped, align: "right" },
    {
      key: "adherence",
      header: "Adherence",
      value: (row) => row.adherencePercent ?? -1,
      align: "right",
      sortable: true,
      render: (row) =>
        row.adherencePercent == null ? (
          <span className="text-muted-foreground">No data</span>
        ) : (
          <Chip
            tone={
              row.adherencePercent >= 80
                ? "emerald"
                : row.adherencePercent >= 60
                  ? "amber"
                  : "magenta"
            }
          >
            {formatPercent(row.adherencePercent)}
          </Chip>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.period}
      ariaLabel={`${granularity} adherence report`}
      emptyTitle="No data in this range"
      emptyDescription="Doses you take will appear here period by period."
      pageSize={0}
    />
  );
}
