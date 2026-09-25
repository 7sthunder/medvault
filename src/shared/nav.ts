/**
 * Phase 07 — navigation model (plan §7 shell + §11.14 settings). Single map of every
 * real, authenticated route so the shell renders no dead/fake links (Phase 09 consumes
 * this; a unit test asserts every href maps to a real route file).
 *
 * Icon model: shared stays dependency-free, so each item declares its icon by name
 * (`NavIconName`). The shell maps names → lucide components in one file, keeping
 * `shared/` free of React/lucide imports.
 */

export type NavIconName =
  | "dashboard"
  | "medications"
  | "schedule"
  | "history"
  | "adherence"
  | "insights"
  | "assistant"
  | "reports"
  | "caregiver"
  | "notifications"
  | "settings"
  | "help"
  | "plus"
  | "home"
  | "more";

export type NavGroup = "overview" | "management" | "intelligence" | "care" | "bottom";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  group: NavGroup;
  /** Shown only in the caregiver-mode patient context (Phase 21). */
  caregiverOnly?: boolean;
}

/**
 * Sidebar/bottom-nav model (plan §7):
 * Overview: Dashboard · Management: Medications, Today's Schedule, History ·
 * Intelligence: Adherence, AI Insights, Reports · Care: Caregiver ·
 * Bottom: Notifications, Settings, Help.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", group: "overview" },
  { label: "Medications", href: "/medications", icon: "medications", group: "management" },
  { label: "Today's Schedule", href: "/schedule", icon: "schedule", group: "management" },
  { label: "History", href: "/history", icon: "history", group: "management" },
  { label: "Adherence", href: "/adherence", icon: "adherence", group: "intelligence" },
  { label: "AI Insights", href: "/insights", icon: "insights", group: "intelligence" },
  { label: "Voice assistant", href: "/assistant", icon: "assistant", group: "intelligence" },
  { label: "Reports", href: "/reports", icon: "reports", group: "intelligence" },
  { label: "Caregiver", href: "/caregiver", icon: "caregiver", group: "care" },
  { label: "Notifications", href: "/notifications", icon: "notifications", group: "bottom" },
  { label: "Settings", href: "/settings/profile", icon: "settings", group: "bottom" },
  { label: "Help", href: "/help", icon: "help", group: "bottom" },
] as const;

/** Settings vertical menu (plan §11.14 layout). */
export interface SettingsNavItem {
  label: string;
  href: string;
  icon: NavIconName;
}

export const SETTINGS_NAV: readonly SettingsNavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: "settings" },
  { label: "Reminders", href: "/settings/reminders", icon: "schedule" },
  { label: "Caregiver", href: "/settings/caregiver", icon: "caregiver" },
  { label: "Appearance", href: "/settings/appearance", icon: "insights" },
  { label: "Your data", href: "/settings/data", icon: "reports" },
] as const;

/** Bottom navigation (mobile < md, plan §7/§16): Home, Schedule, Add, More. */
export const BOTTOM_NAV: readonly {
  label: string;
  href: string;
  icon: NavIconName;
  add?: boolean;
}[] = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Schedule", href: "/schedule", icon: "schedule" },
  { label: "Add", href: "/medications/new", icon: "plus", add: true },
  { label: "More", href: "more", icon: "more" },
] as const;

/** Group order used to render the sidebar sections. */
export const NAV_GROUP_ORDER: readonly NavGroup[] = [
  "overview",
  "management",
  "intelligence",
  "care",
  "bottom",
];

/** All nav hrefs (used by the "every href is real" route test + active-state logic). */
export const ALL_NAV_HREFS: readonly string[] = [
  ...NAV_ITEMS.map((i) => i.href),
  ...SETTINGS_NAV.map((i) => i.href),
  "/medications/new",
  "/medications/[id]",
  "/medications/[id]/edit",
  "/schedule/[doseId]",
  "/adherence/medications",
  "/caregiver/alerts/[id]",
  "/caregiver/accept",
];
