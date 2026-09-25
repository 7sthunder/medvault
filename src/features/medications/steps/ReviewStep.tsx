"use client";

import { BellRing, Pill } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { formatDateKey, formatHhmm } from "@/lib/format";

import {
  daysLabel,
  dosageLabel,
  medTintClasses,
  toHex,
  type MedicationFormValues,
  type SlotDraft,
} from "../medication-utils";

export interface ReviewStepProps {
  values: MedicationFormValues;
  slots: SlotDraft[];
}

/** §11.6 wizard step 3 — review the medication + its schedule before saving. */
export function ReviewStep({ values, slots }: ReviewStepProps) {
  const color = values.color.startsWith("#") ? values.color : toHex(values.color);
  const enabledSlots = slots.filter((slot) => slot.enabled);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4">
        <SectionLabel tone="blue">Medication</SectionLabel>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <CardTitle className="font-heading font-bold text-ink-900">
                {values.name || "Untitled medication"}
              </CardTitle>
            </div>
            <CardDescription>
              {values.dosageAmount} {values.dosageUnit} · started {formatDateKey(values.startDate)}
              {values.endDate ? ` · until ${formatDateKey(values.endDate)}` : " · ongoing"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ListRow
              icon={Pill}
              iconClass={medTintClasses(color)}
              title={dosageLabel({
                dosageAmount: Number(values.dosageAmount) || 0,
                dosageUnit: values.dosageUnit,
              })}
              subtitle="Dose"
            />
            <ListRow
              icon={BellRing}
              iconClass="bg-blue-tint text-blue"
              title={values.remindersEnabled ? "Reminders on" : "Reminders off"}
              subtitle="Dose reminders"
            />
            {values.instructions ? (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-ink-800">
                {values.instructions}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <SectionLabel tone="blue">Schedule</SectionLabel>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading font-bold text-ink-900">
              {slots.length === 1 ? `1 time` : `${slots.length} times`}
            </CardTitle>
            <CardDescription>
              {slots.length > 0
                ? `${enabledSlots.length} active · ${slots.length - enabledSlots.length} disabled`
                : "No times scheduled yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {slots.map((slot) => (
                <li
                  key={slot.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">
                      {formatHhmm(slot.timeOfDay)}
                      {!slot.enabled ? (
                        <span className="ml-2 text-xs font-medium text-ink-400">disabled</span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {daysLabel(slot.daysOfWeek)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {slot.dosageAmount ? (
                      <p className="font-medium text-ink-800">
                        {slot.dosageAmount} {values.dosageUnit}
                      </p>
                    ) : null}
                    {slot.instructionOverride ? (
                      <p className="max-w-40 truncate">{slot.instructionOverride}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
