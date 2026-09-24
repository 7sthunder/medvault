"use client"

import type { ComponentProps, ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmationDialogProps
  extends Omit<ComponentProps<typeof Dialog>, "children"> {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "destructive" gives the confirm action the red treatment */
  tone?: "primary" | "destructive"
  confirmDisabled?: boolean
  onConfirm: () => void
}

/**
 * §2 confirmation sheet — used for dose deletion, schedule changes, logouts.
 * Reuses the dialog primitive; default destructive confirm for dangerous actions.
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "destructive",
  confirmDisabled = false,
  onConfirm,
  ...rest
}: ConfirmationDialogProps) {
  /** Base UI dialogs expect (open, eventDetails) — consumers only pass open. */
  const setOpen = (next: boolean) =>
    onOpenChange?.(next, {} as Parameters<NonNullable<typeof onOpenChange>>[1]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...rest}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            disabled={confirmDisabled}
            onClick={() => {
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}