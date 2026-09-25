import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CalendarClock,
  HelpCircle,
  History,
  Home,
  LayoutDashboard,
  MoreHorizontal,
  Pill,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import type { NavIconName } from "@shared/nav";

/**
 * Phase 08 — `NavIconName` → lucide map. The nav *model* (`src/shared/nav.ts`)
 * stays React-free; the shell resolves names here in exactly one place.
 */
export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  medications: Pill,
  schedule: CalendarClock,
  history: History,
  adherence: ShieldCheck,
  insights: Sparkles,
  reports: BarChart3,
  caregiver: Users,
  notifications: Bell,
  settings: Settings,
  help: HelpCircle,
  plus: Plus,
  home: Home,
  more: MoreHorizontal,
};

export function NavIcon({
  name,
  className,
  "aria-hidden": ariaHidden = true,
}: {
  name: NavIconName;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  const Icon = NAV_ICONS[name];
  return <Icon className={className} aria-hidden={ariaHidden} />;
}
