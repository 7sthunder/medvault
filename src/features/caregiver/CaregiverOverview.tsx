"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  KeyRound,
  Loader2,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { AppointmentDialog } from "@/features/appointments/AppointmentDialog";
import { AppointmentsWidget } from "@/features/appointments/AppointmentsWidget";
import { api } from "@/lib/trpc";
import type { CaregiverRelationshipDTO } from "@/shared/types";
import { AlertFeed } from "./AlertFeed";
import { LinkPatientDialog } from "./LinkPatientDialog";

interface CaregiverOverviewProps {
  patients: (CaregiverRelationshipDTO & { patientEmail: string })[];
  selectedPatientId: string;
  onSelectPatient: (patientUserId: string) => void;
}

export function CaregiverOverview({
  patients,
  selectedPatientId,
  onSelectPatient,
}: CaregiverOverviewProps) {
  const [leavingTarget, setLeavingTarget] = useState<string | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const utils = api.useUtils();

  const overviewQuery = api.caregiver.patientOverview.useQuery(
    { patientUserId: selectedPatientId },
    { enabled: Boolean(selectedPatientId) },
  );

  const leaveMutation = api.caregiver.leavePatient.useMutation({
    onSuccess: () => {
      toast.success("You have stopped monitoring this patient.");
      utils.caregiver.listPatients.invalidate();
      setLeavingTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to leave relationship.");
    },
  });

  const selectedPatient = patients.find((p) => p.patientUserId === selectedPatientId);

  if (patients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center space-y-4">
        <EmptyState
          icon={Users}
          title="No Monitored Patients"
          description="You are not currently monitoring any patients. Enter a patient's access code to securely link them to your dashboard."
        />
        <Button
          type="button"
          onClick={() => setLinkDialogOpen(true)}
          className="gap-2"
        >
          <KeyRound className="size-4" />
          <span>Link Patient with Access Code</span>
        </Button>

        <LinkPatientDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          onSuccess={(id) => onSelectPatient(id)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Switcher & Header Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary-tint text-secondary font-bold text-base">
            {selectedPatient?.patientName ? selectedPatient.patientName[0]?.toUpperCase() : "P"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-ink-900 dark:text-ink-100">
                {selectedPatient?.patientName}
              </h2>
              <Badge variant="secondary" className="capitalize text-[10px] font-semibold">
                {selectedPatient?.relationType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{selectedPatient?.patientEmail}</p>
          </div>
        </div>

        {/* Patient Switcher Dropdown (if multiple patients) */}
        <div className="flex items-center gap-2.5">
          {patients.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Switch Patient:</span>
              <select
                aria-label="Switch monitored patient"
                value={selectedPatientId}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-ink-900 shadow-card-sm dark:text-ink-100"
              >
                {patients.map((p) => (
                  <option key={p.patientUserId} value={p.patientUserId}>
                    {p.patientName} ({p.relationType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedPatient && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeavingTarget(selectedPatient.id)}
              className="text-xs h-8 text-muted-foreground hover:text-rose-600"
            >
              Stop Monitoring
            </Button>
          )}
        </div>
      </div>

      {/* Caregiver Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground">
            Caregiver Actions for {selectedPatient?.patientName}
          </h3>
          <p className="text-xs text-muted-foreground">
            Schedule upcoming clinic consultations or add new medications to their daily regimen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAppointmentDialogOpen(true)}
            className="gap-1.5 rounded-xl border-primary/30 text-xs font-semibold"
          >
            <Stethoscope className="size-3.5 text-primary" />
            <span>Schedule Doctor Visit</span>
          </Button>

          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/medications/new?patientUserId=${selectedPatientId}&patientName=${encodeURIComponent(
                  selectedPatient?.patientName || "Patient",
                )}`}
              />
            }
            className="gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Pill className="size-3.5" />
            <span>Add Medication</span>
          </Button>
        </div>
      </div>

      {overviewQuery.isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {overviewQuery.isSuccess && overviewQuery.data && (
        <div className="space-y-6">
          {/* 1. Adherence Metrics (if permission granted) */}
          {overviewQuery.data.permissions.viewAdherence && overviewQuery.data.adherenceSummary && (
            <div className="space-y-3">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Adherence Performance
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  title="Compliance Rate"
                  value={
                    overviewQuery.data.adherenceSummary.adherencePercent !== null
                      ? `${overviewQuery.data.adherenceSummary.adherencePercent}%`
                      : "N/A"
                  }
                  icon={Activity}
                  tone="emerald"
                  subtitle={`${overviewQuery.data.adherenceSummary.taken} of ${overviewQuery.data.adherenceSummary.scheduled} doses`}
                />
                <StatCard
                  title="Current Streak"
                  value={`${overviewQuery.data.adherenceSummary.streak.current}d`}
                  icon={Flame}
                  tone="amber"
                  subtitle={`Longest: ${overviewQuery.data.adherenceSummary.streak.longest}d`}
                />
                <StatCard
                  title="Total Taken"
                  value={String(overviewQuery.data.adherenceSummary.taken)}
                  icon={CheckCircle2}
                  tone="emerald"
                  subtitle="Confirmed intake"
                />
                <StatCard
                  title="Total Missed"
                  value={String(overviewQuery.data.adherenceSummary.missed)}
                  icon={AlertTriangle}
                  tone={overviewQuery.data.adherenceSummary.missed > 0 ? "amber" : "emerald"}
                  subtitle={
                    overviewQuery.data.adherenceSummary.missed > 0
                      ? "Attention needed"
                      : "Zero missed doses"
                  }
                />
              </div>
            </div>
          )}

          {/* 2. Doctor Appointments & Schedule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentsWidget
              patientUserId={selectedPatientId}
              patientName={selectedPatient?.patientName}
            />

            {/* Today's Scheduled Intake (if permitted) */}
            {overviewQuery.data.todayDoses.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary-dark dark:text-primary">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-ink-900 dark:text-ink-100">
                      Recent Dose Schedule
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Chronological intake logged for {selectedPatient?.patientName}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-border/60">
                  {overviewQuery.data.todayDoses.map((dose) => (
                    <div
                      key={dose.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="size-3.5 shrink-0 rounded-full"
                          style={{ backgroundColor: dose.medication.color }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-ink-900 dark:text-ink-100">
                            {dose.medication.name}
                            {dose.medication.dosageAmount > 0
                              ? ` (${dose.medication.dosageAmount} ${dose.medication.dosageUnit})`
                              : ""}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Scheduled for {new Date(dose.scheduledFor).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          dose.status === "taken"
                            ? "default"
                            : dose.status === "missed"
                              ? "destructive"
                              : "outline"
                        }
                        className="capitalize text-[10px] font-semibold"
                      >
                        {dose.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card-sm flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Clock className="size-8 text-muted-foreground/60" />
                <h4 className="text-xs font-semibold text-foreground">No recent doses logged</h4>
                <p className="text-[11px] text-muted-foreground">
                  Dose events will appear here when recorded.
                </p>
              </div>
            )}
          </div>

          {/* 3. Patient Alerts Feed */}
          <AlertFeed patientUserId={selectedPatientId} />
        </div>
      )}

      {/* Confirmation to stop monitoring */}
      {leavingTarget && (
        <ConfirmationDialog
          open={Boolean(leavingTarget)}
          onOpenChange={(open) => {
            if (!open) setLeavingTarget(null);
          }}
          title="Stop Monitoring Patient"
          description={`Are you sure you want to stop monitoring ${selectedPatient?.patientName}? You will no longer receive alerts or view their adherence.`}
          confirmLabel="Stop Monitoring"
          tone="destructive"
          onConfirm={() => {
            leaveMutation.mutate({ relationshipId: leavingTarget });
          }}
        />
      )}

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        patientUserId={selectedPatientId}
        patientName={selectedPatient?.patientName}
      />

      {/* Link Patient Dialog */}
      <LinkPatientDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSuccess={(id) => onSelectPatient(id)}
      />
    </div>
  );
}
