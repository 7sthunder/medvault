"use client";

import {
  Bell,
  Clock,
  HeartHandshake,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_TABS, type NotificationTab } from "@/shared/enums";

interface NotificationTabsProps {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (unreadOnly: boolean) => void;
}

const TAB_CONFIG: Record<
  NotificationTab,
  { label: string; icon: typeof LayoutGrid }
> = {
  all: { label: "All", icon: LayoutGrid },
  dose: { label: "Doses", icon: Clock },
  caregiver: { label: "Caregiver", icon: HeartHandshake },
  ai: { label: "AI Insights", icon: Sparkles },
  system: { label: "System", icon: Bell },
};

export function NotificationTabs({
  activeTab,
  onTabChange,
  unreadOnly,
  onUnreadOnlyChange,
}: NotificationTabsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Tab Pills */}
      <div
        role="tablist"
        aria-label="Notification categories"
        className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/60 p-1 text-xs"
      >
        {NOTIFICATION_TABS.map((tab) => {
          const config = TAB_CONFIG[tab];
          const Icon = config.icon;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-all ${
                isActive
                  ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100 font-semibold"
                  : "text-muted-foreground hover:text-ink-900"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Unread Only Switch */}
      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-ink-900">
        <Switch
          checked={unreadOnly}
          onCheckedChange={onUnreadOnlyChange}
          aria-label="Filter unread notifications"
        />
        <span className="font-medium">Unread only</span>
      </label>
    </div>
  );
}
