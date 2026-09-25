"use client";

import { AlertCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_LIST } from "@/shared/validations/common";

/**
 * Phase 10 — Profile step: the IANA timezone that every schedule instant is
 * interpreted in (§11.4 "collect/confirm profile + defaults"; §5.5). Stays
 * inside the wizard so the user confirms it before any med is created.
 */
export function ProfileStep({
  value,
  error,
  onValueChange,
}: {
  value: string;
  error?: string;
  onValueChange: (timezone: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor="onboarding-timezone" className="text-[13px] font-semibold text-ink-800">
        Time zone{" "}
        <span className="text-red" aria-hidden="true">
          *
        </span>
      </label>
      <p className="text-xs text-muted-foreground">
        Medication times are shown in your local time.
      </p>
      <Select
        id="onboarding-timezone"
        value={value}
        onValueChange={(v) => onValueChange(v ?? "UTC")}
      >
        <SelectTrigger className="w-full md:w-72" aria-label="Time zone">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONE_LIST.map((tz) => (
            <SelectItem key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs font-medium text-red">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2.2} />
          {error}
        </p>
      )}
    </div>
  );
}
