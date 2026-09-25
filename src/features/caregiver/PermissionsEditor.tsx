"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc";
import type { CaregiverPermissions } from "@/shared/types";

interface PermissionsEditorProps {
  relationshipId: string;
  caregiverName: string;
  initialPermissions: CaregiverPermissions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function PermissionsEditor({
  relationshipId,
  caregiverName,
  initialPermissions,
  open,
  onOpenChange,
  onSaved,
}: PermissionsEditorProps) {
  const [permissions, setPermissions] = useState<CaregiverPermissions>(initialPermissions);

  const utils = api.useUtils();
  const updateMutation = api.caregiver.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success(`Updated permissions for ${caregiverName}.`);
      utils.caregiver.listCaregivers.invalidate();
      onSaved?.();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update caregiver permissions.");
    },
  });

  const toggle = (key: keyof CaregiverPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      relationshipId,
      permissions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <DialogTitle>Caregiver Permissions</DialogTitle>
          </div>
          <DialogDescription>
            Configure what medical data and notifications <strong className="text-ink-900 dark:text-ink-100">{caregiverName}</strong> can access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <label className="flex items-start gap-3 rounded-xl border border-border/80 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <Checkbox
              checked={permissions.viewAdherence}
              onCheckedChange={() => toggle("viewAdherence")}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                View Adherence Reports
              </p>
              <p className="text-xs text-muted-foreground">
                Allows viewing daily compliance percentage, streaks, and adherence summaries.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-border/80 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <Checkbox
              checked={permissions.viewMedications}
              onCheckedChange={() => toggle("viewMedications")}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                View Medication Details
              </p>
              <p className="text-xs text-muted-foreground">
                Reveals medication names, instructions, and dosages. If disabled, doses are anonymized.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-border/80 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <Checkbox
              checked={permissions.receiveMissedDoseAlerts}
              onCheckedChange={() => toggle("receiveMissedDoseAlerts")}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                Missed Dose Alerts
              </p>
              <p className="text-xs text-muted-foreground">
                Sends an urgent alert whenever a scheduled dose passes its grace period without intake.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-border/80 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <Checkbox
              checked={permissions.receiveInsights}
              onCheckedChange={() => toggle("receiveInsights")}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                Receive AI Insights
              </p>
              <p className="text-xs text-muted-foreground">
                Shares adherence behavioral patterns and AI-generated coaching recommendations.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-border/80 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <Checkbox
              checked={permissions.canAcknowledgeAlerts}
              onCheckedChange={() => toggle("canAcknowledgeAlerts")}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                Acknowledge & Resolve Alerts
              </p>
              <p className="text-xs text-muted-foreground">
                Grants the caregiver authority to mark alerts as acknowledged and resolved.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
