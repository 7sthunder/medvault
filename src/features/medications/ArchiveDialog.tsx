"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

export interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationName: string;
  isArchiving?: boolean;
  onConfirm: () => void;
}

export function ArchiveDialog({
  open,
  onOpenChange,
  medicationName,
  isArchiving = false,
  onConfirm,
}: ArchiveDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-red-tint text-red">
            <AlertTriangle className="size-4.5" />
          </div>
          <span>Archive {medicationName}?</span>
        </div>
      }
      description="Archiving this medication will deactivate its daily schedule and cancel all upcoming scheduled doses."
      footer={
        <div className="flex w-full items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isArchiving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isArchiving}
            onClick={onConfirm}
          >
            {isArchiving ? "Archiving..." : "Archive Medication"}
          </Button>
        </div>
      }
    >
      <div className="rounded-xl border border-border bg-card-tint p-3 text-xs text-muted-foreground my-2">
        <span className="font-semibold text-ink-800 dark:text-ink-100">Historical guarantee:</span>{" "}
        All past taken, missed, and recorded doses are safely preserved in your history and adherence reports.
      </div>
    </ResponsiveDialog>
  );
}
