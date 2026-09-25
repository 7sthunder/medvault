"use client";

import { useState } from "react";

import { useNow } from "@/components/layout/clock-context";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { DOSE_ACTION_META } from "@/shared/actions";
import { formatDayHeading, formatInstant } from "@/lib/format";
import { localDateKey, rangeByPreset } from "@/shared/times";
import type { HistoryPageDTO, MedicationDTO } from "@/shared/types";

type HistoryStatus = "taken" | "missed" | "skipped" | "snoozed";

/**
 * §11.10 `/history` — the trustworthy record of dose activity: filterable, cursor-paginated
 * `dose_actions` timeline. Archived meds render with their stable name snapshot and an
 * "archived" tag; take-late shows a "was missed" badge (meta.takenLate).
 */
export function HistoryPage() {
  const { user } = useShell();
  const timeZone = user.timezone;
  const now = useNow();
  const [from, setFrom] = useState<string>(() => {
    const { from } = rangeByPreset("30d", { now, timeZone });
    return localDateKey(from, timeZone);
  });
  const [to, setTo] = useState<string>(() => localDateKey(now, timeZone));
  const [medicationId, setMedicationId] = useState<string | undefined>();
  const [status, setStatus] = useState<HistoryStatus | undefined>();
  const [cursor, setCursor] = useState<string | null>(null);

  const meds = api.medication.list.useQuery(undefined, { staleTime: 30_000 });
  const medications = [...(meds.data?.medications ?? []), ...(meds.data?.archived ?? [])];
  const history = api.history.query.useQuery(
    { from, to, medicationId, status, cursor: cursor ?? undefined },
    { staleTime: 15_000, placeholderData: (prev) => prev },
  );

  const items = history.data?.items ?? [];
  const nextCursor = history.data?.nextCursor ?? null;

  return (
    <main className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl font-extrabold text-ink-900">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every dose action, kept as a permanent record. Archived medications stay visible.
        </p>
      </header>

      <FilterBar
        timeZone={timeZone}
        from={from}
        to={to}
        onFromChange={(v) => {
          setFrom(v);
          setCursor(null);
        }}
        onToChange={(v) => {
          setTo(v);
          setCursor(null);
        }}
        medications={medications}
        medicationId={medicationId}
        onMedicationChange={(v) => {
          setMedicationId(v ?? undefined);
          setCursor(null);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus((v as HistoryStatus) ?? undefined);
          setCursor(null);
        }}
      />

      <div className="mt-5">
        {history.isLoading ? (
          <HistorySkeleton />
        ) : history.isError ? (
          <ErrorState
            className="mt-6"
            title="Couldn't load history"
            action={
              <Button variant="outline" onClick={() => void history.refetch()}>
                Try again
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="No activity in this range"
            description="Take, snooze or skip a dose and it will show up here as a permanent record."
          />
        ) : (
          <HistoryTimeline items={items} timeZone={timeZone} />
        )}
      </div>

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => setCursor(nextCursor)}>
            Load older
          </Button>
        </div>
      )}
    </main>
  );
}

/** §11.10 filter bar — range (day keys), medication select, resolved-status select. */
function FilterBar(props: {
  timeZone: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  medications: MedicationDTO[];
  medicationId?: string;
  onMedicationChange: (v: string | null) => void;
  status?: string;
  onStatusChange: (v: string | null) => void;
}) {
  const statusOptions = [
    { value: "taken", label: "Taken" },
    { value: "missed", label: "Missed" },
    { value: "skipped", label: "Skipped" },
    { value: "snoozed", label: "Snoozed" },
  ];
  return (
    <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3 shadow-card-sm">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        From
        <input
          type="date"
          value={props.from}
          onChange={(e) => props.onFromChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        To
        <input
          type="date"
          value={props.to}
          onChange={(e) => props.onToChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Medication
        <select
          value={props.medicationId ?? ""}
          onChange={(e) => props.onMedicationChange(e.target.value || null)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
        >
          <option value="">All medications</option>
          {props.medications.map((med) => (
            <option key={med.id} value={med.id}>
              {med.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Status
        <select
          value={props.status ?? ""}
          onChange={(e) => props.onStatusChange(e.target.value || null)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
        >
          <option value="">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** §11.10 timeline — the `dose_actions` entries grouped by local day. */
function HistoryTimeline({
  items,
  timeZone,
}: {
  items: HistoryPageDTO["items"];
  timeZone: string;
}) {
  const byDay = new Map<string, HistoryPageDTO["items"]>();
  for (const item of items) {
    const key = localDateKey(item.occurredAt, timeZone);
    const list = byDay.get(key) ?? [];
    list.push(item);
    byDay.set(key, list);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="flex flex-col gap-5">
      {days.map(([dateKey, rows]) => (
        <section key={dateKey} aria-label={formatDayHeading(dateKey)}>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {formatDayHeading(dateKey)}
          </h2>
          <Card className="shadow-card-sm">
            <CardContent className="p-2">
              <ul className="flex flex-col gap-1">
                {rows.map((row) => (
                  <HistoryRow key={row.id} row={row} timeZone={timeZone} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}

function HistoryRow({ row, timeZone }: { row: HistoryPageDTO["items"][number]; timeZone: string }) {
  const meta = DOSE_ACTION_META[row.action];
  const takenLate = Boolean(row.meta?.takenLate) || row.meta?.fromStatus === "missed";
  const skipReason = typeof row.meta?.reason === "string" ? row.meta.reason : null;
  const archived = Boolean(row.medication.archivedAt);
  const time = formatInstant(row.occurredAt, timeZone);

  const title =
    row.action === "take"
      ? `Took ${row.medication.dosageAmount} ${row.medication.dosageUnit} ${row.medication.name}`
      : row.action === "snooze"
        ? `Snoozed ${row.medication.name}`
        : row.action === "skip"
          ? `Skipped ${row.medication.name}`
          : `${meta.label} ${row.medication.name}`;

  const subtitle = [
    row.action === "take" && takenLate ? "Was missed — taken late" : null,
    row.action === "skip" && skipReason ? `Reason: ${skipReason}` : null,
    archived ? "Archived" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <ListRow
        title={title}
        subtitle={subtitle || undefined}
        right={<span className="text-xs text-muted-foreground">{time}</span>}
      />
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((d) => (
        <div key={d} className="flex flex-col gap-1">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-col gap-1 rounded-xl p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
