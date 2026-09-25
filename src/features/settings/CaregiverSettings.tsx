"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/trpc";
import type { CaregiverAlertPrefs } from "@/shared/types";

/**
 * Phase 18 — `/settings/caregiver` (§11.14).
 *
 * Only the *alert preferences* live here (who you share with, and with which permissions, is the
 * `/caregiver` relationship screen from §11.12). The threshold input is deliberately a number box
 * plus a clear "off" switch rather than a slider: a slider would silently re-enable alerts for a
 * user who had them switched off, which is the wrong default for a health escalation.
 */

const THRESHOLD_MIN = 1;
const THRESHOLD_MAX = 100;

export function CaregiverSettings() {
  const utils = api.useUtils();
  const query = api.settings.caregiverPrefs.useQuery();
  const save = api.settings.updateCaregiverPrefs.useMutation({
    onSuccess: (saved) => {
      toast.success("Caregiver alert settings saved");
      setDraft(saved);
      void utils.settings.caregiverPrefs.invalidate();
      void utils.settings.reminders.invalidate();
      // The reconcile pass reads these prefs, so the caregiver overview may change.
      void utils.caregiver.overview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [draft, setDraft] = useState<CaregiverAlertPrefs | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  if (query.isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" aria-busy="true" />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load caregiver settings"
        description="Your caregiver alert preferences could not be loaded right now."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const alertsOff = draft ? draft.adherenceDropThreshold === null : false;
  const dirty = Boolean(
    draft &&
      (draft.missedDoseOn !== query.data.missedDoseOn ||
        draft.dailyDigest !== query.data.dailyDigest ||
        draft.adherenceDropThreshold !== query.data.adherenceDropThreshold),
  );

  const commit = () => {
    if (!draft) return;
    if (draft.adherenceDropThreshold !== null) {
      if (
        draft.adherenceDropThreshold < THRESHOLD_MIN ||
        draft.adherenceDropThreshold > THRESHOLD_MAX
      ) {
        setValidationError(`Pick a threshold between ${THRESHOLD_MIN}% and ${THRESHOLD_MAX}%.`);
        return;
      }
    }
    setValidationError(null);
    save.mutate(draft);
  };

  return (
    <div className="grid gap-5">
      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Alerts my caregivers can raise</CardTitle>
          <CardDescription>
            Applies to every caregiver you invite. Manage who has access on the caregiver screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <label htmlFor="caregiver-missed" className="text-sm font-medium text-ink-900">
                Missed dose
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Notify caregivers when a dose is logged as missed.
              </p>
            </div>
            <Switch
              id="caregiver-missed"
              checked={draft?.missedDoseOn ?? false}
              onCheckedChange={(next) =>
                setDraft((current) => (current ? { ...current, missedDoseOn: next === true } : current))
              }
            />
          </div>

          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <label htmlFor="caregiver-digest" className="text-sm font-medium text-ink-900">
                Daily digest
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                One summary per day instead of individual notifications.
              </p>
            </div>
            <Switch
              id="caregiver-digest"
              checked={draft?.dailyDigest ?? false}
              onCheckedChange={(next) =>
                setDraft((current) => (current ? { ...current, dailyDigest: next === true } : current))
              }
            />
          </div>

          <div className="py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <label htmlFor="caregiver-threshold" className="text-sm font-medium text-ink-900">
                  Adherence drop alert
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Alert caregivers when your 7-day adherence falls below this level.
                </p>
              </div>
              <Switch
                checked={!alertsOff}
                aria-label="Enable adherence drop alerts"
                onCheckedChange={(next) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          adherenceDropThreshold: next === true ? 70 : null,
                        }
                      : current,
                  )
                }
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                id="caregiver-threshold"
                type="number"
                inputMode="numeric"
                min={THRESHOLD_MIN}
                max={THRESHOLD_MAX}
                disabled={alertsOff}
                value={draft?.adherenceDropThreshold ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          adherenceDropThreshold: raw === "" ? null : Number(raw),
                        }
                      : current,
                  );
                }}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">
                % over the last 7 days
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Who you share with</CardTitle>
          <CardDescription>
            Invite family members or clinicians, and change what each of them can see.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Invitations and per-caregiver permissions are managed on the caregiver screen, so you
            always confirm who gains access before they see anything.
          </p>
          <Link href="/caregiver" className="mt-3 inline-block">
            <Button type="button" variant="outline">
              <Users className="size-4" aria-hidden />
              Manage caregivers
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={commit} disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!dirty}
          onClick={() => setDraft(query.data)}
        >
          Discard
        </Button>
        {validationError && (
          <p role="alert" className="text-sm font-medium text-red">
            {validationError}
          </p>
        )}
      </div>
    </div>
  );
}
