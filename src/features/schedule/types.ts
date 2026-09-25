/**
 * Phase 14 — Schedule feature types and filters.
 */

import type { DoseEventDTO } from "@/shared/types";
import type { TimeBucket } from "@/shared/enums";

export type ScheduleFilterTab = "all" | "due" | "taken" | "missed";

export interface ScheduleBucketGroup {
  bucket: TimeBucket;
  title: string;
  timeRangeText: string;
  doses: DoseEventDTO[];
}
