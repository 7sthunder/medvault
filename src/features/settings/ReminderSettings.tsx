"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Pill } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/trpc";
import type { ReminderSettingsPanelDTO } from "@/shared/types";

/**
 * Phase 18 — `/settings/reminders` (§11.14).
 *
 * Three groups in one page: the timing defaults (missed / snooze / max snoozes / lead time), the
 * notification pref toggles, and the per-medication `remindersEnabled` table. Numeric fields keep
 * their own draft state so a half-typed value never round-trips to the server; the draft is
 * merged into the form and validated on save.
 */

/** Per-medication rows are toggled optimistically; the snapshot makes a refetch non-destructive. */
type RowSnapshot = Record<string, boolean>;

function NumberField({
  id,
  label,
  hint,
  suffix,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-800">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-ink-900">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ReminderSettings() {
  const utils = api.useUtils();
  const query = api.settings.reminders.useQuery();
  const saveDefaults = api.settings.updateReminders.useMutation({
    onSuccess: () => {
      toast.success("Reminder settings saved");
      void utils.settings.reminders.invalidate();
      // Lead time / missed window drive tomorrow's schedule and the snooze affordances.
      void utils.schedule.day.invalidate();
      void utils.schedule.get.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const toggleMeds = api.settings.setMedicationReminders.useMutation({
    onSuccess: () => {
      void utils.settings.reminders.invalidate();
      void utils.schedule.day.invalidate();
      void utils.medication.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
      void utils.settings.reminders.invalidate();
    },
  });

  const [draft, setDraft] = useState<ReminderSettingsPanelDTO | null>(null);
  const [rows, setRows] = useState<RowSnapshot | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setDraft(query.data);
      setRows(Object.fromEntries(query.data.medications.map((m) => [m.id, m.remindersEnabled])));
    }
  }, [query.data]);

  const dirty = useMemo(() => {
    if (!draft || !query.data) return false;
    return (
      draft.missedAfterMinutes !== query.data.missedAfterMinutes ||
      draft.snoozeMinutes !== query.data.snoozeMinutes ||
      draft.maxSnoozes !== query.data.maxSnoozes ||
      draft.reminderBeforeMinutes !== query.data.reminderBeforeMinutes ||
      JSON.stringify(draft.notificationPrefs) !== JSON.stringify(query.data.notificationPrefs) ||
      JSON.stringify(draft.caregiverAlertPrefs) !== JSON.stringify(query.data.caregiverAlertPrefs)
    );
  }, [draft, query.data]);

  if (query.isLoading) {
    return (
      <div className="grid gap-5" aria-busy="true">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load reminder settings"
        description="Your reminder preferences could not be loaded right now."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const patchDraft = (patch: Partial<ReminderSettingsPanelDTO>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));

  const toggleMedication = (id: string, next: boolean) => {
    setRows((current) => ({ ...(current ?? {}), [id]: next }));
    toggleMeds.mutate({ medicationIds: [id], remindersEnabled: next });
  };

  const setAllMedications = (next: boolean) => {
    setRows(Object.fromEntries(query.data.medications.map((m) => [m.id, next])));
    toggleMeds.mutate({
      medicationIds: query.data.medications.map((m) => m.id),
      remindersEnabled: next,
    });
  };

  const save = () => {
    if (!draft) return;
    if (
      draft.missedAfterMinutes < 5 ||
      draft.missedAfterMinutes > 120 ||
      draft.snoozeMinutes < 1 ||
      draft.snoozeMinutes > 60 ||
      draft.maxSnoozes < 0 ||
      draft.maxSnoozes > 10 ||
      draft.reminderBeforeMinutes < 0 ||
      draft.reminderBeforeMinutes > 60
    ) {
      setValidationError("One or more values are outside the allowed range.");
      return;
    }
    setValidationError(null);
    saveDefaults.mutate(
      {
        missedAfterMinutes: draft.missedAfterMinutes,
        snoozeMinutes: draft.snoozeMinutes,
        maxSnoozes: draft.maxSnoozes,
        reminderBeforeMinutes: draft.reminderBeforeMinutes,
        notificationPrefs: draft.notificationPrefs,
        caregiverAlertPrefs: draft.caregiverAlertPrefs,
      },
      { onError: () => setValidationError("Couldn't save your reminder settings.") },
    );
  };

  const medications = query.data.medications;
  const allOn = medications.length > 0 && medications.every((m) => rows?.[m.id]);

  return (
    <div className="grid gap-5">
      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Timing defaults</CardTitle>
          <CardDescription>
            Applied to every schedule that doesn&apos;t override them.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="reminder-missed"
            label="Mark missed after"
            hint="Grace period before a dose is logged as missed."
            suffix="minutes"
            min={5}
            max={120}
            value={draft?.missedAfterMinutes ?? 0}
            onChange={(next) => patchDraft({ missedAfterMinutes: next })}
          />
          <NumberField
            id="reminder-snooze"
            label="Snooze length"
            hint="How long a snoozed reminder stays quiet."
            suffix="minutes"
            min={1}
            max={60}
            value={draft?.snoozeMinutes ?? 0}
            onChange={(next) => patchDraft({ snoozeMinutes: next })}
          />
          <NumberField
            id="reminder-max-snoozes"
            label="Max snoozes"
            hint="0 disables snoozing for every dose."
            suffix="times"
            min={0}
            max={10}
            value={draft?.maxSnoozes ?? 0}
            onChange={(next) => patchDraft({ maxSnoozes: next })}
          />
          <NumberField
            id="reminder-lead"
            label="Remind me before"
            hint="0 turns off advance reminders."
            suffix="minutes"
            min={0}
            max={60}
            value={draft?.reminderBeforeMinutes ?? 0}
            onChange={(next) => patchDraft({ reminderBeforeMinutes: next })}
          />
        </CardContent>
      </Card>

      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Notifications</CardTitle>
          <CardDescription>Which notifications this device may show you.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleRow
            id="pref-dose-reminders"
            label="Dose reminders"
            hint="Push or banner alerts before a scheduled dose."
            checked={draft?.notificationPrefs.doseReminders ?? false}
            onChange={(next) =>
              patchDraft({
                notificationPrefs: { ...draft!.notificationPrefs, doseReminders: next },
              })
            }
          />
          <ToggleRow
            id="pref-caregiver-missed"
            label="Caregiver missed-dose alerts"
            hint="Let your caregiver see when a dose is missed."
            checked={draft?.notificationPrefs.caregiverMissedAlerts ?? false}
            onChange={(next) =>
              patchDraft({
                notificationPrefs: { ...draft!.notificationPrefs, caregiverMissedAlerts: next },
              })
            }
          />
          <ToggleRow
            id="pref-insights"
            label="Weekly insight"
            hint="A summary of adherence, streaks and patterns each week."
            checked={draft?.notificationPrefs.insights ?? false}
            onChange={(next) =>
              patchDraft({ notificationPrefs: { ...draft!.notificationPrefs, insights: next } })
            }
          />
          <ToggleRow
            id="pref-sounds"
            label="Sounds"
            hint="Play a sound with dose and missed-dose notifications."
            checked={draft?.notificationPrefs.sounds ?? false}
            onChange={(next) =>
              patchDraft({ notificationPrefs: { ...draft!.notificationPrefs, sounds: next } })
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-card-sm">
        <CardHeader className="gap-3">
          <CardTitle className="text-ink-900">Per-medication reminders</CardTitle>
          <CardDescription>
            Silence reminders for one medication without pausing its whole schedule.
          </CardDescription>
          {medications.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={toggleMeds.isPending}
              onClick={() => setAllMedications(!allOn)}
            >
              {allOn ? "Mute all reminders" : "Enable all reminders"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medications yet"
              description="Add a medication to choose which ones remind you."
            />
          ) : (
            <ul className="divide-y divide-border">
              {medications.map((med) => {
                const enabled = rows?.[med.id] ?? med.remindersEnabled;
                return (
                  <li key={med.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.dosageAmount} {med.dosageUnit}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      disabled={toggleMeds.isPending}
                      aria-label={`Reminders for ${med.name}`}
                      onCheckedChange={(next) => toggleMedication(med.id, next === true)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={!dirty || saveDefaults.isPending}>
          {saveDefaults.isPending ? "Saving…" : "Save changes"}
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
        {dirty && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="size-3.5" aria-hidden />
            Unapplied changes
          </p>
        )}
      </div>
    </div>
  );
}
