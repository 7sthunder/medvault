"use client";

import { AlertTriangle, Clock, Flame, Target } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { formatInstant } from "@/lib/format";
import type { DashboardStatsDTO } from "@/shared/types";

/**
 * §11.4 widget 2 — stat rail: today's adherence, current streak, next dose time,
 * missed today. All numbers come straight from `dashboard.get` (identical to the
 * dedicated pages computed by the same §5/§10 services).
 */
export function StatRail({ stats, timeZone }: { stats: DashboardStatsDTO; timeZone: string }) {
  return (
    <section aria-label="Today at a glance" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="Today's adherence"
        value={stats.adherenceToday == null ? "—" : `${stats.adherenceToday}%`}
        icon={Target}
        tone="emerald"
        subtitle="taken of scheduled"
      />
      <StatCard
        title="Current streak"
        value={String(stats.currentStreak)}
        icon={Flame}
        tone="violet"
        subtitle={stats.currentStreak === 1 ? "day in a row" : "days in a row"}
      />
      <StatCard
        title="Next dose"
        value={stats.nextDoseTime ? formatInstant(stats.nextDoseTime, timeZone) : "—"}
        icon={Clock}
        tone="cyan"
        subtitle="in your schedule today"
      />
      <StatCard
        title="Missed today"
        value={String(stats.missedToday)}
        icon={AlertTriangle}
        tone={stats.missedToday > 0 ? "magenta" : "blue"}
        subtitle={stats.missedToday > 0 ? "take late or skip" : "all clear"}
      />
    </section>
  );
}