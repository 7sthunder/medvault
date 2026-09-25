"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/time-picker";
import { MAX_SCHEDULE_SLOTS } from "@/shared/constants";
import type { ScheduleSlotInput } from "@/shared/validations/schedule";
import type { FrequencyPreset } from "./types";

const WEEKDAYS = [
  { day: 0, label: "Su", name: "Sunday" },
  { day: 1, label: "M", name: "Monday" },
  { day: 2, label: "Tu", name: "Tuesday" },
  { day: 3, label: "W", name: "Wednesday" },
  { day: 4, label: "Th", name: "Thursday" },
  { day: 5, label: "F", name: "Friday" },
  { day: 6, label: "Sa", name: "Saturday" },
];

export interface ScheduleBuilderProps {
  slots: ScheduleSlotInput[];
  onChange: (slots: ScheduleSlotInput[]) => void;
  error?: string;
}

export function ScheduleBuilder({ slots, onChange, error }: ScheduleBuilderProps) {
  const [preset, setPreset] = useState<FrequencyPreset>(() => {
    if (slots.length === 1 && slots[0]?.daysOfWeek.length === 7) return "once-daily";
    if (slots.length === 2 && slots.every((s) => s.daysOfWeek.length === 7)) return "twice-daily";
    if (slots.length === 3 && slots.every((s) => s.daysOfWeek.length === 7)) return "three-times-daily";
    return "custom";
  });

  const handlePresetSelect = (newPreset: FrequencyPreset) => {
    setPreset(newPreset);
    const allDays = [0, 1, 2, 3, 4, 5, 6];

    if (newPreset === "once-daily") {
      onChange([{ timeOfDay: "08:00", daysOfWeek: allDays, enabled: true }]);
    } else if (newPreset === "twice-daily") {
      onChange([
        { timeOfDay: "08:00", daysOfWeek: allDays, enabled: true },
        { timeOfDay: "20:00", daysOfWeek: allDays, enabled: true },
      ]);
    } else if (newPreset === "three-times-daily") {
      onChange([
        { timeOfDay: "08:00", daysOfWeek: allDays, enabled: true },
        { timeOfDay: "14:00", daysOfWeek: allDays, enabled: true },
        { timeOfDay: "20:00", daysOfWeek: allDays, enabled: true },
      ]);
    } else {
      // Keep existing slots or provide a default custom slot
      if (slots.length === 0) {
        onChange([{ timeOfDay: "08:00", daysOfWeek: allDays, enabled: true }]);
      }
    }
  };

  const updateSlotTime = (index: number, timeOfDay: string) => {
    const updated = [...slots];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, timeOfDay };
      onChange(updated);
    }
  };

  const toggleWeekday = (slotIndex: number, day: number) => {
    const updated = [...slots];
    const current = updated[slotIndex];
    if (!current) return;

    const currentDays = current.daysOfWeek;
    let newDays: number[];
    if (currentDays.includes(day)) {
      if (currentDays.length <= 1) return; // Keep at least one day
      newDays = currentDays.filter((d) => d !== day);
    } else {
      newDays = [...currentDays, day].sort((a, b) => a - b);
    }

    updated[slotIndex] = { ...current, daysOfWeek: newDays };
    setPreset("custom");
    onChange(updated);
  };

  const addSlot = () => {
    if (slots.length >= MAX_SCHEDULE_SLOTS) return;
    const defaultTimes = ["08:00", "12:00", "16:00", "20:00", "22:00", "06:00"];
    const fallbackTime = defaultTimes[slots.length] ?? "09:00";
    onChange([
      ...slots,
      {
        timeOfDay: fallbackTime,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
      },
    ]);
    setPreset("custom");
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    const updated = slots.filter((_, i) => i !== index);
    setPreset("custom");
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">
          Frequency Preset
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            type="button"
            variant={preset === "once-daily" ? "default" : "outline"}
            size="sm"
            className="w-full text-xs"
            onClick={() => handlePresetSelect("once-daily")}
          >
            Once daily
          </Button>
          <Button
            type="button"
            variant={preset === "twice-daily" ? "default" : "outline"}
            size="sm"
            className="w-full text-xs"
            onClick={() => handlePresetSelect("twice-daily")}
          >
            Twice daily
          </Button>
          <Button
            type="button"
            variant={preset === "three-times-daily" ? "default" : "outline"}
            size="sm"
            className="w-full text-xs"
            onClick={() => handlePresetSelect("three-times-daily")}
          >
            3x daily
          </Button>
          <Button
            type="button"
            variant={preset === "custom" ? "default" : "outline"}
            size="sm"
            className="w-full text-xs"
            onClick={() => handlePresetSelect("custom")}
          >
            Custom
          </Button>
        </div>
      </div>

      {/* Schedule Slot Rows */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">
            Dose Times ({slots.length} of {MAX_SCHEDULE_SLOTS})
          </span>
          {slots.length < MAX_SCHEDULE_SLOTS && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary gap-1"
              onClick={addSlot}
            >
              <Plus className="size-3.5" />
              Add time
            </Button>
          )}
        </div>

        <div className="space-y-2.5">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[11px] font-bold text-primary">
                  {idx + 1}
                </span>
                <TimePicker
                  value={slot.timeOfDay}
                  onChange={(val) => updateSlotTime(idx, val)}
                  aria-label={`Time for dose ${idx + 1}`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                <div className="flex items-center gap-1">
                  {WEEKDAYS.map(({ day, label, name }) => {
                    const isSelected = slot.daysOfWeek.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        title={name}
                        aria-label={`${name} for dose ${idx + 1}`}
                        onClick={() => toggleWeekday(idx, day)}
                        className={`size-7 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {slots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:text-red ml-1"
                    title="Remove slot"
                    aria-label={`Remove dose ${idx + 1}`}
                    onClick={() => removeSlot(idx)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-red pt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
