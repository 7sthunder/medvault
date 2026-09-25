"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { VALUE_LIMITS } from "@/shared/constants";
import type { OnboardingInput } from "@/shared/validations/onboarding";

type ReminderNumberKey = keyof typeof VALUE_LIMITS;

const NUMBER_FIELDS: { name: ReminderNumberKey; label: string; hint: string }[] = [
  {
    name: "missedAfterMinutes",
    label: "Missed-after",
    hint: "Minutes after a dose time before it counts as missed.",
  },
  { name: "snoozeMinutes", label: "Snooze", hint: "How long a snooze delays a due dose." },
  {
    name: "maxSnoozes",
    label: "Max snoozes",
    hint: "Times a dose can be snoozed before it must resolve.",
  },
  {
    name: "reminderBeforeMinutes",
    label: "Remind me before",
    hint: "Minutes before a dose time to nudge you.",
  },
];

/**
 * Phase 10 — Reminders step: the four global reminder defaults (§8.13) plus the
 * optional "sample medication" quick-start toggle (§11.4). Number fields are
 * bounded by `VALUE_LIMITS` (shared with settings, so ranges never drift); the
 * per-field errors come straight from the wizard's form state so stepping is
 * blocked with a visible message when a value is out of range.
 */
export function RemindersStep({
  register,
  setValue,
  addSampleMed,
  errors,
}: {
  register: UseFormRegister<OnboardingInput>;
  setValue: UseFormSetValue<OnboardingInput>;
  addSampleMed: boolean;
  errors: FieldErrors<OnboardingInput>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUMBER_FIELDS.map(({ name, label, hint }) => (
          <FormField key={name} label={label} hint={hint} error={errors[name]?.message} required>
            <Input
              type="number"
              inputMode="numeric"
              min={VALUE_LIMITS[name].min}
              max={VALUE_LIMITS[name].max}
              step={1}
              {...register(name)}
            />
          </FormField>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border-strong bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">Add a sample medication</p>
          <p className="text-xs text-muted-foreground">
            Metformin 500mg · twice a day (08:00 & 20:00).
          </p>
        </div>
        <Switch
          id="onboarding-add-sample"
          checked={addSampleMed}
          onCheckedChange={(v) => setValue("addSampleMed", Boolean(v))}
          aria-label="Add Metformin sample medication"
        />
      </div>
    </div>
  );
}
