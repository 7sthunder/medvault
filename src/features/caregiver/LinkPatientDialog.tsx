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

  const authQuery = api.auth?.me?.useQuery ? api.auth.me.useQuery() : undefined;
  const currentUser = authQuery?.data;
  const utils = api.useUtils();

  const userAccessCode = (currentUser as { accessCode?: string | null } | null | undefined)?.accessCode;
  const isSelfCode = Boolean(
    userAccessCode &&
      accessCode.trim().toUpperCase().replace(/^MV-/, "") ===
        String(userAccessCode).trim().toUpperCase().replace(/^MV-/, ""),
  );

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

  const handleConnectWith = (code: string, relation: RelationType = "family") => {
    setAccessCode(code);
    setRelationType(relation);
    connectMutation.mutate({
      accessCode: code,
      relationType: relation,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter the patient's access code.");
      return;
    }

    if (isSelfCode) {
      toast.error("You cannot use your own access code to monitor yourself.");
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
            disabled={connectMutation.isPending || isSelfCode}
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
        {/* Quick-Connect Demo Patients */}
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-teal-500" />
              1-Click Connect Demo Patient
            </span>
            <span className="text-[10px] text-muted-foreground">Ready to test</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Alice Hartono", code: "MV-CE8XKS", desc: "4 Active Meds" },
              { name: "Bob Mensah", code: "MV-RPUJ6B", desc: "Hypertension Care" },
            ].map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => handleConnectWith(p.code, "family")}
                disabled={connectMutation.isPending}
                className="flex flex-col items-start p-2 rounded-lg border border-teal-500/30 bg-card hover:bg-teal-500/10 text-left transition-all hover:scale-[1.02]"
              >
                <span className="text-xs font-bold text-ink-900 dark:text-ink-100">{p.name}</span>
                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">{p.code}</span>
              </button>
            ))}
          </div>
        </div>

        <FormField
          label="Patient Access Code"
          hint="The patient can view their access code under Settings → Profile."
          required
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. MV-CE8XKS"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="pl-9 font-mono font-bold tracking-wider uppercase text-base"
              maxLength={12}
              required
            />
            <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          </div>
        </FormField>

        {isSelfCode && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <span>
              ⚠️ This is your own access code. To link a patient or family member, enter their code from their profile, or click a demo patient above.
            </span>
          </div>
        )}

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
