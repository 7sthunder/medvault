"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatInstant } from "@/lib/format";
import type { DoseEventDTO } from "@/shared/types";

import { DoseCard } from "../dose/DoseCard";
import { SkipDialog } from "../dose/SkipDialog";

export interface NextDoseHeroProps {
  dose: DoseEventDTO | null;
  medStatus: "active" | "paused";
  timeZone: string;
  now: Date;
  busy: boolean;
  onTake: (dose: DoseEventDTO) => void;
  onSnooze: (dose: DoseEventDTO) => void;
  onSkip: (id: string, reason?: string) => void;
}

/**
 * §11.4 widget 1 — hero action block: the single "what do I take now?" dose.
 * Renders the shared `DoseCard` (with Take/Snooze/Skip) on an emerald-tinted glass
 * card so it pulls focus; when nothing is due it shows the "All caught up" state.
 */
export function NextDoseHero({
  dose,
  medStatus,
  timeZone,
  now,
  busy,
  onTake,
  onSnooze,
  onSkip,
}: NextDoseHeroProps) {
  const [skipTarget, setSkipTarget] = useState<{ id: string; name: string } | null>(null);

  if (!dose) {
    return (
      <Card
        data-slot="next-dose-hero"
        className="border-primary/20 bg-primary-tint/40 shadow-card-lg"
      >
        <CardContent className="px-4 py-6">
          <EmptyState
            compact
            icon={CheckCircle2}
            title="All caught up"
            description="Nothing to take right now. Your next dose appears here when it's due."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-slot="next-dose-hero"
      className="border-primary/20 bg-primary-tint/40 shadow-card-lg"
    >
      <CardContent className="px-4 py-5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary-dark uppercase">
          <Clock className="size-3.5" aria-hidden="true" />
          {dose.status === "due-now" ? "Due now" : "Next dose"}
        </div>
        <ul className="space-y-2">
          <DoseCard
            dose={dose}
            medStatus={medStatus}
            timeZone={timeZone}
            now={now}
            busy={busy}
            onTake={() => onTake(dose)}
            onSnooze={() => onSnooze(dose)}
            onSkip={() => setSkipTarget({ id: dose.id, name: dose.medication.name })}
          />
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {dose.status === "due-now"
            ? "Was due at " + formatInstant(dose.scheduledFor, timeZone)
            : "Scheduled for " + formatInstant(dose.scheduledFor, timeZone)}
        </p>
      </CardContent>

      <SkipDialog
        open={skipTarget !== null}
        target={skipTarget}
        onOpenChange={(open) => {
          if (!open) setSkipTarget(null);
        }}
        onConfirm={(reason) => {
          if (!skipTarget) return;
          onSkip(skipTarget.id, reason);
          setSkipTarget(null);
        }}
      />
    </Card>
  );
}
