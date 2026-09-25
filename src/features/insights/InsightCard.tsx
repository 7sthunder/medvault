"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Brain,
  Calendar,
  Clock,
  Flame,
  Pill,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InsightCategory, SuggestedAction } from "@/shared/enums";
import type { InsightDTO } from "@/shared/types";

interface InsightCardProps {
  insight: InsightDTO;
}

function getCategoryConfig(category: InsightCategory) {
  switch (category) {
    case "timing_pattern":
      return {
        label: "Timing Pattern",
        icon: Clock,
        badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
      };
    case "snooze_pattern":
      return {
        label: "Snooze Pattern",
        icon: Bell,
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      };
    case "adherence_improvement":
      return {
        label: "Adherence Momentum",
        icon: TrendingUp,
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      };
    case "adherence_decline":
      return {
        label: "Adherence Notice",
        icon: TrendingDown,
        badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
      };
    case "medication_difference":
      return {
        label: "Medication Variance",
        icon: Pill,
        badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
      };
    case "missed_analysis":
      return {
        label: "Missed Dose Analysis",
        icon: Flame,
        badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      };
    default:
      return {
        label: "Habit Pattern",
        icon: Brain,
        badgeClass: "bg-primary/10 text-primary dark:text-primary-light border-primary/20",
      };
  }
}

function getActionConfig(action: SuggestedAction | null) {
  if (!action) return null;

  switch (action) {
    case "review_schedule":
      return {
        label: "Review Schedule",
        href: "/schedule",
        icon: Calendar,
      };
    case "review_reminders":
      return {
        label: "Adjust Reminders",
        href: "/settings/reminders",
        icon: Bell,
      };
    case "review_caregiver":
      return {
        label: "Caregiver Support",
        href: "/caregiver",
        icon: Users,
      };
    case "encourage":
      return {
        label: "View Streak",
        href: "/adherence",
        icon: Flame,
      };
    default:
      return null;
  }
}

function formatRelativeTime(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function InsightCard({ insight }: InsightCardProps) {
  const categoryConfig = getCategoryConfig(insight.category);
  const actionConfig = getActionConfig(insight.suggestedActionType);
  const CategoryIcon = categoryConfig.icon;

  const isAi = insight.source === "ai";
  const confidencePercent = insight.confidence ? Math.round(insight.confidence * 100) : null;

  return (
    <article
      data-testid={`insight-card-${insight.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 shadow-xs hover:border-violet-500/30 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Category Chip */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryConfig.badgeClass}`}
          >
            <CategoryIcon className="size-3.5" />
            {categoryConfig.label}
          </span>

          <div className="flex items-center gap-2">
            {/* Source Tag */}
            {isAi ? (
              <span
                data-testid="insight-source-ai"
                className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300"
              >
                <Sparkles className="size-3" />
                AI Generated
              </span>
            ) : (
              <span
                data-testid="insight-source-fallback"
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <Brain className="size-3" />
                Pattern Analysis
              </span>
            )}

            {/* Confidence Badge */}
            {confidencePercent !== null && (
              <span className="text-[11px] font-medium text-muted-foreground/80">
                {confidencePercent}% conf
              </span>
            )}
          </div>
        </div>

        {/* Content Section: Sanitized Plain Text */}
        <div className="space-y-1.5 pt-1">
          <h3 className="font-heading text-base font-bold text-foreground leading-snug">
            {insight.summary}
          </h3>
          {insight.detail && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.detail}
            </p>
          )}
        </div>
      </div>

      {/* Footer Row: Timestamp & Action */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(insight.createdAt)}
        </span>

        {actionConfig && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-medium text-primary hover:text-primary-dark dark:hover:text-primary-light"
            nativeButton={false}
            render={<Link href={actionConfig.href} />}
          >
            <actionConfig.icon className="size-3.5" />
            <span>{actionConfig.label}</span>
            <ArrowRight className="size-3" />
          </Button>
        )}
      </div>
    </article>
  );
}
