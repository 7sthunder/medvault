"use client";

import { AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { DoseEventDTO } from "@/shared/types";

export interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dose: DoseEventDTO | null;
  onConfirm: (doseId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function SnoozeDialog({
  open,
  onOpenChange,
  dose,
  onConfirm,
  isSubmitting = false,
}: SnoozeDialogProps) {
  if (!dose) return null;

  const currentCount = dose.snoozeCount;
  const maxSnoozes = 3;
  const remaining = Math.max(0, maxSnoozes - currentCount);

  const handleSnooze = async () => {
    await onConfirm(dose.id);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-tint text-amber">
            <AlarmClock className="size-4" />
          </div>
          <span>Snooze {dose.medication.name}</span>
        </div>
      }
      description={`Delay this reminder by 10 minutes. Snoozes used: ${currentCount}/${maxSnoozes} (${remaining} remaining).`}
      footer={
        <div className="flex w-full items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSnooze}
            disabled={isSubmitting || remaining <= 0}
            className="bg-amber text-white hover:bg-amber/90"
          >
            {isSubmitting ? "Snoozing…" : "Snooze 10 min"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-sm text-muted-foreground">
        <p>
          Snoozing gives you an extra grace period so the dose won&apos;t be marked as missed.
          You will be reminded again once the snooze period completes.
        </p>
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex justify-between font-medium text-foreground">
            <span>Dose amount:</span>
            <span>
              {dose.medication.dosageAmount} {dose.medication.dosageUnit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Current status:</span>
            <span className="capitalize">{dose.status}</span>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
