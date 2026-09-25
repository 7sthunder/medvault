"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { DoseCard } from "@/features/schedule/DoseCard";
import { useI18n } from "@/lib/i18n/context";
import type { DoseEventDTO } from "@/shared/types";

export interface TodayFeedProps {
  today: DoseEventDTO[];
  onTake: (doseId: string) => Promise<void>;
  onOpenSnooze: (dose: DoseEventDTO) => void;
  onOpenSkip: (dose: DoseEventDTO) => void;
  takingId?: string | null;
}

export function TodayFeed({
  today,
  onTake,
  onOpenSnooze,
  onOpenSkip,
  takingId,
}: TodayFeedProps) {
  const { t } = useI18n();

  // Smart priority sorting: Due & Snoozed first, then Upcoming, then Resolved
  const prioritizedDoses = useMemo(() => {
    const dueAndSnoozed: DoseEventDTO[] = [];
    const upcoming: DoseEventDTO[] = [];
    const resolved: DoseEventDTO[] = [];

    for (const d of today) {
      if (d.status === "due" || d.status === "snoozed") {
        dueAndSnoozed.push(d);
      } else if (d.status === "upcoming") {
        upcoming.push(d);
      } else {
        resolved.push(d);
      }
    }

    // Sort within buckets by scheduled time
    dueAndSnoozed.sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
    upcoming.sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
    resolved.sort(
      (a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime(),
    );

    return [...dueAndSnoozed, ...upcoming, ...resolved].slice(0, 4);
  }, [today]);

  return (
    <section
      data-testid="today-feed-section"
      className="rounded-3xl border border-border/75 bg-card/85 p-6 shadow-card-sm backdrop-blur-md space-y-5 transition-all duration-300 hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel tone="emerald" leading={<Calendar className="size-3.5" />}>
            {t("dashboard.todaysSchedule", "Today's Schedule")}
          </SectionLabel>
          <h2 className="font-heading text-lg font-bold text-ink-900 dark:text-ink-100">
            {t("dashboard.doseTimeline", "Dose Timeline")}
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-primary font-medium hover:text-primary-dark"
          nativeButton={false}
          render={<Link href="/schedule" />}
        >
          <span>{t("dashboard.viewAll", "View all")} ({today.length})</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {today.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 px-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
            <CalendarX className="size-5" />
          </div>
          <p className="text-sm font-medium text-ink-800 dark:text-ink-200">
            {t("dashboard.noDosesScheduled", "No doses scheduled for today")}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {t("dashboard.noDosesDesc", "You don't have any active medication schedule slots configured for today.")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs"
            nativeButton={false}
            render={<Link href="/schedule" />}
          >
            Check Schedule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {prioritizedDoses.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={dose}
              onTake={onTake}
              onOpenSnooze={onOpenSnooze}
              onOpenSkip={onOpenSkip}
              isTaking={takingId === dose.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
