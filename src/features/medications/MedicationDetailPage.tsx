"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Pause,
  Pill,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateKey, formatHhmm } from "@/lib/format";
import { api } from "@/lib/trpc";
import { FREQUENCY_LABEL_TEXT } from "@/shared/enums";
import { ArchiveDialog } from "./ArchiveDialog";

export interface MedicationDetailPageProps {
  id: string;
}

export function MedicationDetailPage({ id }: MedicationDetailPageProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [archiveOpen, setArchiveOpen] = useState(false);

  const {
    data: medication,
    isLoading: isMedLoading,
    error: medError,
  } = api.medication.get.useQuery({ id });

  const { data: recentDoses, isLoading: isDosesLoading } =
    api.dose.listByMedication.useQuery({ medicationId: id, limit: 10 });

  const setStatusMutation = api.medication.setStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "active" ? "Medication resumed." : "Medication paused.",
      );
      void utils.medication.get.invalidate({ id });
      void utils.medication.list.invalidate();
      void utils.dose.today.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status.");
    },
  });

  const archiveMutation = api.medication.archive.useMutation({
    onSuccess: () => {
      toast.success("Medication archived.");
      void utils.medication.list.invalidate();
      void utils.dose.today.invalidate();
      router.push("/medications");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to archive medication.");
    },
  });

  if (isMedLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (medError || !medication) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" render={<Link href="/medications" />}>
          <ArrowLeft className="size-4 mr-1" />
          Back to Medications
        </Button>
        <div className="rounded-2xl border border-red/20 bg-red-tint/20 p-8 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-tint text-red">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">
            Medication Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            This medication may have been deleted or belongs to another user account.
          </p>
        </div>
      </div>
    );
  }

  const isArchived = Boolean(medication.archivedAt);
  const isPaused = medication.status === "paused" && !isArchived;
  const isActive = medication.status === "active" && !isArchived;

  const frequencyText =
    FREQUENCY_LABEL_TEXT[medication.frequencyLabel] ?? medication.frequencyLabel;

  const handleToggleStatus = () => {
    const nextStatus = isActive ? "paused" : "active";
    setStatusMutation.mutate({ id: medication.id, status: nextStatus });
  };

  const handleConfirmArchive = () => {
    archiveMutation.mutate({ id: medication.id });
  };

  const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/medications" />}>
          <ArrowLeft className="size-4 mr-1" />
          Medications
        </Button>
      </div>

      {/* Archived Notice Banner */}
      {isArchived && (
        <div className="rounded-xl border border-border bg-muted/60 p-4 text-xs text-muted-foreground flex items-center gap-2.5">
          <Archive className="size-4 text-muted-foreground shrink-0" />
          <span>
            This medication is archived. Daily reminders are stopped, but all historical dose
            records remain preserved in your history and reports.
          </span>
        </div>
      )}

      {/* Paused Notice Banner */}
      {isPaused && (
        <div className="rounded-xl border border-amber/30 bg-amber-tint/40 p-4 text-xs text-amber flex items-center gap-2.5">
          <Pause className="size-4 text-amber shrink-0" />
          <span>
            This medication schedule is paused. Daily dose reminders and scheduled events are on hold.
          </span>
        </div>
      )}

      {/* Main Header Card */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="size-5 rounded-full shrink-0 mt-1.5"
              style={{ backgroundColor: medication.color || "var(--primary)" }}
              aria-hidden="true"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
                  {medication.name}
                </h1>
                {isArchived ? (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
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
              <p className="text-sm font-mono text-muted-foreground">
                {medication.dosageAmount} {medication.dosageUnit}
              </p>
              {medication.instructions && (
                <p className="text-sm italic text-ink-700 dark:text-ink-300 pt-1">
                  &ldquo;{medication.instructions}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:self-start">
            {!isArchived && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={setStatusMutation.isPending}
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleToggleStatus}
                >
                  {isActive ? (
                    <>
                      <Pause className="size-3 text-amber" />
                      <span>Pause Schedule</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-3 text-primary" />
                      <span>Resume</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  render={<Link href={`/medications/${medication.id}/edit`} />}
                >
                  <Edit2 className="size-3" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-red"
                  onClick={() => setArchiveOpen(true)}
                  title="Archive medication"
                >
                  <Archive className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Schedule & Times */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Clock className="size-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100">
              Schedule Slots
            </h2>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Frequency: <span className="font-semibold text-ink-800 dark:text-ink-200">{frequencyText}</span>
            </p>
            <div className="space-y-2 pt-1">
              {medication.slots.map((slot, i) => (
                <div
                  key={slot.id ?? i}
                  className="flex items-center justify-between rounded-lg border border-border bg-card-tint px-3 py-2 text-xs"
                >
                  <span className="font-mono font-medium text-ink-800 dark:text-ink-200">
                    {formatHhmm(slot.timeOfDay)}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {slot.daysOfWeek.length === 7
                      ? "Every day"
                      : slot.daysOfWeek.map((d) => WEEKDAY_NAMES[d]).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Prescription & Dates */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Calendar className="size-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100">
              Prescription Details
            </h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-medium text-ink-800 dark:text-ink-200">
                {formatDateKey(medication.startDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-medium text-ink-800 dark:text-ink-200">
                {medication.endDate ? formatDateKey(medication.endDate) : "Ongoing / Chronic"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dose Reminders:</span>
              <span className="font-medium text-ink-800 dark:text-ink-200">
                {medication.remindersEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            {medication.notes && (
              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-muted-foreground">Notes:</span>
                <p className="text-ink-700 dark:text-ink-300 italic">{medication.notes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Dose History Preview */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100">
              Recent Dose Activity
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Last 10 scheduled doses</span>
        </div>

        {isDosesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : !recentDoses || recentDoses.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
            <Pill className="size-5 mx-auto text-muted-foreground/60" />
            <p>No dose activity recorded yet for this medication.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDoses.map((dose) => {
              const scheduledDate = new Date(dose.scheduledFor);
              const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
              const formattedDate = scheduledDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={dose.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900 dark:text-ink-100">
                      {formattedDate} at {formattedTime}
                    </span>
                    {dose.skippedReason && (
                      <span className="text-muted-foreground">({dose.skippedReason})</span>
                    )}
                  </div>
                  <div>
                    <StatusBadge
                      status={
                        dose.status === "due"
                          ? "due-now"
                          : dose.status === "canceled"
                            ? "canceled"
                            : dose.status
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Archive Confirmation Dialog */}
      <ArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        medicationName={medication.name}
        isArchiving={archiveMutation.isPending}
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
