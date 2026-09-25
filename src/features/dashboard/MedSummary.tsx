"use client";

import Link from "next/link";
import { ArrowRight, Pill, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import type { MedicationDTO } from "@/shared/types";

export interface MedSummaryProps {
  medications: MedicationDTO[];
}

export function MedSummary({ medications }: MedSummaryProps) {
  const displayMeds = medications.slice(0, 4);

  return (
    <section
      data-testid="med-summary-section"
      className="rounded-3xl border border-border/75 bg-card/85 p-6 shadow-card-sm backdrop-blur-md space-y-4 transition-all duration-300 hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel tone="violet" leading={<Pill className="size-3.5" />}>
            Medications
          </SectionLabel>
          <h2 className="font-heading text-lg font-bold text-ink-900 dark:text-ink-100">
            Active Prescriptions
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-primary font-medium hover:text-primary-dark"
          nativeButton={false}
          render={<Link href="/medications" />}
        >
          <span>Manage ({medications.length})</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {medications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 px-4 text-center">
          <p className="text-sm font-medium text-ink-800 dark:text-ink-200">
            No active medications
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Start by adding your first medication to get reminder alerts and track intake.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5 text-xs"
            nativeButton={false}
            render={<Link href="/medications/new" />}
          >
            <Plus className="size-3.5" />
            <span>Add Medication</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayMeds.map((med) => (
            <Link
              key={med.id}
              href={`/medications/${med.id}`}
              className="group flex items-center justify-between rounded-xl border border-border/70 bg-card/50 p-3 hover:border-primary/50 hover:bg-muted/40 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg shrink-0 font-bold text-xs"
                  style={{
                    backgroundColor: med.color ? `${med.color}20` : "var(--primary-tint)",
                    color: med.color || "var(--primary)",
                  }}
                >
                  <Pill className="size-4" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100 group-hover:text-primary transition-colors">
                    {med.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {med.dosageAmount} {med.dosageUnit} · {med.frequencyLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                  Active
                </Badge>
                <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}

          {medications.length > 4 && (
            <p className="text-center text-xs text-muted-foreground pt-1">
              +{medications.length - 4} more medications registered
            </p>
          )}
        </div>
      )}
    </section>
  );
}
