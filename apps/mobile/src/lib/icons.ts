import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

import type { NavIconName } from "@shared/nav";
import type { CaregiverAlertType, InsightCategory, NotificationType } from "@shared/enums";

/**
 * Icon name mapping.
 *
 * The web shell maps `NavIconName` → lucide components in one file, keeping `shared/`
 * free of icon imports. Same trick here: `shared/nav.ts` is shared verbatim with the
 * Expo app, and this file is the only place that knows which glyph represents a name.
 * Ionicons ships inside Expo Go, so there is no font to load and no native module.
 */
export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const NAV_ICONS: Readonly<Record<NavIconName, IoniconName>> = {
  dashboard: "grid-outline",
  medications: "medkit-outline",
  schedule: "calendar-outline",
  history: "time-outline",
  adherence: "checkmark-done-outline",
  insights: "sparkles-outline",
  reports: "bar-chart-outline",
  caregiver: "people-outline",
  notifications: "notifications-outline",
  settings: "settings-outline",
  help: "help-circle-outline",
  plus: "add",
  home: "home-outline",
  more: "ellipsis-horizontal",
};

/** Mirrors `DOSE_STATUS_META[status].Icon` on the web. */
export const DOSE_STATUS_ICONS = {
  taken: "checkmark-circle",
  upcoming: "time-outline",
  "due-now": "notifications",
  missed: "alert-circle",
  skipped: "remove-circle-outline",
  snoozed: "alarm-outline",
  paused: "pause-circle-outline",
  canceled: "ban-outline",
} as const satisfies Record<string, IoniconName>;

export const NOTIFICATION_ICONS: Readonly<Record<NotificationType, IoniconName>> = {
  upcoming_dose: "alarm-outline",
  due_dose: "notifications-outline",
  missed_dose: "alert-circle-outline",
  caregiver_alert: "people-outline",
  system: "information-circle-outline",
  insight: "sparkles-outline",
  demo: "flask-outline",
};

export const INSIGHT_ICONS: Readonly<Record<InsightCategory, IoniconName>> = {
  timing_pattern: "time-outline",
  adherence_decline: "trending-down-outline",
  adherence_improvement: "trending-up-outline",
  snooze_pattern: "alarm-outline",
  medication_difference: "medkit-outline",
  missed_analysis: "analytics-outline",
  general: "sparkles-outline",
};

export const ALERT_ICONS: Readonly<Record<CaregiverAlertType, IoniconName>> = {
  missed_dose: "alert-circle-outline",
  adherence_drop: "trending-down-outline",
  insight: "sparkles-outline",
  demo: "flask-outline",
};

export const TREND_ICONS = {
  improving: "trending-up",
  declining: "trending-down",
  stable: "remove-outline",
} as const satisfies Record<string, IoniconName>;

export { Ionicons };
