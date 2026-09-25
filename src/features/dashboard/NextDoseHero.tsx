"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  AlarmClock,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Pill,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useI18n } from "@/lib/i18n/context";
import { canSkipDose, canSnoozeDose, canTakeDose } from "@/shared/calc/doseState";
import type { DoseEventStatus, DoseStatus } from "@/shared/enums";
import type { DoseEventDTO } from "@/shared/types";

function toDisplayStatus(status: DoseEventStatus): DoseStatus {
  if (status === "due") return "due-now";
  return status;
}

export interface NextDoseHeroProps {
  nextDose: DoseEventDTO | null;
  dueNow: DoseEventDTO[];
  hasMedications: boolean;
  onTake: (doseId: string) => Promise<void>;
  onOpenSnooze: (dose: DoseEventDTO) => void;
  onOpenSkip: (dose: DoseEventDTO) => void;
  takingId?: string | null;
}

export function NextDoseHero({
  nextDose,
  dueNow,
  hasMedications,
  onTake,
  onOpenSnooze,
  onOpenSkip,
  takingId,
}: NextDoseHeroProps) {
  const { t } = useI18n();

  // 1. Empty state: No medications registered yet
  if (!hasMedications) {
    return (
      <section
        data-testid="next-dose-hero-empty"
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-tint/50 via-background to-secondary-tint/30 p-6 sm:p-8 shadow-card"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              <span>{t("dashboard.welcome", "Welcome to MedVault")}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900 dark:text-ink-100">
              {t("dashboard.startTracking", "Start tracking your medications")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("dashboard.startTrackingDesc", "Add your first prescription or supplement to activate automatic schedule tracking, daily reminders, and adherence streaks.")}
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="default"
              size="lg"
              className="gap-2 shadow-primary-btn"
              nativeButton={false}
              render={<Link href="/medications/new" />}
            >
              <Plus className="size-5" />
              <span>{t("dashboard.addFirstMedication", "Add Your First Medication")}</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // 2. All caught up state: Medications exist but no pending doses remaining today
  if (!nextDose) {
    return (
      <section
        data-testid="next-dose-hero-caught-up"
        className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/5 p-6 sm:p-8 shadow-card"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="size-7 sm:size-8" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span>{t("dashboard.allCaughtUp", "All Caught Up")}</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900 dark:text-ink-100">
                {t("dashboard.allCaughtUpSubtitle", "You're all set for today!")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              nativeButton={false}
              render={<Link href="/schedule" />}
            >
              <span>View Today&apos;s Schedule</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // 3. Active Next / Due Dose state
  const isDueNow =
    nextDose.status === "due" ||
    dueNow.some((d) => d.id === nextDose.id);
  const isSnoozed = nextDose.status === "snoozed";
  const scheduledTimeStr = format(new Date(nextDose.scheduledFor), "h:mm a");
  const isTaking = takingId === nextDose.id;

  const showTake = canTakeDose(nextDose.status);
  const showSnooze = canSnoozeDose(nextDose.status, nextDose.snoozeCount, 3);
  const showSkip = canSkipDose(nextDose.status);

  return (
    <section
      data-testid="next-dose-hero"
      className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/90 to-secondary/10 p-6 sm:p-8 shadow-card backdrop-blur-xl transition-all duration-300 hover:shadow-card-md hover:border-primary/40 dark:from-primary/15 dark:via-card/85 dark:to-secondary/15"
    >
      {/* Background ambient decorative glows */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-12 -bottom-12 size-56 rounded-full bg-secondary/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Medication Icon Pill */}
          <div
            className="flex size-12 sm:size-14 items-center justify-center rounded-2xl shadow-xs shrink-0"
            style={{
              backgroundColor: nextDose.medication.color
                ? `${nextDose.medication.color}20`
                : "var(--primary-tint)",
              color: nextDose.medication.color || "var(--primary)",
            }}
          >
            <Pill className="size-6 sm:size-7" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {isDueNow ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-0.5 text-xs font-bold text-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.2)] animate-pulse dark:text-rose-400">
                  <span className="size-2 rounded-full bg-rose-500" />
                  {t("dashboard.dueNow", "Due Now")}
                </span>
              ) : isSnoozed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber-tint/40 px-3 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlarmClock className="size-3" />
                  {t("dashboard.snoozed", "Snoozed")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary shadow-xs">
                  <Clock className="size-3" />
                  {t("dashboard.nextDose", "Next Dose")} · {scheduledTimeStr}
                </span>
              )}
              <StatusBadge status={isDueNow ? "due-now" : toDisplayStatus(nextDose.status)} />
            </div>

            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900 dark:text-ink-100">
                {nextDose.medication.name}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {nextDose.medication.dosageAmount} {nextDose.medication.dosageUnit}
              </p>
            </div>

            {isSnoozed && nextDose.snoozeUntil && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t("dashboard.snoozedUntil", "Snoozed until")} {format(new Date(nextDose.snoozeUntil), "h:mm a")} ({nextDose.snoozeCount}/3)
              </p>
            )}
          </div>
        </div>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          {showTake && (
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => onTake(nextDose.id)}
              disabled={isTaking}
              className="gap-2 shadow-primary-btn font-semibold"
            >
              <Check className="size-4" />
              <span>{isTaking ? t("dashboard.logging", "Logging...") : t("dashboard.takeDose", "Take Dose")}</span>
            </Button>
          )}

          {showSnooze && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenSnooze(nextDose)}
              disabled={isTaking}
              className="gap-2"
            >
              <AlarmClock className="size-4 text-amber" />
              <span>{t("dashboard.snooze", "Snooze")}</span>
            </Button>
          )}

          {showSkip && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onOpenSkip(nextDose)}
              disabled={isTaking}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
              <span>{t("dashboard.skip", "Skip")}</span>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
