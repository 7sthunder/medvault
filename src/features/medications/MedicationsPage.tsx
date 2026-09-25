"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Archive, CheckCircle2, ChevronRight, PauseCircle, Pill, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { useAppHref } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/trpc";
import { FREQUENCY_LABEL_TEXT } from "@/shared/enums";
import type { MedicationDTO } from "@/shared/types";

import {
  filterMedications,
  medTintClasses,
  slotTimeLine,
  type MedicationStatusFilter,
} from "./medication-utils";

const STATUS_FILTERS: readonly { value: MedicationStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const pickIconClass = (med: MedicationDTO) => medTintClasses(med.color);

/**
 * §11.6 medications list — three stat tiles (active / paused / archived), a
 * sortable table for active meds (pause/resume inline) and a secondary list for
 * archived meds. Row navigation drops you onto the per-medication detail page.
 */
export function MedicationsPage() {
  const router = useRouter();
  const href = useAppHref();
  const list = api.medication.list.useQuery(undefined, { staleTime: 60_000 });
  const setStatus = api.medication.setStatus.useMutation();
  const utils = api.useUtils();

  // Memoised on `list.data` rather than on the `?? []` fallbacks: a fresh array literal is a new
  // identity every render, which would defeat the `filtered` memo below and re-run the search on
  // every keystroke-triggered re-render.
  const { medications, archived } = useMemo(
    () => ({ medications: list.data?.medications ?? [], archived: list.data?.archived ?? [] }),
    [list.data],
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MedicationStatusFilter>("all");

  const filtered = useMemo(
    () => filterMedications(medications, archived, { query, status: statusFilter }),
    [medications, archived, query, statusFilter],
  );

  const isMutating = Boolean(setStatus.isPending);

  const refreshViews = () => {
    void utils.medication.list.invalidate();
    void utils.schedule.day.invalidate();
    void utils.schedule.get.invalidate();
  };

  const toggleStatus = (med: MedicationDTO) => {
    const next = med.status === "active" ? "paused" : "active";
    setStatus.mutate(
      { id: med.id, status: next },
      {
        onSuccess: () => {
          refreshViews();
          toast.success(next === "paused" ? `${med.name} paused` : `${med.name} resumed`);
        },
        onError: () =>
          toast.error(`Couldn't ${next === "paused" ? "pause" : "resume"} ${med.name}.`),
      },
    );
  };

  if (list.isLoading) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </main>
    );
  }

  const active = medications.filter((med) => med.status === "active");
  const paused = medications.filter((med) => med.status === "paused");
  return (
    <main className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">Medications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your medication list — active doses and anything you’ve archived.
          </p>
        </div>
        <Button onClick={() => router.push(href("/medications/new"))}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add medication
        </Button>
      </header>

      {list.isError || !list.data ? (
        <ErrorState
          className="mt-8"
          title="Couldn’t load your medications"
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              Try again
            </Button>
          }
        />
      ) : medications.length === 0 && archived.length === 0 ? (
        <EmptyState
          className="mt-16"
          icon={Pill}
          title="No medications yet"
          description="Add your first medication to start tracking doses."
          action={
            <Button onClick={() => router.push(href("/medications/new"))}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add medication
            </Button>
          }
        />
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Active"
              value={String(active.length)}
              icon={CheckCircle2}
              tone="emerald"
              subtitle="Currently scheduled"
            />
            <StatCard
              title="Paused"
              value={String(paused.length)}
              icon={PauseCircle}
              tone="amber"
              subtitle="Temporarily on hold"
            />
            <StatCard
              title="Archived"
              value={String(archived.length)}
              icon={Archive}
              tone="violet"
              subtitle="Retired medications"
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <label htmlFor="medication-search" className="sr-only">
                  Search medications
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="medication-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, dose or time"
                  className="pl-9"
                />
              </div>
              <div
                role="group"
                aria-label="Filter medications by status"
                className="flex flex-wrap items-center gap-1.5"
              >
                {STATUS_FILTERS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={statusFilter === option.value ? "default" : "outline"}
                    aria-pressed={statusFilter === option.value}
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <h2 className="font-heading text-lg font-bold text-ink-900">Active</h2>
            {filtered.active.length === 0 &&
            filtered.paused.length === 0 &&
            filtered.filteredOut ? (
              <EmptyState
                icon={Search}
                title="No medications match that search"
                description="Try a different name, dose or time — or clear the filters to see everything again."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <DataTable<MedicationDTO>
                ariaLabel="Active medications"
                rows={[...filtered.active, ...filtered.paused]}
                pageSize={10}
                rowKey={(med) => med.id}
                emptyTitle="No active medications"
                emptyDescription="Active medications keep your daily schedule running."
                columns={[
                  {
                    key: "name",
                    header: "Medication",
                    value: (med) => med.name,
                    render: (med) => (
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: med.color }}
                        />
                        <span className="grid min-w-0 gap-0.5">
                          <span className="truncate font-semibold text-ink-900">{med.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {med.dosageAmount} {med.dosageUnit}
                          </span>
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "frequency",
                    header: "Frequency",
                    value: (med) => FREQUENCY_LABEL_TEXT[med.frequencyLabel],
                    render: (med) => FREQUENCY_LABEL_TEXT[med.frequencyLabel],
                    hideBelow: "md",
                  },
                  {
                    key: "times",
                    header: "Times",
                    value: (med) => slotTimeLine(med.slots),
                    render: (med) => slotTimeLine(med.slots),
                    hideBelow: "sm",
                  },
                  {
                    key: "status",
                    header: "Status",
                    sortable: false,
                    render: (med) => (
                      <Chip tone={med.status === "active" ? "emerald" : "amber"}>
                        {med.status === "active" ? "Active" : "Paused"}
                      </Chip>
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    sortable: false,
                    headerClassName: "w-24",
                    render: (med) => (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleStatus(med);
                        }}
                      >
                        {med.status === "active" ? "Pause" : "Resume"}
                      </Button>
                    ),
                  },
                ]}
                onRetry={() => void list.refetch()}
              />
            )}
          </section>

          {filtered.archived.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-ink-900">
                Archived{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  ({filtered.archived.length})
                </span>
              </h2>
              <div className="flex flex-col rounded-xl border border-border bg-card shadow-card-sm">
                {filtered.archived.map((med) => (
                  <ListRow
                    key={med.id}
                    icon={Pill}
                    iconClass={pickIconClass(med)}
                    title={med.name}
                    subtitle={`${med.dosageAmount} ${med.dosageUnit} · ${slotTimeLine(med.slots)}`}
                    right={
                      <>
                        <Chip
                          tone="neutral"
                          leading={<Archive className="size-3" aria-hidden="true" />}
                        >
                          Archived
                        </Chip>
                        <ChevronRight className="size-4 text-ink-400" aria-hidden="true" />
                      </>
                    }
                    onClick={() => router.push(href(`/medications/${med.id}`))}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
