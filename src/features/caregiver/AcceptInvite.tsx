"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/trpc";

const RELATION_TYPE_LABELS: Record<string, string> = {
  family: "Family Member",
  friend: "Friend / Neighbor",
  professional: "Doctor / Clinician / Nurse",
  other: "Caregiver",
};

export function AcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const invitationQuery = api.caregiver.getInvitation.useQuery(
    { token: token ?? "" },
    { enabled: Boolean(token) },
  );

  const acceptMutation = api.caregiver.acceptInvitation.useMutation({
    onSuccess: (rel) => {
      toast.success(`You are now actively caring for ${rel.patientName}!`);
      router.push("/caregiver");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to accept caregiver invitation.");
    },
  });

  if (!token) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <ErrorState
          icon={AlertTriangle}
          title="Missing Invitation Link"
          description="The invitation token is missing or malformed. Please click the full link sent by the patient."
          action={
            <Button variant="outline" size="sm" onClick={() => router.push("/caregiver")}>
              Go to Caregiver Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  if (invitationQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invitationQuery.isError || !invitationQuery.data) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <ErrorState
          icon={AlertTriangle}
          title="Invitation Unavailable"
          description={
            invitationQuery.error?.message ||
            "This invitation link is invalid, expired, or has already been accepted."
          }
          action={
            <Button variant="outline" size="sm" onClick={() => router.push("/caregiver")}>
              Go to Caregiver Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const inv = invitationQuery.data;

  return (
    <div className="max-w-lg mx-auto pt-4 space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-tint text-primary-dark dark:text-primary">
            <HeartHandshake className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-bold text-ink-900 dark:text-ink-100 sm:text-2xl">
            Caregiver Invitation
          </h1>
          <p className="text-sm text-muted-foreground">
            You have been invited to monitor patient adherence on MedVault.
          </p>
        </div>

        {/* Inviter Info Card */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Invited by
            </span>
            <Badge variant="secondary" className="capitalize text-xs font-semibold">
              {RELATION_TYPE_LABELS[inv.relationType] || inv.relationType}
            </Badge>
          </div>

          <div>
            <p className="font-heading text-base font-bold text-ink-900 dark:text-ink-100">
              {inv.patientName}
            </p>
            <p className="text-xs text-muted-foreground">{inv.patientEmail}</p>
          </div>

          {inv.message && (
            <div className="border-t border-border/60 pt-2.5">
              <p className="text-xs font-medium text-ink-900 dark:text-ink-100 italic">
                &ldquo;{inv.message}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Permissions list */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Access Granted
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
              <CheckCircle2
                className={`size-4 ${
                  inv.permissions.viewAdherence
                    ? "text-primary"
                    : "text-muted-foreground/40"
                }`}
              />
              <span>View Adherence compliance and streak scores</span>
            </div>

            <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
              <CheckCircle2
                className={`size-4 ${
                  inv.permissions.viewMedications
                    ? "text-primary"
                    : "text-muted-foreground/40"
                }`}
              />
              <span>View Medication names, dosages, and schedules</span>
            </div>

            <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
              <CheckCircle2
                className={`size-4 ${
                  inv.permissions.receiveMissedDoseAlerts
                    ? "text-primary"
                    : "text-muted-foreground/40"
                }`}
              />
              <span>Receive urgent missed dose alerts</span>
            </div>

            <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
              <CheckCircle2
                className={`size-4 ${
                  inv.permissions.canAcknowledgeAlerts
                    ? "text-primary"
                    : "text-muted-foreground/40"
                }`}
              />
              <span>Acknowledge and mark alerts as resolved</span>
            </div>
          </div>
        </div>

        {/* Accept / Decline CTA */}
        <div className="space-y-2 pt-2">
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => acceptMutation.mutate({ token })}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserCheck className="size-4" />
            )}
            <span>Accept Invitation</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={() => router.push("/caregiver")}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
