"use client";

import Link from "next/link";
import { Archive, ArrowRight, Clock, Edit2, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FREQUENCY_LABEL_TEXT } from "@/shared/enums";
import type { MedicationDTO } from "@/shared/types";

export interface MedicationCardProps {
  medication: MedicationDTO;
  onToggleStatus: (id: string, currentStatus: "active" | "paused") => void;
  onOpenArchive: (medication: MedicationDTO) => void;
  isToggling?: boolean;
}

export function MedicationCard({
  medication,
  onToggleStatus,
  onOpenArchive,
  isToggling = false,
}: MedicationCardProps) {
  const isArchived = Boolean(medication.archivedAt);
  const isPaused = medication.status === "paused" && !isArchived;
  const isActive = medication.status === "active" && !isArchived;

  const frequencyText =
    FREQUENCY_LABEL_TEXT[medication.frequencyLabel] ?? medication.frequencyLabel;
  const activeSlots = medication.slots.filter((s) => s.enabled);
  const timesSummary = activeSlots.map((s) => s.timeOfDay).join(", ");

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden p-5 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="space-y-3">
        {/* Header: Color Indicator, Name, Dosage & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="size-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: medication.color || "var(--primary)" }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <Link
                href={`/medications/${medication.id}`}
                className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100 hover:text-primary transition-colors truncate block"
              >
                {medication.name}
              </Link>
              <p className="text-xs text-muted-foreground font-mono">
                {medication.dosageAmount} {medication.dosageUnit}
              </p>
            </div>
          </div>

          <div>
            {isArchived ? (
              <Badge variant="outline" className="text-muted-foreground bg-muted/50">
                Archived
              </Badge>
            ) : isPaused ? (
              <Badge variant="outline" className="border-amber/40 bg-amber-tint text-amber">
                Paused
              </Badge>
            ) : (
              <Badge variant="outline" className="border-primary/40 bg-primary-tint text-primary">
                Active
              </Badge>
            )}
          </div>
        </div>

        {/* Schedule & Timing Info */}
        <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-ink-700 dark:text-ink-300">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{frequencyText}</span>
            {timesSummary && (
              <span className="text-muted-foreground">({timesSummary})</span>
            )}
          </div>

          {medication.instructions && (
            <p className="line-clamp-1 italic text-ink-600 dark:text-ink-400">
              &ldquo;{medication.instructions}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          {!isArchived && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isToggling}
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={() => onToggleStatus(medication.id, medication.status)}
            >
              {isActive ? (
                <>
                  <Pause className="size-3 text-amber" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="size-3 text-primary" />
                  <span>Resume</span>
                </>
              )}
            </Button>
          )}

          {!isArchived && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="size-8 p-0 text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100"
              render={<Link href={`/medications/${medication.id}/edit`} />}
              title="Edit medication"
              aria-label={`Edit ${medication.name}`}
            >
              <Edit2 className="size-3.5" />
            </Button>
          )}

          {!isArchived && (
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-muted-foreground hover:text-red"
              onClick={() => onOpenArchive(medication)}
              title="Archive medication"
              aria-label={`Archive ${medication.name}`}
            >
              <Archive className="size-3.5" />
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 text-xs font-medium text-primary gap-1 px-2"
          render={<Link href={`/medications/${medication.id}`} />}
        >
          <span>Details</span>
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </Card>
  );
}
