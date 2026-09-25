/**
 * Phase 19 — History UI filter and timeline types.
 */

export type DateRangePreset = "all" | "today" | "7d" | "30d" | "90d";

export type ActionFilterOption = "all" | "take" | "skip" | "snooze" | "missed_auto";

export interface HistoryFilterState {
  rangePreset: DateRangePreset;
  from?: Date;
  to?: Date;
  medicationId?: string;
  action: ActionFilterOption;
}
