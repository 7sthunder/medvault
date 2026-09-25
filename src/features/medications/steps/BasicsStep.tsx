"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { INSTRUCTIONS_MAX, NOTES_MAX } from "@/shared/constants";
import { DOSAGE_UNITS } from "@/shared/validations/medication";

import { MED_COLOR_OPTIONS, toHex } from "../medication-utils";
import type { MedicationFormValues } from "../medication-utils";

const CUSTOM_UNIT = "__custom__";

export interface BasicsStepProps {
  register: UseFormRegister<MedicationFormValues>;
  setValue: UseFormSetValue<MedicationFormValues>;
  values: MedicationFormValues;
  errors: FieldErrors<MedicationFormValues>;
  unitMode: "preset" | "custom";
  onUnitModeChange: (mode: "preset" | "custom") => void;
}

/**
 * §11.6 wizard step 1 — the medication's identity: name, dose, date window,
 * accent colour, how-to instructions and whether reminders are on.
 */
export function BasicsStep({
  register,
  setValue,
  values,
  errors,
  unitMode,
  onUnitModeChange,
}: BasicsStepProps) {
  const unitValue =
    unitMode === "custom" || !(DOSAGE_UNITS as readonly string[]).includes(values.dosageUnit)
      ? CUSTOM_UNIT
      : values.dosageUnit;

  return (
    <div className="flex flex-col gap-5">
      <FormField label="Medication name" required error={errors.name?.message}>
        <Input placeholder="e.g. Metformin" autoComplete="off" {...register("name")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Dose" required error={errors.dosageAmount?.message}>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            placeholder="500"
            {...register("dosageAmount")}
          />
        </FormField>

        <div className="grid gap-1.5">
          <label htmlFor="medication-unit" className="text-[13px] font-semibold text-ink-800">
            Unit <span aria-hidden="true" className="text-red">*</span>
          </label>
          {unitMode === "custom" ? (
            <Input
              id="medication-unit"
              placeholder="Custom unit"
              aria-invalid={Boolean(errors.dosageUnit)}
              {...register("dosageUnit")}
            />
          ) : (
            <Select
              value={unitValue}
              onValueChange={(value) => {
                if (value === CUSTOM_UNIT) {
                  onUnitModeChange("custom");
                  setValue("dosageUnit", "", { shouldValidate: true });
                } else if (value) {
                  onUnitModeChange("preset");
                  setValue("dosageUnit", value, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="medication-unit" className="w-full" aria-label="Unit">
                <SelectValue placeholder="Choose a unit" />
              </SelectTrigger>
              <SelectContent>
                {DOSAGE_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_UNIT}>Custom…</SelectItem>
              </SelectContent>
            </Select>
          )}
          {unitMode === "custom" && errors.dosageUnit?.message ? (
            <p role="alert" className="flex items-center gap-1 text-xs font-medium text-red">
              {errors.dosageUnit.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" required error={errors.startDate?.message}>
          <DatePicker
            value={values.startDate}
            aria-label="Start date"
            onChange={(value) => setValue("startDate", value, { shouldValidate: true })}
          />
        </FormField>
        <FormField label="End date" hint="Leave empty if ongoing." error={errors.endDate?.message}>
          <DatePicker
            value={values.endDate ?? ""}
            aria-label="End date"
            onChange={(value) => setValue("endDate", value || null, { shouldValidate: true })}
          />
        </FormField>
      </div>

      <div className="grid gap-1.5">
        <p className="text-[13px] font-semibold text-ink-800">
          Colour <span aria-hidden="true" className="text-red">*</span>
        </p>
        <div
          role="radiogroup"
          aria-label="Medication colour"
          className="flex flex-wrap items-center gap-2"
        >
          {MED_COLOR_OPTIONS.map((hex) => {
            const hexValue = toHex(hex);
            const active = values.color.toLowerCase() === hexValue.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Colour ${hex}`}
                onClick={() => setValue("color", hexValue, { shouldValidate: true })}
                className={cn(
                  "size-8 rounded-full ring-2 ring-offset-2 transition-all",
                  active ? "ring-ink-900" : "ring-transparent hover:ring-border",
                )}
                style={{ backgroundColor: hexValue }}
              />
            );
          })}
        </div>
        {errors.color?.message ? (
          <p role="alert" className="text-xs font-medium text-red">
            {errors.color.message}
          </p>
        ) : null}
      </div>

      <FormField label="Instructions" hint="How to take this medication." error={errors.instructions?.message}>
        <Textarea
          rows={2}
          maxLength={INSTRUCTIONS_MAX}
          placeholder="e.g. Take with food"
          {...register("instructions")}
        />
      </FormField>

      <FormField label="Notes" hint="Anything else worth remembering." error={errors.notes?.message}>
        <Textarea rows={3} maxLength={NOTES_MAX} placeholder="Optional notes…" {...register("notes")} />
      </FormField>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border-strong bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">Reminders</p>
          <p className="text-xs text-muted-foreground">Schedule dose reminders for this medication.</p>
        </div>
        <Switch
          checked={values.remindersEnabled}
          aria-label="Enable reminders"
          onCheckedChange={(value) => setValue("remindersEnabled", Boolean(value), { shouldValidate: true })}
        />
      </div>
    </div>
  );
}