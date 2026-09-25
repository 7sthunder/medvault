"use client";

import Link from "next/link";
import { CalendarClock, Copy, MoreVertical, Pill } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DoseActionDTO } from "@/shared/types";

export interface HistoryRowMenuProps {
  action: DoseActionDTO;
}

export function HistoryRowMenu({ action }: HistoryRowMenuProps) {
  const handleCopy = () => {
    const text = `${action.action.toUpperCase()}: ${action.medication.name} (${action.medication.dosageAmount} ${action.medication.dosageUnit}) at ${new Date(action.occurredAt).toLocaleString()}`;
    void navigator.clipboard.writeText(text);
    toast.success("Event details copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="More options"
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          render={<Link href={`/medications/${action.medication.id}`} />}
          className="gap-2 text-xs"
        >
          <Pill className="size-3.5 text-muted-foreground" />
          <span>View Medication</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          render={<Link href={`/schedule/${action.doseEventId}`} />}
          className="gap-2 text-xs"
        >
          <CalendarClock className="size-3.5 text-muted-foreground" />
          <span>View Dose Schedule</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopy} className="gap-2 text-xs">
          <Copy className="size-3.5 text-muted-foreground" />
          <span>Copy Event Info</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
