"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { useNow } from "@/components/layout/clock-context";
import { useShell } from "@/components/layout/shell-context";
import { formatDayHeading, shiftDateKey } from "@/lib/format";
import { api } from "@/lib/trpc";
import { localDateKey } from "@/shared/times";
import type { DoseEventDTO } from "@/shared/types";

import { DoseCard } from "../dose/DoseCard";
import { useDoseActions } from "../dose/useDoseActions";
import { SkipDialog } from "../dose/SkipDialog";
import { useMedicationStatuses } from "./useMedicationStatuses";
import type { MedStatusMap } from "./useMedicationStatuses";

/**
 * §11.7 Today's Schedule — the day's full dose feed. Reads through the canonical
 * `schedule.day` router (reconcile + horizon-extend + query) and lets the user
 * take / snooze / skip each actionable dose in place.
 */
export function SchedulePage() {
  const { user } = useShell();
  const timeZone = user.timezone;
  const now = useNow();
  const [date, setDate] = useState(() => localDateKey(now, timeZone));
  const today = localDateKey(now, timeZone);
  const { data, isLoading, isError, error, refetch } = api.schedule.day.useQuery({ date });
  const { take, snooze, skip, isPending } = useDoseActions();
  const medications = useMedicationStatuses();
  const [skipTarget, setSkipTarget] = useState<{ id: string; name: string } | null>(null);

  const events = data?.events ?? [];

  const go = (delta: number) => setDate((d) => shiftDateKey(d, delta));

  const grouped = {
    "due-now": events.filter((e) => e.status === "due-now"),
    snoozed: events.filter((e) => e.status === "snoozed"),
    upcoming: events.filter((e) => e.status === "upcoming"),
    done: events.filter(
      (e) => e.status !== "due-now" && e.status !== "snoozed" && e.status !== "upcoming",
    ),
  } as const;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">
            {formatDayHeading(date)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {date === today ? "Today" : date < today ? "An earlier day" : "A later day"} · your
            active-medication schedule
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-xs" aria-label="Previous day" onClick={() => go(-1)}>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            aria-label="Next day"
            disabled={date >= today}
            onClick={() => go(1)}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setDate(today)}
            disabled={date === today}
          >
            Today
          </Button>
        </div>
      </header>

      {isError ? (
        <ErrorState
          message={error?.message ?? "Couldn't load your schedule."}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <SectionSkeleton />
      ) : grouped["due-now"].length +
          grouped.snoozed.length +
          grouped.upcoming.length +
          grouped.done.length ===
        0 ? (
        <EmptySchedule onBrowse={() => setDate(today)} />
      ) : (
        <div className="mt-6 space-y-6">
          {grouped["due-now"].length > 0 && (
            <DoseSection label="Due now" count={grouped["due-now"].length} accent="text-red">
              {grouped["due-now"].map((d) => (
                <DoseCard
                  key={d.id}
                  dose={d}
                  medStatus={medStatusOf(d, medications)}
                  timeZone={timeZone}
                  now={now}
                  busy={isPending}
                  onTake={(dose) => void take(dose.id)}
                  onSnooze={(dose) => void snooze(dose.id)}
                  onSkip={(dose) => setSkipTarget({ id: dose.id, name: dose.medication.name })}
                />
              ))}
            </DoseSection>
          )}
          {grouped.snoozed.length > 0 && (
            <DoseSection label="Snoozed" count={grouped.snoozed.length} accent="text-amber">
              {grouped.snoozed.map((d) => (
                <DoseCard
                  key={d.id}
                  dose={d}
                  medStatus={medStatusOf(d, medications)}
                  timeZone={timeZone}
                  now={now}
                  busy={isPending}
                  onTake={(dose) => void take(dose.id)}
                  onSnooze={(dose) => void snooze(dose.id)}
                  onSkip={(dose) => setSkipTarget({ id: dose.id, name: dose.medication.name })}
                />
              ))}
            </DoseSection>
          )}
          {grouped.upcoming.length > 0 && (
            <DoseSection label="Upcoming" count={grouped.upcoming.length} accent="text-blue">
              {grouped.upcoming.map((d) => (
                <DoseCard
                  key={d.id}
                  dose={d}
                  medStatus={medStatusOf(d, medications)}
                  timeZone={timeZone}
                  now={now}
                  busy={isPending}
                  onTake={(dose) => void take(dose.id)}
                  onSnooze={(dose) => void snooze(dose.id)}
                  onSkip={(dose) => setSkipTarget({ id: dose.id, name: dose.medication.name })}
                />
              ))}
            </DoseSection>
          )}
          {grouped.done.length > 0 && (
            <DoseSection label="Earlier" count={grouped.done.length} accent="text-ink-400">
              {grouped.done.map((d) => (
                <DoseCard
                  key={d.id}
                  dose={d}
                  medStatus={medStatusOf(d, medications)}
                  timeZone={timeZone}
                  now={now}
                  busy={isPending}
                  onTake={(dose) => void take(dose.id)}
                  onSnooze={(dose) => void snooze(dose.id)}
                  onSkip={(dose) => setSkipTarget({ id: dose.id, name: dose.medication.name })}
                />
              ))}
            </DoseSection>
          )}
        </div>
      )}

      <SkipDialog
        open={skipTarget !== null}
        target={skipTarget}
        onOpenChange={(open) => {
          if (!open) setSkipTarget(null);
        }}
        onConfirm={(reason) => {
          if (!skipTarget) return;
          void skip(skipTarget.id, reason).finally(() => setSkipTarget(null));
        }}
      />
    </main>
  );
}

function DoseSection({
  label,
  count,
  accent,
  children,
}: {
  label: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label}>
      <SectionLabel className={accent}>
        <span>{label}</span>
        <span className="opacity-60">· {count}</span>
      </SectionLabel>
      <ul className="mt-2 space-y-2">{children}</ul>
    </section>
  );
}

/** Per-dose display status (used to pick the card's med-state for action gating). */
function medStatusOf(dose: DoseEventDTO, statuses: MedStatusMap): "active" | "paused" {
  return statuses[dose.medicationId] ?? "active";
}

function EmptySchedule({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={ListCheckIcon}
      title="No doses scheduled"
      description="There are no dose events on this day. Try another day, or add a medication to start a schedule."
      action={<Button onClick={onBrowse}>Back to today</Button>}
    />
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon={ListCheckIcon}
      title="Couldn't load your schedule"
      description={message}
      action={<Button onClick={onRetry}>Try again</Button>}
    />
  );
}

const ListCheckIcon = ListChecks;

function SectionSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      ))}
    </div>
  );
}
