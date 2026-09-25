"use client";

import type { ScheduleFilterTab } from "./types";

export interface ScheduleFilterTabsProps {
  activeTab: ScheduleFilterTab;
  onTabChange: (tab: ScheduleFilterTab) => void;
  counts: Record<ScheduleFilterTab, number>;
}

export function ScheduleFilterTabs({
  activeTab,
  onTabChange,
  counts,
}: ScheduleFilterTabsProps) {
  const tabs: Array<{ id: ScheduleFilterTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "due", label: "Due / Next" },
    { id: "taken", label: "Taken" },
    { id: "missed", label: "Missed / Skipped" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3.5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-primary-btn scale-102"
                : "bg-card/80 border border-border/70 text-muted-foreground hover:bg-muted/80 hover:text-ink-900 dark:hover:text-ink-100 hover:border-border"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive
                  ? "bg-white/25 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
