"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { RELATION_TYPES, type RelationType } from "@/shared/enums";
import { DEFAULT_CAREGIVER_PERMISSIONS } from "@/shared/types";
import {
  caregiverInviteSchema,
  type CaregiverInviteInput,
} from "@/shared/validations/caregiver";

const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  family: "Family Member",
  friend: "Friend / Neighbor",
  professional: "Doctor / Clinician / Nurse",
  other: "Other Caregiver",
};

interface InviteFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function InviteForm({ onSuccess }: InviteFormProps) {
  const [createdInvite, setCreatedInvite] = useState<{
    token: string;
    email: string;
    inviteUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CaregiverInviteInput>({
    resolver: zodResolver(caregiverInviteSchema) as never,
    defaultValues: {
      email: "",
      message: "",
      relationType: "family",
      permissions: DEFAULT_CAREGIVER_PERMISSIONS,
    },
  });

  const permissions = watch("permissions");

  const inviteMutation = api.caregiver.invite.useMutation({
    onSuccess: (data) => {
      toast.success(`Invitation sent to ${data.email}.`);
      setCreatedInvite({
        token: data.token,
        email: data.email,
        inviteUrl: data.inviteUrl,
      });
      utils.caregiver.listInvitations.invalidate();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send caregiver invitation.");
    },
  });

  const onSubmit = (values: CaregiverInviteInput) => {
    inviteMutation.mutate(values);
  };

  const copyInviteLink = () => {
    if (!createdInvite) return;
    const fullUrl = `${window.location.origin}${createdInvite.inviteUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Invitation link copied to clipboard.");
    setTimeout(() => setCopied(false), 2500);
  };

  if (createdInvite) {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${createdInvite.inviteUrl}`
        : createdInvite.inviteUrl;

    return (
      <div className="rounded-2xl border border-primary/20 bg-primary-tint/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Check className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
              Invitation Generated!
            </h3>
            <p className="text-xs text-muted-foreground">
              An invitation was created for <strong>{createdInvite.email}</strong>.
            </p>
          </div>
        </div>

        <p className="text-sm text-ink-900 dark:text-ink-100">
          Share this unique redemption link with your caregiver. When they open it, they will be guided to accept access:
        </p>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={fullUrl}
            className="font-mono text-xs bg-card"
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={copyInviteLink}
            className="gap-1.5 shrink-0"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </Button>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCreatedInvite(null);
              reset();
            }}
            className="text-xs text-muted-foreground hover:text-ink-900"
          >
            Invite Another Caregiver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      data-testid="caregiver-invite-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card-sm"
    >
      <div className="flex items-center gap-2.5 border-b border-border/80 pb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary-tint text-primary-dark dark:text-primary">
          <UserPlus className="size-4.5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">
            Invite a Caregiver
          </h2>
          <p className="text-xs text-muted-foreground">
            Authorize a family member, doctor, or trusted partner to monitor your medication adherence.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <FormField
          label="Caregiver Email"
          error={errors.email?.message}
          required
        >
          <Input
            id="caregiver-email"
            type="email"
            placeholder="caregiver@example.com"
            {...register("email")}
          />
        </FormField>

        {/* Relation Type */}
        <FormField
          label="Relationship"
          error={errors.relationType?.message}
          required
        >
          <select
            id="caregiver-relation-type"
            className="flex h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-ink-900 focus:outline-hidden focus:ring-2 focus:ring-primary/40 dark:text-ink-100"
            {...register("relationType")}
          >
            {RELATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {RELATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </FormField>

        {/* Message */}
        <FormField
          label="Personal Note (Optional)"
          error={errors.message?.message}
        >
          <Textarea
            id="caregiver-message"
            placeholder="Add a brief note explaining why you are inviting them..."
            rows={2}
            {...register("message")}
          />
        </FormField>

        {/* Permissions Group */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Permissions Granted
          </h3>

          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={permissions.viewAdherence}
                onCheckedChange={(val) => setValue("permissions.viewAdherence", Boolean(val))}
                className="mt-0.5"
              />
              <span className="text-xs text-ink-900 dark:text-ink-100">
                <strong>View adherence summaries:</strong> Allow viewing compliance score, daily charts, and streaks.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={permissions.viewMedications}
                onCheckedChange={(val) => setValue("permissions.viewMedications", Boolean(val))}
                className="mt-0.5"
              />
              <span className="text-xs text-ink-900 dark:text-ink-100">
                <strong>View medication details:</strong> Show specific prescription names, strengths, and times.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={permissions.receiveMissedDoseAlerts}
                onCheckedChange={(val) => setValue("permissions.receiveMissedDoseAlerts", Boolean(val))}
                className="mt-0.5"
              />
              <span className="text-xs text-ink-900 dark:text-ink-100">
                <strong>Missed dose alerts:</strong> Notify the caregiver when a scheduled dose is missed.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={permissions.receiveInsights}
                onCheckedChange={(val) => setValue("permissions.receiveInsights", Boolean(val))}
                className="mt-0.5"
              />
              <span className="text-xs text-ink-900 dark:text-ink-100">
                <strong>AI trends:</strong> Share behavioral adherence insights and suggestions.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={permissions.canAcknowledgeAlerts}
                onCheckedChange={(val) => setValue("permissions.canAcknowledgeAlerts", Boolean(val))}
                className="mt-0.5"
              />
              <span className="text-xs text-ink-900 dark:text-ink-100">
                <strong>Manage alerts:</strong> Permit acknowledging and resolving adherence alerts.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-border/80 pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={inviteMutation.isPending}
          className="gap-2"
        >
          {inviteMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send Invitation
        </Button>
      </div>
    </form>
  );
}
