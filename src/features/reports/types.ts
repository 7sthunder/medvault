/**
 * Phase 20 — Reports UI state types (plan §10.9, §11.11, §20).
 */

import type { ReportGranularity } from "@/shared/enums";

export interface ReportFilterState {
  granularity: ReportGranularity;
  from: string;
  to: string;
  medicationId: string | null;
}

export type TableSortField = "period" | "scheduled" | "taken" | "missed" | "skipped" | "adherence";
export type SortDirection = "asc" | "desc";
