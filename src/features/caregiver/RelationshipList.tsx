"use client";

import { useState } from "react";
import {
  Clock,
  Copy,
  Mail,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/trpc";
import type { CaregiverPermissions } from "@/shared/types";
import { PermissionsEditor } from "./PermissionsEditor";

interface RelationshipListProps {
  onInviteClick?: () => void;
}

export function RelationshipList({ onInviteClick }: RelationshipListProps) {
  const [editingPermissions, setEditingPermissions] = useState<{
    relationshipId: string;
    caregiverName: string;
    permissions: CaregiverPermissions;
  } | null>(null);

  const [revokingTarget, setRevokingTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = api.useUtils();

  const caregiversQuery = api.caregiver.listCaregivers.useQuery();
  const invitationsQuery = api.caregiver.listInvitations.useQuery();

  const revokeMutation = api.caregiver.revokeCaregiver.useMutation({
    onSuccess: () => {
      toast.success("Caregiver access revoked.");
      utils.caregiver.listCaregivers.invalidate();
      setRevokingTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to revoke caregiver access.");
    },
  });

  const revokeInviteMutation = api.caregiver.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled.");
      utils.caregiver.listInvitations.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel invitation.");
    },
  });

  const caregivers = caregiversQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  const copyInviteLink = (token: string) => {
    const fullUrl = `${window.location.origin}/caregiver/accept?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Redemption link copied to clipboard.");
  };

  const hasAny = caregivers.length > 0 || pendingInvitations.length > 0;

  if (!hasAny && !caregiversQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <EmptyState
          icon={Users}
          title="No Caregivers Connected"
          description="Grant family members or trusted clinicians view-only access to your adherence data."
          action={
            onInviteClick && (
              <Button onClick={onInviteClick} size="sm" className="mt-2">
                Invite Caregiver
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Active & Connected Caregivers */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary-dark dark:text-primary">
              <UserCheck className="size-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Connected Caregivers ({caregivers.filter((c) => c.status === "active").length})
              </h3>
              <p className="text-xs text-muted-foreground">
                People authorized to monitor your medications and receive alerts
              </p>
            </div>
          </div>
        </div>

        {caregivers.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground italic">
            No active caregivers currently connected.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {caregivers.map((c) => {
              const isActive = c.status === "active";
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary-tint text-secondary font-bold text-sm">
                      {c.caregiverName ? c.caregiverName[0]?.toUpperCase() : "C"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                          {c.caregiverName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="capitalize text-[10px] font-medium"
                        >
                          {c.relationType}
                        </Badge>
                        <Badge
                          variant={isActive ? "default" : "outline"}
                          className="text-[10px] capitalize"
                        >
                          {c.status}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {c.permissions.viewAdherence && <span>• Adherence</span>}
                        {c.permissions.viewMedications && <span>• Medications</span>}
                        {c.permissions.receiveMissedDoseAlerts && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            • Alerts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditingPermissions({
                            relationshipId: c.id,
                            caregiverName: c.caregiverName,
                            permissions: c.permissions,
                          })
                        }
                        className="gap-1.5 text-xs h-8"
                      >
                        <Shield className="size-3.5" />
                        <span>Permissions</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRevokingTarget({
                            id: c.id,
                            name: c.caregiverName,
                          })
                        }
                        className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Invitations waiting to be redeemed by recipient
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {inv.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(inv.token)}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Copy className="size-3.5" />
                    <span>Copy Link</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeInviteMutation.mutate({ invitationId: inv.id })}
                    disabled={revokeInviteMutation.isPending}
                    className="text-xs h-8 text-muted-foreground hover:text-rose-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {editingPermissions && (
        <PermissionsEditor
          open={Boolean(editingPermissions)}
          onOpenChange={(open) => {
            if (!open) setEditingPermissions(null);
          }}
          relationshipId={editingPermissions.relationshipId}
          caregiverName={editingPermissions.caregiverName}
          initialPermissions={editingPermissions.permissions}
        />
      )}

      {/* Revocation Confirmation Dialog */}
      {revokingTarget && (
        <ConfirmationDialog
          open={Boolean(revokingTarget)}
          onOpenChange={(open) => {
            if (!open) setRevokingTarget(null);
          }}
          title="Revoke Caregiver Access"
          description={`Are you sure you want to revoke access for ${revokingTarget.name}? They will immediately lose access to your adherence logs and will no longer receive missed dose alerts.`}
          confirmLabel="Revoke Access"
          tone="destructive"
          onConfirm={() => {
            revokeMutation.mutate({ relationshipId: revokingTarget.id });
          }}
        />
      )}
    </div>
  );
}
