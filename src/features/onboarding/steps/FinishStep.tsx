"use client";

import { Pill } from "lucide-react";

import type { OnboardingInput } from "@/shared/validations/onboarding";

const ROWS: { key: keyof Pick<OnboardingInput, "missedAfterMinutes" | "snoozeMinutes" | "maxSnoozes" | "reminderBeforeMinutes">; label: string; unit: string }[] = [
  { key: "missedAfterMinutes", label: "Missed after", unit: "min" },
  { key: "snoozeMinutes", label: "Snooze", unit: "min" },
  { key: "maxSnoozes", label: "Max snoozes", unit: "×" },
  { key: "reminderBeforeMinutes", label: "Remind me before", unit: "min" },
];

/**
 * Phase 10 — Finish step (§11.4 "finish → save → /dashboard"): a compact review
 * of the defaults just saved, so the user lands configured, not surprised.
 */
export function FinishStep({ values }: { values: OnboardingInput }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border-strong px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">Time zone</p>
          <p className="text-xs text-muted-foreground">All schedules are generated in this local time.</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-semibold text-ink-900">{values.timezone.replace(/_/g, " ")}</span>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2">
        {ROWS.map(({ key, label, unit }) => (
          <div key={key} className="flex items-center justify-between rounded-lg border border-border-strong px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold text-ink-900">
              {values[key]}&thinsp;{unit}
            </dd>
          </div>
        ))}
      </dl>

      {values.addSampleMed && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
          <Pill className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-ink-900">
            Metformin <span className="text-muted-foreground">500 mg</span> — twice a day at 08:00 &amp; 20:00 — will be
            added to your vault.
          </p>
        </div>
      )}
    </div>
  );
}