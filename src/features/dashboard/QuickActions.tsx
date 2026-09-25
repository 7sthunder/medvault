"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  Compass,
  Plus,
  Sparkles,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";

const ACTIONS = [
  {
    title: "Today's Schedule",
    subtitle: "View and log doses",
    href: "/schedule",
    icon: CalendarClock,
    colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20",
  },
  {
    title: "Add Medication",
    subtitle: "New prescription or slot",
    href: "/medications/new",
    icon: Plus,
    colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20",
  },
  {
    title: "Adherence Analytics",
    subtitle: "Review streak & trends",
    href: "/adherence",
    icon: BarChart3,
    colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500/20",
  },
  {
    title: "Smart Insights",
    subtitle: "Personalized advice",
    href: "/insights",
    icon: Sparkles,
    colorClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/20",
  },
];

export function QuickActions() {
  return (
    <section
      data-testid="quick-actions-section"
      className="space-y-3"
    >
      <SectionLabel tone="blue" leading={<Compass className="size-3.5" />}>
        Quick Actions
      </SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col justify-between rounded-2xl border border-border/75 bg-card/85 p-4 shadow-card-sm backdrop-blur-md hover:border-primary/50 hover:shadow-card hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 mb-3 ${action.colorClass}`}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
