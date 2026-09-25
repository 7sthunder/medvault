"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/lib/use-media-query";
import { formatDateRange } from "@/lib/format";
import { RANGE_PRESET_TEXT } from "@shared/enums";
import { localDateKey, rangeByPreset } from "@shared/times";

export interface DateRange {
  from: string;
  to: string;
}

const PRESET_KEYS = ["7d", "30d", "90d", "custom"] as const;

function presetRange(preset: "7d" | "30d" | "90d", timeZone: string, now: Date): DateRange {
  const { from, to } = rangeByPreset(preset, { now, timeZone });
  return { from: localDateKey(from, timeZone), to: localDateKey(to, timeZone) };
}

function detectMode(value: DateRange, timeZone: string, now: Date): (typeof PRESET_KEYS)[number] {
  for (const preset of ["7d", "30d", "90d"] as const) {
    const expected = presetRange(preset, timeZone, now);
    if (expected.from === value.from && expected.to === value.to) return preset;
  }
  return "custom";
}

export interface RangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** User timezone for preset math (defaults to UTC). */
  timeZone?: string;
  /** Clock anchor for preset math (defaults to `new Date()`). */
  now?: Date;
  className?: string;
  ariaLabel?: string;
}

/**
 * Phase 08 date-range picker (plan §10.9): 7d/30d/90d presets from shared
 * `rangeByPreset` + a custom from/to pair (native date inputs). Renders inline
 * on desktop and as a bottom sheet (drawer) below `md`.
 */
export function RangePicker({
  value,
  onChange,
  timeZone = "UTC",
  now,
  className,
  ariaLabel = "Date range",
}: RangePickerProps) {
  const anchor = now ?? new Date();
  const [mode, setMode] = useState<(typeof PRESET_KEYS)[number]>(() =>
    detectMode(value, timeZone, anchor),
  );

  const pick = (preset: (typeof PRESET_KEYS)[number]) => {
    setMode(preset);
    if (preset !== "custom") {
      const range = presetRange(preset, timeZone, anchor);
      if (range.from !== value.from || range.to !== value.to) onChange(range);
    }
  };

  const changeCustom = (from: string, to: string) => {
    setMode("custom");
    if (from !== value.from || to !== value.to) onChange({ from, to });
  };

  const summary = formatDateRange(value.from, value.to);

  const controls = (
    <div data-slot="range-picker-controls" className="flex flex-wrap items-center gap-3">
      <div
        role="group"
        aria-label={ariaLabel}
        className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
      >
        {PRESET_KEYS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={mode === preset}
            onClick={() => pick(preset)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              mode === preset
                ? "bg-primary text-primary-foreground shadow-primary-btn"
                : "text-ink-600 hover:bg-muted",
            )}
          >
            {RANGE_PRESET_TEXT[preset]}
          </button>
        ))}
      </div>
      {mode === "custom" && (
        <span className="inline-flex flex-wrap items-center gap-2">
          <DatePicker
            value={value.from}
            aria-label="From date"
            onChange={(from) => changeCustom(from, value.to)}
            className="w-36"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            –
          </span>
          <DatePicker
            value={value.to}
            aria-label="To date"
            onChange={(to) => changeCustom(value.from, to)}
            className="w-36"
          />
        </span>
      )}
    </div>
  );

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Drawer data-slot="range-picker-drawer">
        <DrawerTrigger
          render={
            <Button variant="outline" className="w-full justify-start">
              <CalendarRange className="size-4 text-muted-foreground" />
              <span className="min-w-0 truncate">{summary}</span>
            </Button>
          }
        />
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Date range</DrawerTitle>
            <DrawerDescription>Pick a preset or choose the exact dates.</DrawerDescription>
          </DrawerHeader>
          <div className="px-1">{controls}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return <div className={cn("w-full", className)}>{controls}</div>;
}
