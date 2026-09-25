"use client";

import { useState } from "react";
import { KeyRound, Loader2, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { api } from "@/lib/trpc";
import type { RelationType } from "@/shared/enums";

export interface LinkPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (patientUserId: string) => void;
}

export function LinkPatientDialog({
  open,
  onOpenChange,
  onSuccess,
}: LinkPatientDialogProps) {
  const [accessCode, setAccessCode] = useState("");
  const [relationType, setRelationType] = useState<RelationType>("family");

  const utils = api.useUtils();

  const connectMutation = api.caregiver.connectWithCode.useMutation({
    onSuccess: (rel) => {
      toast.success(`Successfully connected to ${rel.patientName}!`);
      utils.caregiver.listPatients.invalidate();
      onOpenChange(false);
      setAccessCode("");
      onSuccess?.(rel.patientUserId);
    },
    onError: (err) => {
      toast.error(err.message || "Could not link patient. Please check the access code.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter the patient's access code.");
      return;
    }

    connectMutation.mutate({
      accessCode: cleanCode.startsWith("MV-") ? cleanCode : `MV-${cleanCode}`,
      relationType,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <KeyRound className="size-4" />
          </div>
          <span>Link Patient with Access Code</span>
        </div>
      }
      description="Enter the patient's unique access code found on their Profile page to instantly start monitoring their medication schedule and doctor appointments."
      footer={
        <div className="flex w-full items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={connectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={connectMutation.isPending}
            className="gap-2"
          >
            {connectMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Link Patient
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Patient Access Code"
          hint="The patient can view their access code under Settings → Profile."
          required
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. MV-8K2N9P"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="pl-9 font-mono font-bold tracking-wider uppercase text-base"
              maxLength={12}
              required
            />
            <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          </div>
        </FormField>

        <FormField label="Your Relationship to Patient">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                { id: "family", label: "Family" },
                { id: "professional", label: "Caregiver" },
                { id: "friend", label: "Friend" },
                { id: "other", label: "Other" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRelationType(opt.id)}
                className={`flex items-center justify-center rounded-xl p-2.5 text-xs font-semibold transition-all ${
                  relationType === opt.id
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormField>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <span>
            Instant connection: You will be granted immediate access to view their adherence, manage medication schedules, and log doctor visits.
          </span>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
