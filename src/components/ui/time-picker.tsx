"use client"

import type { ComponentProps } from "react"
import { Clock } from "lucide-react"
import { cn } from "cn"

export interface TimePickerProps
  extends Omit<ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
  /** Icon shown in the pill (default Clock) */
  icon?: ComponentProps<"svg">
}

/**
 * Dose-time picker — labelled pill wrapping the native time input (full a11y +
 * mobile wheel). Stitch inline-time chip: border, clock glyph, monospaced-ish time.
 */
export function TimePicker({
  className,
  value,
  onChange,
  "aria-label": ariaLabel = "Time",
  ...props
}: TimePickerProps) {
  return (
    <span
      data-slot="time-picker"
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-ring hover:border-border-strong/80",
        className
      )}
    >
      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="time"
        value={value}
        aria-label={ariaLabel}
        className="w-full min-w-[5.5rem] bg-transparent text-sm font-medium text-ink-800 outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </span>
  )
}