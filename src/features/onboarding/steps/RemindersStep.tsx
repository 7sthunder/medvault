"use client";

import { Bell, Clock, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingWizardState } from "../types";

export interface RemindersStepProps {
  state: OnboardingWizardState;
  onChange: (patch: Partial<OnboardingWizardState>) => void;
}

interface Preset {
  label: string;
  description: string;
  values: {
    missedAfterMinutes: number;
    snoozeMinutes: number;
    maxSnoozes: number;
    reminderBeforeMinutes: number;
  };
}

const PRESETS: Preset[] = [
  {
    label: "Balanced",
    description: "Standard 30m grace, 10m snooze (Recommended)",
    values: {
      missedAfterMinutes: 30,
      snoozeMinutes: 10,
      maxSnoozes: 3,
      reminderBeforeMinutes: 5,
    },
  },
  {
    label: "Strict",
    description: "15m grace window for time-sensitive meds",
    values: {
      missedAfterMinutes: 15,
      snoozeMinutes: 5,
      maxSnoozes: 2,
      reminderBeforeMinutes: 5,
    },
  },
  {
    label: "Relaxed",
    description: "45m grace window with flexible snoozes",
    values: {
      missedAfterMinutes: 45,
      snoozeMinutes: 15,
      maxSnoozes: 4,
      reminderBeforeMinutes: 10,
    },
  },
];

export function RemindersStep({ state, onChange }: RemindersStepProps) {
  const isPresetActive = (p: Preset) =>
    state.missedAfterMinutes === p.values.missedAfterMinutes &&
    state.snoozeMinutes === p.values.snoozeMinutes &&
    state.maxSnoozes === p.values.maxSnoozes &&
    state.reminderBeforeMinutes === p.values.reminderBeforeMinutes;

  return (
    <div className="space-y-6" data-slot="onboarding-step-2">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-bold text-ink-900 dark:text-ink-100">
          Personalize Reminder Habits
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure how doses transition from due to missed, and set snooze behavior.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PRESETS.map((preset) => {
          const active = isPresetActive(preset);

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.values)}
              className={cn(
                "flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer",
                active
                  ? "border-primary bg-primary-tint/60 text-primary-dark shadow-xs"
                  : "border-border/80 bg-background hover:bg-muted/60 text-ink-700 dark:text-ink-300",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-heading text-sm font-bold">{preset.label}</span>
                {active && (
                  <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1 leading-snug">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label htmlFor="reminder-before" className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">
            Advance Alert (Minutes)
          </label>
          <div className="relative">
            <input
              id="reminder-before"
              type="number"
              min={0}
              max={60}
              value={state.reminderBeforeMinutes}
              onChange={(e) => onChange({ reminderBeforeMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 pl-10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Bell className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">Send a chime before the dose is due</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="missed-after" className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">
            Missed Dose Grace (Minutes)
          </label>
          <div className="relative">
            <input
              id="missed-after"
              type="number"
              min={5}
              max={120}
              value={state.missedAfterMinutes}
              onChange={(e) => onChange({ missedAfterMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 pl-10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <AlertTriangle className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">Mark missed if no action taken</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="snooze-minutes" className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">
            Snooze Duration (Minutes)
          </label>
          <div className="relative">
            <input
              id="snooze-minutes"
              type="number"
              min={1}
              max={60}
              value={state.snoozeMinutes}
              onChange={(e) => onChange({ snoozeMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 pl-10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Clock className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">Minutes until the next reminder</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="max-snoozes" className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">
            Max Snoozes Allowed
          </label>
          <div className="relative">
            <input
              id="max-snoozes"
              type="number"
              min={0}
              max={10}
              value={state.maxSnoozes}
              onChange={(e) => onChange({ maxSnoozes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 pl-10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <RotateCcw className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">Limit re-snoozes before escalation</p>
        </div>
      </div>
    </div>
  );
}
