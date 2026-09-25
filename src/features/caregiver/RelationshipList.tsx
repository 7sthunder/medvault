"use client";

import { useState } from "react";
import { HeartHandshake, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { CaregiverRelationshipDTO } from "@/shared/types";

import { PermissionsEditor } from "./PermissionsEditor";
import { RELATION_LABEL, relationshipTone, STATUS_LABEL } from "./caregiver-utils";

/**
 * §11.12 relationship list (patient view) — each caregiver row shows avatar, relation,
 * status, permission chips, an inline permission editor, and revoke. Revoke stops all future
 * alerts (confirmed); the row stays visible as history with status `revoked`.
 */
export function RelationshipList({ relationships }: { relationships: CaregiverRelationshipDTO[] }) {
  const utils = api.useUtils();
  const updatePermissions = api.caregiver.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissions updated");
      void utils.caregiver.overview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const revoke = api.caregiver.revoke.useMutation({
    onSuccess: () => {
      toast.success("Caregiver revoked");
      void utils.caregiver.overview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (relationships.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-muted-foreground">
        No caregivers connected yet. Invite someone to keep you on track.
      </p>
    );
  }

  const revoking = relationships.find((r) => r.id === revokingId) ?? null;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-card-sm">
      {relationships.map((rel) => {
        const editing = editingId === rel.id;
        const active = rel.status === "active";
        return (
          <div key={rel.id} className="flex flex-col gap-2 p-2">
            <ListRow
              icon={HeartHandshake}
              iconClass={active ? "bg-primary-tint text-primary-dark" : "bg-bg-soft text-ink-500"}
              title={rel.caregiverName}
              subtitle={
                STATUS_LABEL[rel.status] === "Revoked"
                  ? "Revoked"
                  : RELATION_LABEL[rel.relationType]
              }
              right={
                <>
                  <Chip tone={relationshipTone(rel.status)}>{STATUS_LABEL[rel.status]}</Chip>
                  {active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(editing ? null : rel.id)}
                      aria-expanded={editing}
                    >
                      {editing ? "Close" : "Permissions"}
                    </Button>
                  )}
                </>
              }
            />
            {editing && (
              <div className="flex flex-col gap-3 rounded-lg bg-bg-soft p-3">
                <PermissionsEditor
                  permissions={rel.permissions}
                  disabled={updatePermissions.isPending}
                  onChange={(next) =>
                    updatePermissions.mutate({ relationshipId: rel.id, permissions: next })
                  }
                />
                <div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={revoke.isPending}
                    onClick={() => setRevokingId(rel.id)}
                  >
                    <UserX data-icon="inline-start" aria-hidden="true" />
                    Revoke
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <ConfirmationDialog
        open={revokingId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokingId(null);
        }}
        title="Revoke caregiver?"
        description={
          revoking
            ? `${revoking.caregiverName} will lose access to your data and stop receiving alerts. The relationship stays in your history as revoked.`
            : undefined
        }
        confirmLabel="Revoke"
        cancelLabel="Keep access"
        tone="destructive"
        confirmDisabled={revoke.isPending}
        onConfirm={() => {
          if (revokingId) {
            revoke.mutate({ relationshipId: revokingId });
            setRevokingId(null);
          }
        }}
      />
    </div>
  );
}

export function RelationshipListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-card-sm">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}
