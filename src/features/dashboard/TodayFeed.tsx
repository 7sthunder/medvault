"use client";

import { ChevronRight, Pill } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatInstant } from "@/lib/format";
import type { DoseEventDTO } from "@/shared/types";

/**
 * §11.4 widget 3 — today's schedule feed (compact rows, grouped by live status),
 * linking through to the full `/schedule` page. Reuses the same display status set
 * as the schedule feed so statuses are literal ("due-now" pulsing etc.).
 */
export function TodayFeed({ events, timeZone }: { events: DoseEventDTO[]; timeZone: string }) {
  const precedence = { "due-now": 0, snoozed: 1, upcoming: 2, missed: 3 } as const;
  const sorted = [...events].sort((a, b) => {
    const pa = precedence[a.status as keyof typeof precedence] ?? 9;
    const pb = precedence[b.status as keyof typeof precedence] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.scheduledFor.getTime() - b.scheduledFor.getTime();
  });

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Pill}
        title="No doses scheduled today"
        description="Nothing is on the schedule for today. Add a medication or adjust a schedule to get started."
      />
    );
  }

  return (
    <section aria-label="Today's schedule">
      <SectionLabel tone="emerald">
        <span>Today&apos;s Schedule</span>
        <span className="opacity-60">· {sorted.length}</span>
      </SectionLabel>
      <div className="mt-2 rounded-xl border border-border bg-card shadow-card-sm">
        {sorted.map((dose) => (
          <a
            key={dose.id}
            href={`/schedule/${dose.id}`}
            className="block no-underline"
            aria-label={`${dose.medication.name}, ${formatInstant(dose.scheduledFor, timeZone)}`}
          >
            <ListRow
              icon={Pill}
              title={dose.medication.name}
              subtitle={formatInstant(dose.scheduledFor, timeZone)}
              right={
                <>
                  <StatusIndicator status={dose.status as never} className="shrink-0" />
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