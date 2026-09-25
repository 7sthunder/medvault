"use client";

import type { ReactElement, ReactNode } from "react";
import { cn } from "cn";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/lib/use-media-query";

export interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Element to clone as the trigger (both DialogTrigger and DrawerTrigger). */
  trigger?: ReactElement;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Phase 08 composite overlay — centered `Dialog` at `md+` and a bottom-sheet
 * `Drawer` below `md` (plan §16: "date range picker → sheets on mobile" motivates
 * the same pattern for confirmations, form modals and pickers). Same `open`/
 * `onOpenChange` contract either way, so consumers stay device-agnostic.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  footer,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger render={trigger} />}
        <DrawerContent className={className}>
          <DrawerHandle />
          {(title || description) && (
            <DrawerHeader>
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div className="grid gap-4">{children}</div>
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className={cn("gap-5", className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="grid gap-4">{children}</div>
        {footer && <DialogFooter showCloseButton={false}>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
