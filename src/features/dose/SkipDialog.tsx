"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SKIP_REASON_MAX } from "@/shared/constants";

export interface SkipTarget {
  id: string;
  name: string;
}

/**
 * §10.4 skip confirmation — reason is optional (§13 `skipReason` ≤ `SKIP_REASON_MAX`);
 * skipping is destructive to the day (scheduled dose doesn't happen) so it always
 * asks before acting.
 */
export function SkipDialog({
  open,
  target,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  target: SkipTarget | null;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  // Clear the reason when the dialog closes, so reopening starts from a blank field. Done during
  // render rather than in an effect: the parent can close the dialog however it likes, and this
  // way the field is never briefly visible carrying the previous answer.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setReason("");
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={target ? `Skip ${target.name}?` : "Skip dose?"}
      description={
        target ? (
          <>
            This dose will be recorded as skipped and won&apos;t count toward your daily adherence.
            You can optionally tell us why.
          </>
        ) : undefined
      }
      confirmLabel="Skip dose"
      onConfirm={() => onConfirm?.(reason.trim() || undefined)}
    >
      <div className="mt-3">
        <label
          htmlFor="skip-reason"
          className="mb-1 block text-xs font-semibold text-muted-foreground"
        >
          Reason (optional)
        </label>
        <textarea
          id="skip-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={SKIP_REASON_MAX}
          rows={2}
          placeholder="e.g. took at work, feeling unwell"
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </div>
    </ConfirmationDialog>
  );
}
