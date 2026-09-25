"use client";

import { format } from "date-fns";
import { AlarmClock, Check, CheckCircle2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useI18n } from "@/lib/i18n/context";
import { canSkipDose, canSnoozeDose, canTakeDose } from "@/shared/calc/doseState";
import type { DoseEventStatus, DoseStatus } from "@/shared/enums";
import type { DoseEventDTO } from "@/shared/types";

export interface DoseCardProps {
  dose: DoseEventDTO;
  onTake: (doseId: string) => Promise<void>;
  onOpenSnooze: (dose: DoseEventDTO) => void;
  onOpenSkip: (dose: DoseEventDTO) => void;
  isTaking?: boolean;
}

function toDisplayStatus(status: DoseEventStatus): DoseStatus {
  if (status === "due") return "due-now";
  return status;
}

export function DoseCard({
  dose,
  onTake,
  onOpenSnooze,
  onOpenSkip,
  isTaking = false,
}: DoseCardProps) {
  const { t } = useI18n();
  const displayStatus = toDisplayStatus(dose.status);
  const scheduledTime = format(new Date(dose.scheduledFor), "h:mm a");

  const showTake = canTakeDose(dose.status);
  const showSnooze = canSnoozeDose(dose.status, dose.snoozeCount, 3);
  const showSkip = canSkipDose(dose.status);

  return (
    <div
      data-testid={`dose-card-${dose.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-card-sm hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-4"
    >
      {/* Left accent rail */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full shadow-xs"
        style={{ backgroundColor: dose.medication.color || "var(--primary)" }}
        aria-hidden="true"
      />

      {/* Main Info */}
      <div className="space-y-1.5 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-base font-bold text-ink-900 dark:text-ink-100">
            {dose.medication.name}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {dose.medication.dosageAmount} {dose.medication.dosageUnit}
          </span>
          <StatusBadge status={displayStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-medium text-ink-800 dark:text-ink-200">
            <Clock className="size-3 text-muted-foreground" />
            {scheduledTime}
          </span>

          {dose.status === "snoozed" && dose.snoozeUntil && (
            <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <AlarmClock className="size-3.5" />
              {t("dashboard.snoozedUntil", "Snoozed until")} {format(new Date(dose.snoozeUntil), "h:mm a")} ({dose.snoozeCount}/3)
            </span>
          )}

          {dose.status === "taken" && dose.takenAt && (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {t("dashboard.takenAt", "Taken at")} {format(new Date(dose.takenAt), "h:mm a")}
            </span>
          )}

          {dose.status === "skipped" && (
            <span className="text-muted-foreground italic">
              Skipped{dose.skippedReason ? ` (${dose.skippedReason})` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-end gap-2 pl-2 sm:mt-0 sm:shrink-0">
        {showSkip && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenSkip(dose)}
            disabled={isTaking}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 size-3.5" />
            {t("dashboard.skip", "Skip")}
          </Button>
        )}

        {showSnooze && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenSnooze(dose)}
            disabled={isTaking}
            className="text-xs border-amber/30 text-amber hover:bg-amber-tint dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            <AlarmClock className="mr-1 size-3.5" />
            {t("dashboard.snooze", "Snooze")}
          </Button>
        )}

        {showTake && (
          <Button
            type="button"
            size="sm"
            onClick={() => onTake(dose.id)}
            disabled={isTaking}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-primary-btn hover:scale-102 active:scale-98 transition-all"
          >
            <Check className="mr-1 size-3.5" />
            {isTaking
              ? t("dashboard.logging", "Taking…")
              : dose.status === "missed"
                ? t("dashboard.takeLate", "Take Late")
                : t("dashboard.take", "Take")}
          </Button>
        )}
      </div>
    </div>
  );
}
