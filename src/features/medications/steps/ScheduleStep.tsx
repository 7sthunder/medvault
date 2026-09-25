"use client";

import { SectionLabel } from "@/components/ui/section-label";

import { ScheduleBuilder } from "../ScheduleBuilder";
import type { ScheduleIssues, SlotDraft } from "../medication-utils";

export interface ScheduleStepProps {
  slots: SlotDraft[];
  onChange: (next: SlotDraft[]) => void;
  issues?: ScheduleIssues | null;
}

/** §11.6 wizard step 2 — build the daily slot schedule with the shared builder. */
export function ScheduleStep({ slots, onChange, issues }: ScheduleStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel tone="blue">Daily times</SectionLabel>
      <p className="-mt-2 text-sm text-muted-foreground">
        Set when each dose happens — up to six times with custom weekdays per slot.
      </p>
      <ScheduleBuilder slots={slots} onChange={onChange} issues={issues} />
    </div>
  );
}