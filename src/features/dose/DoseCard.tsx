"use client";

import { AlarmClock, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatInstant } from "@/lib/format";
import type { DoseStatus } from "@/shared/enums";
import type { DoseEventDTO } from "@/shared/types";
import { cn } from "cn";

export interface DoseCardProps {
  dose: DoseEventDTO;
  medStatus: "active" | "paused";
  timeZone: string;
  now: Date;
  onTake: (dose: DoseEventDTO) => void;
  onSnooze: (dose: DoseEventDTO) => void;
  onSkip: (dose: DoseEventDTO) => void;
  busy?: boolean;
}

/** Relative tag next to the wall-clock time: `"in 2h"` / `"32m ago"` / `"now"`. */
function relativeTag(instant: Date, now: Date): string {
  const minutes = Math.round((instant.getTime() - now.getTime()) / 60_000);
  if (Math.abs(minutes) < 1) return "now";
  const abs = Math.abs(minutes);
  const unit = abs >= 60 ? `${Math.round(abs / 60)}h` : `${abs}m`;
  return minutes > 0 ? `in ${unit}` : `${unit} ago`;
}

/**
 * §11.7 single dose row. Accent = medication colour; status chip per §12; action
 * buttons only while the dose is actionable (due/snoozed), everything else is a
 * passive display row. Paused medications show a Schedule-paused hint instead.
 */
export function DoseCard({ dose, medStatus, timeZone, now, onTake, onSnooze, onSkip, busy }: DoseCardProps) {
  const { scheduledFor, status } = dose;
  const tag = relativeTag(scheduledFor, now);

  const actionDisabled = medStatus !== "active" || busy;
  const showActions = (status === "due-now" || status === "snoozed" || status === "upcoming") && medStatus === "active";
  const snoozed = status === "snoozed";
  const overdue = status === "due-now";

  return (
    <li
      data-slot="dose-card"
      data-status={status}
      className="group relative flex items-start gap-3 rounded-xl border border-border bg-background p-3 pr-2 transition-colors hover:bg-muted/40"
    >
      <span
        aria-hidden="true"
        className="mt-1 size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: dose.medication.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-ink-900">
            {dose.medication.name}
            {dose.medication.dosageUnit ? (
              <span className="ml-1.5 font-normal text-muted-foreground">
                · {dose.medication.dosageAmount} {dose.medication.dosageUnit}
              </span>
            ) : null}
          </p>
          <StatusIndicator status={status as DoseStatus} className="shrink-0" />
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatInstant(scheduledFor, timeZone)}
          <span className="mx-1.5 text-border">·</span>
          <span className={cn(overdue && "font-medium text-red", snoozed && "text-amber")}>
            {overdue ? tag : snoozed ? "Snoozed" : tag}
          </span>
        </p>

        {snoozed && dose.snoozeUntil ? (
          <p className="mt-0.5 text-xs font-medium text-amber">
            Snoozed until {formatInstant(dose.snoozeUntil, timeZone)}
          </p>
        ) : null}

        {showActions ? (
          <div className="mt-2 flex items-center gap-1.5">
            <Button size="sm" variant="default" onClick={() => onTake(dose)} disabled={actionDisabled}>
              Mark taken
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSnooze(dose)}
              disabled={actionDisabled}
              aria-label="Snooze dose"
            >
              <AlarmClock aria-hidden="true" />
              {snoozed ? "Snooze more" : "Snooze"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSkip(dose)}
              disabled={actionDisabled}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          </div>
        ) : medStatus === "paused" && status !== "canceled" ? (
          <p className="mt-2 text-xs font-medium text-ink-500">Schedule paused — resume from the medication.</p>
        ) : null}
      </div>

      <a
        href={`/schedule/${dose.id}`}
        aria-label={`${dose.medication.name} details`}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-ink-800"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </a>
    </li>
  );
}