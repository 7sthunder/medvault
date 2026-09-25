"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  BellRing,
  CalendarDays,
  PauseCircle,
  Pencil,
  Pill,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatDateKey, formatHhmm } from "@/lib/format";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { FREQUENCY_LABEL_TEXT } from "@/shared/enums";

import {
  daysLabel,
  dosageLabel,
  medTintClasses,
  slotTimeLine,
} from "./medication-utils";

/**
 * §11.6 medication detail — one medication's identity, current schedule slots
 * and lifecycle actions (edit / pause-resume / archive) behind confirmations.
 */
export function MedicationDetailPage({
  medicationIdPromise,
}: {
  medicationIdPromise: Promise<string>;
}) {
  const id = use(medicationIdPromise);
  const get = api.medication.get.useQuery({ id });
  const setStatus = api.medication.setStatus.useMutation();
  const archive = api.medication.archive.useMutation();
  const utils = api.useUtils();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (get.isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-32 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      </main>
    );
  }

  const med = get.data;
  if (get.isError || !med) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState
          icon={Pill}
          title="Medication not found"
          description="This medication could not be loaded. It may have been archived or removed."
          action={
            <Link href="/medications">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5" aria-hidden="true" />
                Back to medications
              </Button>
            </Link>
          }
        />
      </main>
    );
  }

  const refreshing = setStatus.isPending || archive.isPending;
  const archived = med.archivedAt !== null;
  const paused = med.status === "paused";

  const openPausedSlot = med.slots.find((slot) => slot.enabled === false);

  return (
    <main className="mx-auto max-w-3xl">
      <Link
        href="/medications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Medications
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl",
              medTintClasses(med.color),
            )}
          >
            <Pill className="size-5" strokeWidth={2.2} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-extrabold text-ink-900">{med.name}</h1>
              <Chip tone={archived ? "neutral" : paused ? "amber" : "emerald"}>
                {archived ? "Archived" : paused ? "Paused" : "Active"}
              </Chip>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {dosageLabel(med)} · {FREQUENCY_LABEL_TEXT[med.frequencyLabel]} ·{" "}
              {formatDateKey(med.startDate)}
              {med.endDate ? ` – ${formatDateKey(med.endDate)}` : " · ongoing"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!archived && (
            <Link href={`/medications/${med.id}/edit`}>
              <Button variant="outline" disabled={refreshing}>
                <Pencil data-icon="inline-start" aria-hidden="true" />
                Edit
              </Button>
            </Link>
          )}
          {!archived && (
            <Button
              variant={paused ? "default" : "outline"}
              disabled={refreshing}
              onClick={() => (paused ? setStatus.mutate(
                { id: med.id, status: "active" },
                {
                  onSuccess: () => {
                    void utils.medication.list.invalidate();
                    void utils.schedule.day.invalidate();
                    void utils.schedule.get.invalidate();
                    toast.success(`${med.name} resumed`);
                  },
                  onError: () => toast.error(`Couldn’t resume ${med.name}.`),
                },
              ) : setPauseOpen(true))}
            >
              {paused ? (
                <Play data-icon="inline-start" aria-hidden="true" />
              ) : (
                <PauseCircle data-icon="inline-start" aria-hidden="true" />
              )}
              {paused ? "Resume" : "Pause"}
            </Button>
          )}
          {!archived && (
            <Button variant="destructive" disabled={refreshing} onClick={() => setArchiveOpen(true)}>
              <Archive data-icon="inline-start" aria-hidden="true" />
              Archive
            </Button>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-8">
        <section className="grid gap-3">
          <SectionLabel tone="blue">Details</SectionLabel>
          <Card>
            <CardContent className="flex flex-col">
              <ListRow
                icon={Pill}
                iconClass={medTintClasses(med.color)}
                title={dosageLabel(med)}
                subtitle="Dose"
              />
              <ListRow
                icon={CalendarDays}
                iconClass="bg-blue-tint text-blue"
                title={FREQUENCY_LABEL_TEXT[med.frequencyLabel]}
                subtitle={`${slotTimeLine(med.slots)} · ${med.slots.length} dose${
                  med.slots.length === 1 ? "" : "s"
                } per day`}
              />
              <ListRow
                icon={BellRing}
                iconClass="bg-violet-tint text-violet"
                title={med.remindersEnabled ? "Reminders on" : "Reminders off"}
                subtitle="Dose reminders"
              />
            </CardContent>
          </Card>
          {med.instructions ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-ink-900">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-ink-800">{med.instructions}</CardContent>
            </Card>
          ) : null}
          {med.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-ink-900">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-ink-800">{med.notes}</CardContent>
            </Card>
          ) : null}
        </section>

        <section className="grid gap-3">
          <SectionLabel tone="blue">Schedule</SectionLabel>
          {paused ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusIndicator status="paused" />
              Doses are paused until you resume.
            </p>
          ) : openPausedSlot ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusIndicator status="paused" />
              Some slots are disabled — shown below.
            </p>
          ) : null}
          <Card>
            <CardContent className="flex flex-col">
              {med.slots.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No schedule slots.</p>
              ) : (
                med.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      "flex items-center justify-between gap-3 border-b border-border px-1 py-3 last:border-b-0",
                      !slot.enabled && "opacity-70",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-base font-bold text-ink-900">
                        {formatHhmm(slot.timeOfDay, { hour12: false })}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {daysLabel(slot.daysOfWeek)}
                      </span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {slot.dosageAmount != null ? (
                        <p className="font-medium text-ink-800">
                          {slot.dosageAmount} {med.dosageUnit}
                        </p>
                      ) : null}
                      {slot.instructionOverride ? (
                        <p className="max-w-48 truncate">{slot.instructionOverride}</p>
                      ) : null}
                      {!slot.enabled ? <p className="font-medium text-ink-400">disabled</p> : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <ConfirmationDialog
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        title="Pause this medication?"
        description={`Doses for ${med.name} will stop appearing in your schedule until you resume.`}
        confirmLabel="Pause"
        tone="primary"
        onConfirm={() => {
          setPauseOpen(false);
          setStatus.mutate(
            { id: med.id, status: "paused" },
            {
              onSuccess: () => {
                void utils.medication.list.invalidate();
                void utils.schedule.day.invalidate();
                void utils.schedule.get.invalidate();
                toast.success(`${med.name} paused`);
              },
              onError: () => toast.error(`Couldn’t pause ${med.name}.`),
            },
          );
        }}
      />

      <ConfirmationDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive this medication?"
        description={`${med.name} moves to your archived list and no longer appears in the active schedule.`}
        confirmLabel="Archive"
        tone="destructive"
        onConfirm={() => {
          setArchiveOpen(false);
          archive.mutate(
            { id: med.id },
            {
              onSuccess: () => {
                void utils.medication.list.invalidate();
                void utils.schedule.day.invalidate();
                void utils.schedule.get.invalidate();
                toast.success(`${med.name} archived`);
              },
              onError: () => toast.error(`Couldn’t archive ${med.name}.`),
            },
          );
        }}
      />
    </main>
  );
}