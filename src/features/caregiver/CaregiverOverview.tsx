"use client";

import { useState } from "react";
import { BellRing, HeartHandshake, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { ChipTone } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { CaregiverInvitationDTO, CaregiverPatientDTO } from "@/shared/types";

import { AlertFeed } from "./AlertFeed";
import { InviteForm } from "./InviteForm";
import { PatientOverviewCard } from "./PatientOverviewCard";
import { RelationshipList } from "./RelationshipList";
import { INVITATION_STATUS_LABEL, RELATION_LABEL } from "./caregiver-utils";

export function CaregiverOverview() {
  const { user } = useShell();
  const router = useRouter();
  const utils = api.useUtils();
  const overview = api.caregiver.overview.useQuery(undefined, { staleTime: 15_000 });
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const revokeInvitation = api.caregiver.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      setRevokingId(null);
      void utils.caregiver.overview.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
      setRevokingId(null);
    },
  });

  if (overview.isLoading) return <CaregiverOverviewSkeleton />;

  if (overview.isError || !overview.data) {
    return (
      <main className="mx-auto max-w-5xl">
        <h1 className="font-heading text-2xl font-extrabold text-ink-900">Caregiver</h1>
        <ErrorState
          className="mt-8"
          title="Couldn't load caregiver information"
          description="Your connections and invitations could not be loaded right now."
          action={
            <Button variant="outline" onClick={() => void overview.refetch()}>
              Try again
            </Button>
          }
        />
      </main>
    );
  }

  const data = overview.data;
  const hasCaregivingConnections = data.asCaregiver.length > 0;

  return (
    <main className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel
            tone="violet"
            leading={<HeartHandshake className="size-3.5" aria-hidden="true" />}
          >
            Care circle
          </SectionLabel>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-ink-900">Caregiver</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Invite someone you trust, choose what they can see, and keep an eye on the moments that
            need attention.
          </p>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        <section aria-labelledby="caregiver-connections-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionLabel
                tone="emerald"
                leading={<Users className="size-3.5" aria-hidden="true" />}
              >
                Your care circle
              </SectionLabel>
              <h2
                id="caregiver-connections-heading"
                className="mt-1 text-lg font-semibold text-ink-900"
              >
                People supporting you
              </h2>
            </div>
          </div>
          <div className="mt-3 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Card className="shadow-card-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-900">
                  <UserPlus className="size-4.5 text-primary" aria-hidden="true" />
                  Invite a caregiver
                </CardTitle>
                <CardDescription>
                  Set the access they need before you send the invitation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InviteForm />
              </CardContent>
            </Card>
            <section aria-labelledby="caregiver-relationships-heading">
              <SectionLabel tone="blue">Connections</SectionLabel>
              <h3
                id="caregiver-relationships-heading"
                className="mt-1 text-sm font-semibold text-ink-900"
              >
                Your caregivers
              </h3>
              <div className="mt-3">
                <RelationshipList relationships={data.asPatient} />
              </div>
            </section>
          </div>
        </section>

        <section aria-labelledby="caregiver-invitations-heading">
          <div>
            <SectionLabel tone="magenta" leading={<Mail className="size-3.5" aria-hidden="true" />}>
              Invitations
            </SectionLabel>
            <h2
              id="caregiver-invitations-heading"
              className="mt-1 text-lg font-semibold text-ink-900"
            >
              Sent invitations
            </h2>
          </div>
          <div className="mt-3">
            <InvitationList
              invitations={data.invitations}
              timeZone={user.timezone}
              revokingId={revokingId}
              onRevoke={(id) => {
                setRevokingId(id);
                revokeInvitation.mutate({ invitationId: id });
              }}
              revoking={revokeInvitation.isPending}
            />
          </div>
        </section>

        <section aria-labelledby="caregiver-alerts-heading">
          <div>
            <SectionLabel
              tone="magenta"
              leading={<BellRing className="size-3.5" aria-hidden="true" />}
            >
              Alerts
            </SectionLabel>
            <h2 id="caregiver-alerts-heading" className="mt-1 text-lg font-semibold text-ink-900">
              Alerts sent to your caregivers
            </h2>
          </div>
          <Card className="mt-3 shadow-card-sm">
            <CardContent className="p-2">
              <AlertFeed
                items={data.sentAlerts}
                timeZone={user.timezone}
                onOpen={(alert) => router.push(`/caregiver/alerts/${alert.id}`)}
                emptyTitle="No alerts sent"
                emptyDescription="When a caregiver alert is created, its status will appear here."
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="caregiver-patients-heading">
          <div>
            <SectionLabel
              tone="cyan"
              leading={<ShieldCheck className="size-3.5" aria-hidden="true" />}
            >
              Caregiving
            </SectionLabel>
            <h2 id="caregiver-patients-heading" className="mt-1 text-lg font-semibold text-ink-900">
              Patients you care for
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your view is read-only and limited to each patient&apos;s granted permissions.
            </p>
          </div>
          {hasCaregivingConnections ? (
            <div className="mt-3 grid gap-6 xl:grid-cols-2">
              {data.asCaregiver.map((patient) =>
                patient.permissions.viewAdherence ? (
                  <PatientOverviewCard
                    key={patient.relationshipId}
                    relationshipId={patient.relationshipId}
                    patientUserId={patient.patientUserId}
                    patientName={patient.patientName}
                    relationType={patient.relationType}
                  />
                ) : (
                  <RestrictedPatientCard key={patient.relationshipId} patient={patient} />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              className="mt-3"
              icon={HeartHandshake}
              title="No patients connected yet"
              description="When someone invites you to care for them, their read-only overview will appear here."
            />
          )}
        </section>
      </div>
    </main>
  );
}

function InvitationList({
  invitations,
  timeZone,
  revokingId,
  onRevoke,
  revoking,
}: {
  invitations: CaregiverInvitationDTO[];
  timeZone: string;
  revokingId: string | null;
  onRevoke: (id: string) => void;
  revoking: boolean;
}) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        compact
        icon={Mail}
        title="No invitations sent"
        description="Invite a family member, friend, or care provider when you're ready to share your routine."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {invitations.map((invitation) => {
        const pending = invitation.status === "pending";
        const revokingThis = revokingId === invitation.id;
        return (
          <li
            key={invitation.id}
            className="rounded-xl border border-border bg-card shadow-card-sm"
          >
            <ListRow
              icon={Mail}
              title={invitation.email}
              subtitle={`Invited ${formatDateTime(invitation.createdAt, timeZone)} · Expires ${formatDateTime(invitation.expiresAt, timeZone)}`}
              right={
                <>
                  <Chip tone={invitationTone(invitation.status)}>
                    {INVITATION_STATUS_LABEL[invitation.status]}
                  </Chip>
                  {pending && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revoking}
                      onClick={() => onRevoke(invitation.id)}
                    >
                      {revokingThis && revoking ? "Revoking…" : "Revoke"}
                    </Button>
                  )}
                </>
              }
            />
            {invitation.message && (
              <p className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
                “{invitation.message}”
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function RestrictedPatientCard({ patient }: { patient: CaregiverPatientDTO }) {
  return (
    <Card className="shadow-card-sm">
      <CardHeader>
        <CardTitle>{patient.patientName}</CardTitle>
        <CardDescription>Relation: {RELATION_LABEL[patient.relationType]}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          compact
          icon={ShieldCheck}
          title="Adherence access is off"
          description="Ask this patient to enable View adherence before opening their overview."
        />
      </CardContent>
    </Card>
  );
}

function invitationTone(status: CaregiverInvitationDTO["status"]): ChipTone {
  if (status === "accepted") return "emerald";
  if (status === "pending") return "amber";
  return "slate";
}

function formatDateTime(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function CaregiverOverviewSkeleton() {
  return (
    <main className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-36 rounded-md" />
      <Skeleton className="mt-2 h-5 w-80 max-w-full rounded-md" />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </main>
  );
}
