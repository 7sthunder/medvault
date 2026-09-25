"use client";

import { ChevronRight, Pill } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { formatInstant } from "@/lib/format";
import { FREQUENCY_LABEL_TEXT } from "@/shared/enums";
import type { MedicationDTO } from "@/shared/types";

import { medTintClasses } from "../medications/medication-utils";

/**
 * §11.4 widget 5 — compact medication summary (active only): colored avatar, name,
 * frequency, next-dose time + per-med adherence chip → `/medications`. Sourced from
 * the same `medication.list` the medications page renders (filled extras).
 */
export function MedSummary({
  medications,
  timeZone,
}: {
  medications: MedicationDTO[];
  timeZone: string;
}) {
  const active = medications.filter((m) => m.status === "active");

  if (active.length === 0) return null;

  return (
    <section aria-label="Medication summary">
      <SectionLabel tone="violet">
        <span>Your Medications</span>
      </SectionLabel>
      <div className="mt-2 rounded-xl border border-border bg-card shadow-card-sm">
        {active.map((med) => (
          <a
            key={med.id}
            href={`/medications/${med.id}`}
            className="block no-underline"
            aria-label={med.name}
          >
            <ListRow
              icon={Pill}
              iconClass={medTintClasses(med.color)}
              title={med.name}
              subtitle={
                med.nextDoseAt
                  ? `${FREQUENCY_LABEL_TEXT[med.frequencyLabel]} · next ${formatInstant(med.nextDoseAt, timeZone)}`
                  : `${FREQUENCY_LABEL_TEXT[med.frequencyLabel]} · no upcoming dose`
              }
              right={
                <>
                  <Chip tone={med.adherencePercent != null ? "emerald" : "neutral"}>
                    {med.adherencePercent != null ? `${med.adherencePercent}%` : "No data"}
                  </Chip>
                  <ChevronRight className="size-4 text-ink-400" aria-hidden="true" />
                </>
              }
            />
          </a>
        ))}
      </div>
    </section>
  );
}
