"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { DoseEventDTO } from "@/shared/types";

export interface SkipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dose: DoseEventDTO | null;
  onConfirm: (doseId: string, reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const COMMON_REASONS = [
  "Side effects",
  "Fasting / Lab test",
  "Out of supply",
  "Doctor advised",
  "Forgot medication",
];

export function SkipDialog({
  open,
  onOpenChange,
  dose,
  onConfirm,
  isSubmitting = false,
}: SkipDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  if (!dose) return null;

  const handleSkip = async () => {
    const finalReason = customReason.trim() || selectedReason || undefined;
    await onConfirm(dose.id, finalReason);
    setSelectedReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <AlertTriangle className="size-4" />
          </div>
          <span>Skip {dose.medication.name}</span>
        </div>
      }
      description="Skipped doses are logged in your adherence history. Once skipped, a dose cannot be marked taken."
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
            variant="destructive"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Skipping…" : "Skip Dose"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Reason for skipping (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((reason) => {
              const active = selectedReason === reason && !customReason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    setCustomReason("");
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    active
                      ? "border-primary bg-primary-tint text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <Input
            placeholder="Or type another reason…"
            value={customReason}
            onChange={(e) => {
              setCustomReason(e.target.value);
              setSelectedReason("");
            }}
            maxLength={200}
            className="text-xs"
          />
        </div>
      </div>
    </ResponsiveDialog>
  );
}
