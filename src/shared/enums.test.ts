import { describe, expect, it } from "vitest";

import {
  ALERT_STATUSES,
  CAREGIVER_ALERT_TYPES,
  CAREGIVER_RELATIONSHIP_STATUSES,
  DOSE_EVENT_STATUSES,
  DOSE_STATUSES,
  FREQUENCY_LABEL_TEXT,
  FREQUENCY_LABELS,
  INSIGHT_CATEGORIES,
  INSIGHT_SOURCES,
  INVITATION_STATUSES,
  MEDICATION_STATUSES,
  NOTIFICATION_TYPES,
  RANGE_PRESET_TEXT,
  RANGE_PRESETS,
  RELATION_TYPES,
  REPORT_GRANULARITY_TEXT,
  REPORT_GRANULARITIES,
  SUGGESTED_ACTIONS,
  THEMES,
  TIME_BUCKET_TEXT,
  TIME_BUCKETS,
  UI_DENSITIES,
  USER_DOSE_ACTIONS,
} from "./enums";

const unique = (arr: readonly unknown[]) => new Set(arr).size === arr.length;

describe("shared/enums — single source of truth", () => {
  it("defines the §12 display statuses and the persistent model separately", () => {
    expect(DOSE_STATUSES).toEqual([
      "taken",
      "upcoming",
      "due-now",
      "missed",
      "skipped",
      "snoozed",
      "paused",
      "canceled",
    ]);
    // Display = model − {due} + the two derived/display-only members (due-now, paused).
    expect([...DOSE_STATUSES, "due"].sort()).toEqual(
      [...DOSE_EVENT_STATUSES, "due-now", "paused"].sort(),
    );
  });

  it("keeps every list unique and non-empty", () => {
    const lists = [
      DOSE_STATUSES,
      DOSE_EVENT_STATUSES,
      MEDICATION_STATUSES,
      USER_DOSE_ACTIONS,
      CAREGIVER_RELATIONSHIP_STATUSES,
      RELATION_TYPES,
      INVITATION_STATUSES,
      CAREGIVER_ALERT_TYPES,
      ALERT_STATUSES,
      NOTIFICATION_TYPES,
      INSIGHT_CATEGORIES,
      INSIGHT_SOURCES,
      SUGGESTED_ACTIONS,
      THEMES,
      UI_DENSITIES,
      FREQUENCY_LABELS,
      TIME_BUCKETS,
      REPORT_GRANULARITIES,
      RANGE_PRESETS,
    ];
    for (const list of lists) {
      expect(list.length, `${String(list)}`).toBeGreaterThan(0);
      expect(unique(list), `${String(list)} should be unique`).toBe(true);
    }
  });

  it("USER_DOSE_ACTIONS is a strict subset of the audit action log", () => {
    for (const action of USER_DOSE_ACTIONS) {
      expect(action).toBeDefined();
    }
  });

  it("maps every enum to human-readable text", () => {
    for (const bucket of TIME_BUCKETS) expect(TIME_BUCKET_TEXT[bucket]).toBeTruthy();
    for (const g of REPORT_GRANULARITIES) expect(REPORT_GRANULARITY_TEXT[g]).toBeTruthy();
    for (const p of RANGE_PRESETS) expect(RANGE_PRESET_TEXT[p]).toBeTruthy();
    for (const f of FREQUENCY_LABELS) expect(FREQUENCY_LABEL_TEXT[f]).toBeTruthy();
  });
});
