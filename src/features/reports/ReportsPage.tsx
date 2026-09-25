"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/trpc";
import type { ReportGranularity } from "@/shared/enums";
import { DownloadButton } from "./DownloadButton";
import { GranularityTabs } from "./GranularityTabs";
import { MissedAnalysis } from "./MissedAnalysis";
import { SummaryTable } from "./SummaryTable";
import { TrendChartBlock } from "./TrendChartBlock";

/**
 * Phase 20 — Primary Reports & Analytics View (plan §10.9, §11.11, §20).
 *
 * Physician-ready adherence reporting interface supporting:
 * - Granularity: Daily / Weekly / Monthly.
 * - Date Range: 7d, 30d, 90d, custom.
 * - Scope: All medications or single medication.
 * - KPI summary cards, adherence trend area chart, missed-dose multi-dimensional breakdown,
 *   and audit breakdown table.
 * - Authenticated RFC 4180 CSV export streaming.
 */
export function ReportsPage() {
  const defaultTo = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, []);

  const [range, setRange] = useState<DateRange>({
    from: defaultFrom,
    to: defaultTo,
  });
  const [granularity, setGranularity] = useState<ReportGranularity>("daily");
  const [medicationId, setMedicationId] = useState<string>("");

  const reportQuery = api.reports.get.useQuery({
    from: range.from,
    to: range.to,
    granularity,
    medicationId: medicationId || undefined,
  });

  const medListQuery = api.medication.list.useQuery();
  const medications = medListQuery.data ?? [];

  const handleResetFilters = () => {
    setRange({ from: defaultFrom, to: defaultTo });
    setGranularity("daily");
    setMedicationId("");
  };

  const isFiltered =
    range.from !== defaultFrom ||
    range.to !== defaultTo ||
    granularity !== "daily" ||
    Boolean(medicationId);

  return (
    <div data-testid="reports-page" className="space-y-8">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-ink-100">
            Adherence Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinical-grade adherence summaries, audit tables, and exported records.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <RangePicker
            value={range}
            onChange={setRange}
            ariaLabel="Report date range"
          />

          {/* Medication Scope Select */}
          <select
            data-testid="reports-medication-select"
            aria-label="Filter by medication"
            value={medicationId}
            onChange={(e) => setMedicationId(e.target.value)}
            className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-medium text-ink-900 shadow-card-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 dark:text-ink-100"
          >
            <option value="">All Medications</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.archivedAt ? "(Archived)" : ""}
              </option>
            ))}
          </select>

          <GranularityTabs
            value={granularity}
            onChange={setGranularity}
          />

          <DownloadButton
            from={range.from}
            to={range.to}
            granularity={granularity}
            medicationId={medicationId || null}
            disabled={reportQuery.isLoading || reportQuery.isError}
          />

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1.5 text-xs text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Query Status: Loading */}
      {reportQuery.isLoading && (
        <div data-testid="reports-loading" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {/* Query Status: Error */}
      {reportQuery.isError && (
        <div data-testid="reports-error" className="rounded-2xl border border-border bg-card p-8">
          <ErrorState
            icon={AlertTriangle}
            title="Failed to load adherence report"
            description={reportQuery.error.message || "An unexpected error occurred while compiling your report."}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => reportQuery.refetch()}
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                <span>Retry</span>
              </Button>
            }
          />
        </div>
      )}

      {/* Query Status: Success */}
      {reportQuery.isSuccess && reportQuery.data && (
        <div data-testid="reports-content" className="space-y-8">
          {/* 1. Top KPI Summary Cards */}
          {(() => {
            const summary = reportQuery.data.summary;
            const adherence = summary.adherencePercent;
            const tone =
              adherence !== null && adherence >= 80
                ? "emerald"
                : adherence !== null && adherence >= 60
                  ? "amber"
                  : "magenta";

            return (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard
                  title="Overall Adherence"
                  value={adherence !== null ? `${adherence}%` : "N/A"}
                  icon={Activity}
                  tone={tone}
                  subtitle={`${summary.taken} of ${summary.scheduled} doses`}
                />
                <StatCard
                  title="Total Scheduled"
                  value={String(summary.scheduled)}
                  icon={Calendar}
                  tone="cyan"
                  subtitle="Expected doses"
                />
                <StatCard
                  title="Total Taken"
                  value={String(summary.taken)}
                  icon={CheckCircle2}
                  tone="emerald"
                  subtitle="Recorded intake"
                />
                <StatCard
                  title="Total Missed"
                  value={String(summary.missed)}
                  icon={AlertTriangle}
                  tone={summary.missed > 0 ? "amber" : "emerald"}
                  subtitle={summary.missed > 0 ? "Unresolved doses" : "Clean record"}
                />
                <StatCard
                  title="Total Skipped"
                  value={String(summary.skipped)}
                  icon={SkipForward}
                  tone="violet"
                  subtitle="Intentionally skipped"
                />
              </div>
            );
          })()}

          {/* 2. Adherence Trend Series */}
          <section aria-labelledby="trend-section-heading">
            <h2 id="trend-section-heading" className="sr-only">
              Adherence Trend
            </h2>
            <TrendChartBlock
              trend={reportQuery.data.trend}
              granularity={granularity}
            />
          </section>

          {/* 3. Missed Dose Multi-Dimensional Analysis */}
          <section aria-labelledby="missed-analysis-heading">
            <h2 id="missed-analysis-heading" className="sr-only">
              Missed Dose Analysis
            </h2>
            <MissedAnalysis data={reportQuery.data.missedAnalysis} />
          </section>

          {/* 4. Detailed Audit Breakdown Table */}
          <section aria-labelledby="table-section-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary-dark dark:text-primary">
                  <FileSpreadsheet className="size-4" />
                </div>
                <div>
                  <h2 id="table-section-heading" className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">
                    Granular Audit Breakdown
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Chronological audit log grouped by {granularity} intervals
                  </p>
                </div>
              </div>
            </div>

            <SummaryTable
              rows={reportQuery.data.table}
              granularity={granularity}
            />
          </section>
        </div>
      )}
    </div>
  );
}
