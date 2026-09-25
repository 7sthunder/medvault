"use client";

import { AlertTriangle, CheckCircle2, Flame, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { AdherenceSummaryDTO } from "@/shared/types";

export interface StatRailProps {
  summary: AdherenceSummaryDTO;
}

export function StatRail({ summary }: StatRailProps) {
  const adherenceVal =
    summary.adherencePercent !== null ? `${summary.adherencePercent}%` : "No data";

  const streakDays = summary.streak.current;
  const longestDays = summary.streak.longest;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Overall Adherence */}
      <StatCard
        title="Adherence Rate"
        value={adherenceVal}
        icon={ShieldCheck}
        tone="emerald"
        subtitle={
          summary.scheduled > 0
            ? `${summary.taken} of ${summary.scheduled} doses taken`
            : "No doses in this period"
        }
      />

      {/* Streak */}
      <StatCard
        title="Current Streak"
        value={`${streakDays} day${streakDays === 1 ? "" : "s"}`}
        icon={Flame}
        tone="amber"
        subtitle={`Best run: ${longestDays} day${longestDays === 1 ? "" : "s"}`}
      />

      {/* Taken */}
      <StatCard
        title="Doses Taken"
        value={String(summary.taken)}
        icon={CheckCircle2}
        tone="cyan"
        subtitle={
          summary.snoozed > 0
            ? `${summary.snoozed} snoozed prior`
            : "Direct completions"
        }
      />

      {/* Missed / Skipped */}
      <StatCard
        title="Missed / Skipped"
        value={`${summary.missed} / ${summary.skipped}`}
        icon={AlertTriangle}
        tone="magenta"
        subtitle={
          summary.trend.direction === "improving"
            ? "Trend improving vs prior"
            : summary.trend.direction === "declining"
              ? "Trend declining vs prior"
              : "Stable trend vs prior"
        }
      />
    </div>
  );
}
