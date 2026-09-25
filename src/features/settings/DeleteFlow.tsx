"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc";
import { DELETE_ACCOUNT_CONFIRM, DELETE_DATA_CONFIRM } from "@/shared/validations/settings";

/**
 * Phase 18 — destructive data governance flows (§10.11 / §11.14).
 *
 * Two independent flows, each behind a typed confirmation phrase that the *router* re-validates:
 *   1. "Delete all data" — wipes medications, dose history, insights, notifications and caregiver
 *      links, but keeps the account so you can start over.
 *   2. "Delete account" — the whole thing, including the auth rows, then signs out.
 * The two phrases are deliberately different words so muscle memory from the first cannot carry
 * through to the second.
 */

type Flow = "data" | "account";

export function DeleteFlow({ hasDemoData }: { hasDemoData: boolean }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState<Flow | null>(null);
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deleteAllData = api.settings.deleteAllData.useMutation({
    onSuccess: () => {
      setOpen(null);
      setPhrase("");
      toast.success("All your data was deleted. Your account is still here.");
      void utils.settings.dataOverview.invalidate();
      void utils.medication.list.invalidate();
      void utils.schedule.day.invalidate();
      void utils.schedule.get.invalidate();
      void utils.adherence.summary.invalidate();
      void utils.insights.list.invalidate();
      void utils.caregiver.overview.invalidate();
      void utils.notifications.list.invalidate();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const deleteAccount = api.settings.deleteAccount.useMutation({
    onSuccess: async () => {
      setOpen(null);
      setPhrase("");
      await signOut({ callbackURL: "/" });
      router.push("/");
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const close = () => {
    setOpen(null);
    setPhrase("");
    setError(null);
  };

  const active = open === "data" ? "data" : open === "account" ? "account" : null;
  const required = active === "data" ? DELETE_DATA_CONFIRM : DELETE_ACCOUNT_CONFIRM;
  const matches = phrase.trim() === required;
  const pending = deleteAllData.isPending || deleteAccount.isPending;

  const confirm = () => {
    if (!matches) {
      setError(`Type ${required} exactly to confirm.`);
      return;
    }
    setError(null);
    if (active === "data") deleteAllData.mutate({ confirmation: phrase.trim() });
    else if (active === "account") deleteAccount.mutate({ confirmation: phrase.trim() });
  };

  return (
    <>
      <Card className="shadow-card-sm border-red/30">
        <CardHeader>
          <CardTitle className="text-ink-900">Delete all data</CardTitle>
          <CardDescription>
            Removes every medication, dose, insight and notification. Your login stays active so
            you can start fresh. This can&apos;t be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasDemoData && (
            <p className="mb-3 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              This is a demo account, so its seeded data is included in the deletion.
            </p>
          )}
          <Button type="button" variant="destructive" onClick={() => setOpen("data")}>
            <Trash2 className="size-4" aria-hidden />
            Delete all data
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card-sm border-red/30">
        <CardHeader>
          <CardTitle className="text-ink-900">Delete account</CardTitle>
          <CardDescription>
            Deletes your account and every trace of your data, then signs you out. This can&apos;t be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={() => setOpen("account")}>
            <Trash2 className="size-4" aria-hidden />
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={active === "data" ? "Delete all your data?" : "Delete your account?"}
        description={
          active === "data"
            ? "Every medication, dose log, insight and notification is removed. Your account and login remain."
            : "Your account, login and all data are permanently removed, and you will be signed out."
        }
        confirmLabel={active === "data" ? "Delete all data" : "Delete my account"}
        confirmDisabled={!matches || pending}
        onConfirm={confirm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
        >
          <FormField
            label={`Type ${required} to confirm`}
            error={error}
            hint="Case-sensitive. This is the only check that stops an accidental wipe."
            required
          >
            <Input
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                setError(null);
              }}
              placeholder={required}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
            Confirm
          </button>
        </form>
      </ConfirmationDialog>
    </>
  );
}
