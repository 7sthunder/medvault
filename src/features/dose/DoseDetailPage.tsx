"use client";

import { use, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useAppHref, useShell } from "@/components/layout/shell-context";
import { formatInstant } from "@/lib/format";
import { api } from "@/lib/trpc";
import { actionMeta } from "@/shared/actions";
import type { DoseStatus } from "@/shared/enums";
import { cn } from "cn";

import { useDoseActions } from "../dose/useDoseActions";
import { SkipDialog } from "../dose/SkipDialog";

/**
 * §11.7 dose detail — one dose + its append-only audit timeline. Lets you take /
 * snooze / skip inline, then shows the event fields (deadline, snooze loop, etc.).
 */
export function DoseDetailPage({ doseIdPromise }: { doseIdPromise: Promise<string> }) {
  const doseId = use(doseIdPromise);
  const { user } = useShell();
  const href = useAppHref();
  const timeZone = user.timezone;
  const { data, isLoading, isError } = api.schedule.get.useQuery({ id: doseId });
  const { take, snooze, skip, isPending } = useDoseActions();
  const [skipOpen, setSkipOpen] = useState(false);

  const event = data?.event;

  const groups = useMemo(() => {
    const byAction: Record<string, { count: number; lastOccurredAt: Date }> = {};
    for (const action of data?.history ?? []) {
      const label = actionMeta(action.action).label;
      const existing = byAction[label];
      if (existing) {
        existing.count += 1;
        if (action.occurredAt > existing.lastOccurredAt)
          existing.lastOccurredAt = action.occurredAt;
      } else {
        byAction[label] = { count: 1, lastOccurredAt: action.occurredAt };
      }
    }
    return Object.entries(byAction);
  }, [data]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState
          icon={AlertCircle}
          title="Dose not found"
          description="This dose could not be loaded. It may have been archived or removed."
          action={
            <Link href={href("/schedule")}>
              <Button variant="outline">
                <ArrowLeft className="mr-1.5" aria-hidden="true" />
                Back to schedule
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const actionDisabled = isPending;
  const actionable = event.status === "due-now";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={href("/schedule")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Today&apos;s Schedule
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: event.medication.color }}
          />
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-ink-900">
              {event.medication.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {event.medication.dosageAmount} {event.medication.dosageUnit}
              {event.source === "demo" ? " · sample dose" : ""}
            </p>
          </div>
        </div>
        <StatusIndicator status={event.status as DoseStatus} />
      </header>

      <section aria-label="Dose actions" className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          onClick={() => void take(doseId)}
          disabled={actionDisabled || !actionable}
        >
          Mark taken
        </Button>
        <Button
          variant="outline"
          onClick={() => void snooze(doseId)}
          disabled={actionDisabled || !actionable}
        >
          Snooze
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSkipOpen(true)}
          disabled={actionDisabled || !actionable}
        >
          Skip this dose
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          Scheduled {formatInstant(event.scheduledFor, timeZone)}
        </span>
      </section>

      <section aria-label="Dose details" className="mt-8">
        <SectionLabel tone="blue">Dose details</SectionLabel>
        <dl className="mt-2 divide-y divide-border rounded-xl border border-border bg-background text-sm">
          <DetailRow label="Scheduled for">{formatInstant(event.scheduledFor, timeZone)}</DetailRow>
          <DetailRow label="Status">
            <span data-status={event.status}>{event.status.replace(/-/g, " ")}</span>
          </DetailRow>
          {event.missedDeadline && (
            <DetailRow label="Missed after">
              {formatInstant(event.missedDeadline, timeZone)}
            </DetailRow>
          )}
          <DetailRow label="Snoozes used">{event.snoozeCount}</DetailRow>
          {event.snoozeUntil && (
            <DetailRow label="Snoozed until">
              {formatInstant(event.snoozeUntil, timeZone)}
            </DetailRow>
          )}
          {event.takenAt && (
            <DetailRow label="Marked taken at">{formatInstant(event.takenAt, timeZone)}</DetailRow>
          )}
          {event.skippedReason && <DetailRow label="Skip reason">{event.skippedReason}</DetailRow>}
        </dl>
      </section>

      {groups.length > 0 ? (
        <section aria-label="Audit history" className="mt-8">
          <SectionLabel tone="blue">History</SectionLabel>
          <ol className="mt-2 space-y-3">
            {groups.map(([label, group]) => (
              <li key={label} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-ink-900">{label}</span>
                <span className="text-muted-foreground">
                  {group.count > 1 ? `${group.count}× · ` : ""}
                  {formatInstant(group.lastOccurredAt, timeZone)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">No events recorded yet.</p>
      )}

      <SkipDialog
        target={{ id: doseId, name: event.medication.name }}
        open={skipOpen}
        onOpenChange={setSkipOpen}
        onConfirm={(reason) => {
          void skip(doseId, reason).finally(() => setSkipOpen(false));
        }}
      />
    </main>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium text-ink-900")}>{children}</dd>
    </div>
  );
}
