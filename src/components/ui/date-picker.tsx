"use client";

import type { ComponentProps } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "cn";

export interface DatePickerProps extends Omit<
  ComponentProps<"input">,
  "type" | "value" | "onChange"
> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Stock/schedule date picker — labelled pill wrapping the native date input
 * (a11y + mobile picker free). Stitch "Start date" chip field.
 */
export function DatePicker({
  className,
  value,
  onChange,
  "aria-label": ariaLabel = "Date",
  ...props
}: DatePickerProps) {
  return (
    <span
      data-slot="date-picker"
      className={cn(
        "inline-flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-ring",
        className,
      )}
    >
      <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="date"
        value={value}
        aria-label={ariaLabel}
        className="w-full min-w-0 bg-transparent text-sm font-medium text-ink-800 outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </span>
  );
}
