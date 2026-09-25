"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { RELATION_TYPES } from "@/shared/enums";
import type { RelationType } from "@/shared/enums";
import { DEFAULT_CAREGIVER_PERMISSIONS } from "@/shared/types";
import type { CaregiverPermissions } from "@/shared/types";

import { PermissionsEditor } from "./PermissionsEditor";
import { RELATION_LABEL } from "./caregiver-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * §11.12 invite form — patient creates a caregiver invitation (email + optional message +
 * relation + permission set). The token is returned server-side and shown so the patient can
 * hand it off (the invite link is `/caregiver/accept?token=…`).
 */
export function InviteForm({ onInvited }: { onInvited?: () => void }) {
  const utils = api.useUtils();
  const invite = api.caregiver.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent");
      setEmail("");
      setMessage("");
      setPermissions({ ...DEFAULT_CAREGIVER_PERMISSIONS });
      void utils.caregiver.overview.invalidate();
      onInvited?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [relation, setRelation] = useState<RelationType>("family");
  const [permissions, setPermissions] = useState<CaregiverPermissions>({ ...DEFAULT_CAREGIVER_PERMISSIONS });
  const [touched, setTouched] = useState(false);

  const emailError = touched && email.length > 0 && !EMAIL_RE.test(email) ? "Enter a valid email address." : null;
  const canSubmit = email.length > 0 && !emailError && !invite.isPending;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    invite.mutate({ email, message: message || undefined, relationType: relation, permissions });
  };

  return (
    <form
      data-slot="invite-form"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <FormField label="Caregiver email" error={emailError} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="caregiver@example.com"
          aria-label="Caregiver email"
        />
      </FormField>

      <FormField label="Relation" hint="How they're connected to you">
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value as RelationType)}
          aria-label="Relation"
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
        >
          {RELATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {RELATION_LABEL[t]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Message (optional)" hint="A short note they see when accepting">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="I'd love your help keeping on track."
          aria-label="Message"
        />
      </FormField>

      <fieldset className="rounded-xl border border-border bg-background p-3">
        <legend className="px-1 text-[13px] font-semibold text-ink-800">Permissions</legend>
        <PermissionsEditor permissions={permissions} onChange={setPermissions} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={!canSubmit || invite.isPending}>
          {invite.isPending ? "Sending…" : "Send invite"}
        </Button>
        {invite.data && (
          <InviteLink href={invite.data.href} />
        )}
      </div>
    </form>
  );
}

/** Freshly-created invite link + copy — the token is shown exactly once here. */
function InviteLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const full = `${origin}${href}`;
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-primary-tint px-3 py-1.5 text-sm text-primary-dark">
      <code className="truncate">{full}</code>
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => {
          void navigator.clipboard?.writeText(full);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </span>
  );
}