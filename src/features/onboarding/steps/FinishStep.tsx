"use client";

import { Check, Pill, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingWizardState } from "../types";

export interface FinishStepProps {
  state: OnboardingWizardState;
  onChange: (patch: Partial<OnboardingWizardState>) => void;
}

export function FinishStep({ state, onChange }: FinishStepProps) {
  return (
    <div className="space-y-6" data-slot="onboarding-step-3">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-bold text-ink-900 dark:text-ink-100">
          Ready to Launch Your Vault
        </h2>
        <p className="text-sm text-muted-foreground">
          Confirm your starting setup. You can adjust all preferences anytime in Settings.
        </p>
      </div>

      {/* Sample Medication Card with Opt-In Toggle */}
      <div
        onClick={() => onChange({ addSampleMed: !state.addSampleMed })}
        className={cn(
          "rounded-2xl border p-5 transition-all cursor-pointer relative",
          state.addSampleMed
            ? "border-primary bg-primary-tint/30 shadow-xs"
            : "border-border/80 bg-background hover:bg-muted/40",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl shrink-0 transition-colors",
                state.addSampleMed
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Pill className="size-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-bold text-ink-900 dark:text-ink-100">
                  Metformin 500mg
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-tint px-2 py-0.5 text-[11px] font-semibold text-cyan-800">
                  <Sparkles className="size-3" />
                  <span>Sample</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Twice daily (08:00 AM & 08:00 PM) · Oral tablet · Take with meals
              </p>
              <p className="text-xs text-ink-700 dark:text-ink-300 pt-1">
                Adds a starter prescription so you can test dose actions, snooze flows, and adherence tracking immediately.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
              state.addSampleMed
                ? "border-primary bg-primary text-white"
                : "border-border bg-background",
            )}
          >
            {state.addSampleMed && <Check className="size-4" strokeWidth={2.5} />}
          </div>
        </div>
      </div>

      {/* Review Snapshot Card */}
      <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Configuration Summary
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-background border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Timezone</span>
            <span className="font-semibold text-ink-900 dark:text-ink-100 truncate block">
              {state.timezone.split("/").pop()?.replace(/_/g, " ")}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-background border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Missed Grace</span>
            <span className="font-semibold text-ink-900 dark:text-ink-100 block">
              {state.missedAfterMinutes} mins
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-background border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Snooze</span>
            <span className="font-semibold text-ink-900 dark:text-ink-100 block">
              {state.snoozeMinutes} mins
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-background border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Advance Alert</span>
            <span className="font-semibold text-ink-900 dark:text-ink-100 block">
              {state.reminderBeforeMinutes} mins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
