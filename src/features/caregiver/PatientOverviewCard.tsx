"use client";

import { useRouter } from "next/navigation";
import { HeartHandshake, Pill } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AlertFeed } from "./AlertFeed";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/trpc";
import { formatPercent } from "@/lib/format";
import { RELATION_LABEL } from "./caregiver-utils";

/**
 * §11.12 caregiver mode — read-only overview of ONE patient the caller actively cares for.
 * Adherence today / 7d / 30d, streak, medication list (only when `viewMedications`), alert
 * feed and a leave action. Never exposes another patient: `patientUserId` is always the
 * relationship target and the server re-checks `requireCaregiverAccess`.
 */
export function PatientOverviewCard({ relationshipId, patientUserId, patientName, relationType }: {
  relationshipId: string;
  patientUserId: string;
  patientName: string;
  relationType: string;
}) {
  const router = useRouter();
  const { user } = useShell();
  const utils = api.useUtils();
  const [leaving, setLeaving] = useState(false);

  const overview = api.caregiver.patientOverview.useQuery(
    { patientUserId },
    { staleTime: 30_000 },
  );
  const leave = api.caregiver.leave.useMutation({
    onSuccess: () => {
      toast.success(`You're no longer caring for ${patientName}.`);
      void utils.caregiver.overview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const leaveButton = (
    <Button
      size="sm"
      variant="destructive"
      onClick={() => setLeaving(true)}
    >
      Leave
    </Button>
  );

  return (
    <Card className="shadow-card-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{patientName}</CardTitle>
          <p className="text-xs text-muted-foreground">Relation: {RELATION_LABEL[relationType as keyof typeof RELATION_LABEL] ?? relationType}</p>
        </div>
        {leaveButton}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {overview.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : overview.isError || !overview.data ? (
          <ErrorState
            compact
            title="Couldn't load this patient"
            action={
              <Button variant="outline" size="sm" onClick={() => void overview.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                title="Today"
                value={`${overview.data.today.taken}/${overview.data.today.scheduled}`}
                icon={Pill}
                tone="emerald"
                subtitle={`${overview.data.today.missed} missed`}
              />
              <StatCard
                title="7-day"
                value={formatPercent(overview.data.summary7.adherencePercent ?? 0)}
                icon={HeartHandshake}
                tone="blue"
                subtitle={`${overview.data.summary7.taken} of ${overview.data.summary7.scheduled} doses`}
              />
              <StatCard
                title="30-day · streak"
                value={`${overview.data.summary30.streak.current}d`}
                icon={HeartHandshake}
                tone="cyan"
                subtitle={`${formatPercent(overview.data.summary30.adherencePercent ?? 0)} adherence`}
              />
            </div>

            {overview.data.medications.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-ink-900">Medications</h3>
                <div className="flex flex-col rounded-lg bg-bg-soft p-2">
                  {overview.data.medications.map((med) => (
                    <p key={med.id} className="px-2 py-1 text-sm text-ink-800">
                      {med.name} — {med.dosageAmount} {med.dosageUnit}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {overview.data.medications.length === 0 && (
              <p className="text-xs text-muted-foreground">Medication access isn&apos;t enabled or there are no active medications.</p>
            )}

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink-900">Alerts</h3>
              <AlertFeed
                items={overview.data.alerts}
                timeZone={user.timezone}
                onOpen={(alert) => router.push(`/caregiver/alerts/${alert.id}`)}
              />
            </div>
          </>
        )}
      </CardContent>

      <ConfirmationDialog
        open={leaving}
        onOpenChange={setLeaving}
        title="Stop caring for this patient?"
        description={`You'll lose access to ${patientName}'s data and stop receiving alerts. You can be invited again anytime.`}
        confirmLabel="Leave"
        cancelLabel="Stay"
        tone="destructive"
        confirmDisabled={leave.isPending}
        onConfirm={() => {
          leave.mutate({ relationshipId });
          setLeaving(false);
        }}
      />
    </Card>
  );
}