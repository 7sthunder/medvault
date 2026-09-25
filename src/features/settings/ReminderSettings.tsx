"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  Loader2,
  Pill,
  Save,
  ShieldAlert,
  Sparkles,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { MedicationReminderItem } from "@/server/domain/settings/service";

export function ReminderSettings() {
  const { data, isLoading, isError, error, refetch } = api.settings.getReminders.useQuery();
  const utils = api.useUtils();

  const [missedAfterMinutes, setMissedAfterMinutes] = useState(30);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [maxSnoozes, setMaxSnoozes] = useState(3);
  const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState(5);

  const [notificationPrefs, setNotificationPrefs] = useState({
    doseReminders: true,
    caregiverMissedAlerts: true,
    insights: true,
    sounds: true,
  });

  const [medReminders, setMedReminders] = useState<MedicationReminderItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setMissedAfterMinutes(data.missedAfterMinutes);
      setSnoozeMinutes(data.snoozeMinutes);
      setMaxSnoozes(data.maxSnoozes);
      setReminderBeforeMinutes(data.reminderBeforeMinutes);
      setNotificationPrefs({
        doseReminders: data.notificationPrefs?.doseReminders ?? true,
        caregiverMissedAlerts: data.notificationPrefs?.caregiverMissedAlerts ?? true,
        insights: data.notificationPrefs?.insights ?? true,
        sounds: data.notificationPrefs?.sounds ?? true,
      });
      setMedReminders(data.medications || []);
      setIsDirty(false);
    }
  }, [data]);

  const updateMutation = api.settings.updateReminders.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      toast.success("Reminder preferences updated successfully!");
      void utils.settings.getReminders.invalidate();
      void utils.dashboard.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update reminder settings.");
    },
  });

  const handleMedToggle = (id: string, current: boolean) => {
    setMedReminders((prev) =>
      prev.map((m) => (m.id === id ? { ...m, remindersEnabled: !current } : m)),
    );
    setIsDirty(true);
  };

  const handlePrefToggle = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      missedAfterMinutes,
      snoozeMinutes,
      maxSnoozes,
      reminderBeforeMinutes,
      notificationPrefs,
      perMedicationReminders: medReminders.map((m) => ({
        medicationId: m.id,
        remindersEnabled: m.remindersEnabled,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <Skeleton className="h-6 w-52 rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
        <p className="text-sm text-destructive">{error?.message || "Failed to load reminder settings."}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form
      data-testid="reminder-settings-form"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-8"
    >
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Reminder & Dose Windows</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure how and when MedVault triggers notifications, auto-miss deadlines, and snooze periods.
        </p>
      </div>

      {/* 1. Threshold Settings */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule Windows
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Missed After Minutes */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="missed-after-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-rose-500" />
                Auto-Miss Window
              </label>
              <span className="text-xs font-mono font-medium text-foreground">{missedAfterMinutes} min</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Doses unlogged after this threshold automatically transition to missed.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {[15, 30, 45, 60].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMissedAfterMinutes(preset);
                    setIsDirty(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    missedAfterMinutes === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Snooze Minutes */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="snooze-duration-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bell className="size-3.5 text-amber-500" />
                Snooze Duration
              </label>
              <span className="text-xs font-mono font-medium text-foreground">{snoozeMinutes} min</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Delays a due dose notification before re-alerting.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {[5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSnoozeMinutes(preset);
                    setIsDirty(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    snoozeMinutes === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Max Snoozes */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bell className="size-3.5 text-indigo-500" />
                Max Snoozes Allowed
              </label>
              <span className="text-xs font-mono font-medium text-foreground">{maxSnoozes} times</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              After reaching this limit, snoozing is disabled and the dose must be resolved.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMaxSnoozes(preset);
                    setIsDirty(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    maxSnoozes === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Before Minutes */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-violet-500" />
                Upcoming Dose Notice
              </label>
              <span className="text-xs font-mono font-medium text-foreground">{reminderBeforeMinutes} min</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Advance notice fired before the dose becomes due.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {[0, 5, 10, 15].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReminderBeforeMinutes(preset);
                    setIsDirty(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    reminderBeforeMinutes === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {preset === 0 ? "Exact" : `${preset}m`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Notification Channels */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notification Preferences
        </h3>

        <div className="rounded-xl border border-border divide-y divide-border/60 bg-background/50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Pill className="size-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Dose Reminders</p>
                <p className="text-[11px] text-muted-foreground">
                  Receive in-app alerts when scheduled doses are due or upcoming.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.doseReminders}
              onChange={() => handlePrefToggle("doseReminders")}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Caregiver Missed Dose Alerts</p>
                <p className="text-[11px] text-muted-foreground">
                  Notify connected caregivers when a scheduled dose is missed.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.caregiverMissedAlerts}
              onChange={() => handlePrefToggle("caregiverMissedAlerts")}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-violet-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">AI Habit Insights</p>
                <p className="text-[11px] text-muted-foreground">
                  Receive recommendations and streak milestones from pattern analysis.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.insights}
              onChange={() => handlePrefToggle("insights")}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Volume2 className="size-5 text-sky-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Reminder Sounds</p>
                <p className="text-[11px] text-muted-foreground">
                  Play audio chime when a dose reminder notification appears.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.sounds}
              onChange={() => handlePrefToggle("sounds")}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* 3. Per-Medication Reminder Toggles */}
      {medReminders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Per-Medication Reminders
          </h3>

          <div className="rounded-xl border border-border divide-y divide-border/60 bg-background/50">
            {medReminders.map((med) => (
              <div key={med.id} className="p-3.5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-foreground">{med.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {med.remindersEnabled ? "Active" : "Muted"}
                  </span>
                  <input
                    type="checkbox"
                    checked={med.remindersEnabled}
                    onChange={() => handleMedToggle(med.id, med.remindersEnabled)}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Submit */}
      <div className="pt-2 flex items-center justify-between border-t border-border/60">
        <span className="text-xs text-muted-foreground">
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </span>

        <Button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className="gap-2"
          data-testid="save-reminders-button"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              <span>Save Preferences</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
