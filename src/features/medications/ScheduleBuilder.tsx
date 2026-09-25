"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { MAX_SCHEDULE_SLOTS } from "@/shared/constants";
import { WEEKDAY_INDEXES } from "@/shared/validations/schedule";
import { cn } from "@/lib/utils";

import {
  DAY_LABELS,
  FULL_WEEK,
  nextSlotKey,
  type ScheduleIssues,
  type SlotDraft,
} from "./medication-utils";

const SUGGEST_TIMES = ["08:00", "12:00", "16:00", "20:00"] as const;

export interface ScheduleBuilderProps {
  slots: SlotDraft[];
  onChange: (next: SlotDraft[]) => void;
  issues?: ScheduleIssues | null;
}

/**
 * §11.6 schedule builder — editable daily-time slots. Each slot carries a local
 * `HH:mm` time, a weekday subset, an optional per-slot dose/instruction override
 * and an enabled switch. Shared by the create + edit wizard.
 */
export function ScheduleBuilder({ slots, onChange, issues }: ScheduleBuilderProps) {
  const full = slots.length >= MAX_SCHEDULE_SLOTS;

  const updateAt = (index: number, patch: Partial<SlotDraft>) => {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const toggleDay = (index: number, day: number) => {
    const slot = slots[index];
    if (!slot) return;
    const has = slot.daysOfWeek.includes(day);
    updateAt(index, {
      daysOfWeek: has ? slot.daysOfWeek.filter((d) => d !== day) : [...slot.daysOfWeek, day],
    });
  };

  const removeAt = (index: number) => {
    if (slots.length <= 1) return;
    onChange(slots.filter((_, i) => i !== index));
  };

  const addSlot = () => {
    if (full) return;
    const used = new Set(slots.map((slot) => slot.timeOfDay));
    const timeOfDay = SUGGEST_TIMES.find((t) => !used.has(t)) ?? "12:00";
    onChange([
      ...slots,
      {
        key: nextSlotKey(),
        timeOfDay,
        daysOfWeek: [...FULL_WEEK],
        dosageAmount: "",
        instructionOverride: "",
        enabled: true,
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      {issues?.summary ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
        >
          {issues.summary}
        </p>
      ) : null}

      {slots.map((slot, index) => {
        const error = issues?.bySlot[index];
        return (
          <div
            key={slot.key}
            data-slot="schedule-slot"
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid flex-1 gap-2">
                <TimePicker
                  value={slot.timeOfDay}
                  aria-label={`Dose ${index + 1} time`}
                  onChange={(value) => updateAt(index, { timeOfDay: value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove dose ${index + 1}`}
                disabled={slots.length <= 1}
                onClick={() => removeAt(index)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Days</p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={slot.daysOfWeek.length === WEEKDAY_INDEXES.length}
                onClick={() => updateAt(index, { daysOfWeek: [...FULL_WEEK] })}
              >
                Every day
              </Button>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WEEKDAY_INDEXES.map((day) => {
                const active = slot.daysOfWeek.includes(day);
                return (
                  <Button
                    key={day}
                    type="button"
                    size="xs"
                    variant={active ? "default" : "outline"}
                    aria-pressed={active}
                    onClick={() => toggleDay(index, day)}
                  >
                    {DAY_LABELS[day]}
                  </Button>
                );
              })}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Dose per time (optional)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={slot.dosageAmount}
                  aria-label={`Dose per time for dose ${index + 1}`}
                  placeholder="Uses medication dose"
                  className="h-8 rounded-lg border border-border-strong bg-background px-2.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-ring"
                  onChange={(e) => updateAt(index, { dosageAmount: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Instruction (optional)
                </span>
                <input
                  type="text"
                  maxLength={200}
                  value={slot.instructionOverride}
                  aria-label={`Instruction for dose ${index + 1}`}
                  placeholder="e.g. with food"
                  className="h-8 rounded-lg border border-border-strong bg-background px-2.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-ring"
                  onChange={(e) => updateAt(index, { instructionOverride: e.target.value })}
                />
              </label>
            </div>

            <div
              className={cn(
                "mt-3 flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2",
                !slot.enabled && "opacity-70",
              )}
            >
              <span className="text-sm font-medium text-ink-900">Active</span>
              <Switch
                checked={slot.enabled}
                aria-label={`Activate dose ${index + 1}`}
                onCheckedChange={(value) => updateAt(index, { enabled: Boolean(value) })}
              />
            </div>

            {error ? (
              <p role="alert" className="mt-2 flex items-center gap-1 text-xs font-medium text-red">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={full} onClick={addSlot}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add time
        </Button>
        <p className="text-xs text-muted-foreground">
          {slots.length} of {MAX_SCHEDULE_SLOTS} daily times
        </p>
      </div>
    </div>
  );
}