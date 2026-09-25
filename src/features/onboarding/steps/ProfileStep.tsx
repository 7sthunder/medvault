"use client";

import { useEffect } from "react";
import { Globe, User } from "lucide-react";
import { TIMEZONE_LIST } from "@/shared/validations/common";
import type { OnboardingWizardState } from "../types";

export interface ProfileStepProps {
  state: OnboardingWizardState;
  onChange: (patch: Partial<OnboardingWizardState>) => void;
}

export function ProfileStep({ state, onChange }: ProfileStepProps) {
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && (TIMEZONE_LIST as readonly string[]).includes(detected)) {
        if (state.timezone !== detected) {
          onChange({ timezone: detected as (typeof TIMEZONE_LIST)[number] });
        }
      }
    } catch {
      // Fallback to initial state
    }
    // Only detect on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6" data-slot="onboarding-step-1">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-bold text-ink-900 dark:text-ink-100">
          Confirm Timezone & Profile
        </h2>
        <p className="text-sm text-muted-foreground">
          MedVault syncs medication reminders and calculates adherence streaks based on your local time.
        </p>
      </div>

      <div className="space-y-4">
        {state.name && (
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">
              Your Name
            </label>
            <div className="relative">
              <input
                id="profile-name"
                type="text"
                readOnly
                value={state.name}
                className="w-full rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2.5 pl-10 text-sm text-ink-900 dark:text-ink-100 outline-none cursor-default"
              />
              <User className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="profile-timezone" className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">
            Your Timezone
          </label>
          <div className="relative">
            <select
              id="profile-timezone"
              value={state.timezone}
              onChange={(e) => onChange({ timezone: e.target.value as typeof state.timezone })}
              className="w-full appearance-none rounded-xl border border-border/80 bg-background px-3.5 py-2.5 pl-10 text-sm text-ink-900 dark:text-ink-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              {TIMEZONE_LIST.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <Globe className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">
            All scheduled times, reminders, and daily streak cutoffs will adhere to this zone.
          </p>
        </div>
      </div>
    </div>
  );
}
