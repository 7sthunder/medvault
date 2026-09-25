"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Save, Shield, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";

export function CaregiverSettings() {
  const { data: prefs, isLoading, isError, error, refetch } = api.settings.getPreferences.useQuery();
  const utils = api.useUtils();

  const [missedDoseOn, setMissedDoseOn] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (prefs?.caregiverAlertPrefs) {
      const alertPrefs = prefs.caregiverAlertPrefs as {
        missedDoseOn?: boolean;
        dailyDigest?: boolean;
      };
      setMissedDoseOn(alertPrefs.missedDoseOn ?? true);
      setDailyDigest(alertPrefs.dailyDigest ?? false);
      setIsDirty(false);
    }
  }, [prefs]);

  const updateMutation = api.settings.updateCaregiverPrefs.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      toast.success("Caregiver alert preferences saved!");
      void utils.settings.getPreferences.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save caregiver preferences.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      caregiverAlertPrefs: {
        missedDoseOn,
        dailyDigest,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
        <p className="text-sm text-destructive">{error?.message || "Failed to load preferences."}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        data-testid="caregiver-settings-form"
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
      >
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Caregiver Alert Preferences
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control which automated alerts and adherence digests are broadcast to your trusted circle.
          </p>
        </div>

        <div className="rounded-xl border border-border divide-y divide-border/60 bg-background/50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Urgent Missed Dose Broadcasts</p>
                <p className="text-[11px] text-muted-foreground">
                  Immediately generate emergency alert items for caregivers when you miss a dose.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={missedDoseOn}
              onChange={(e) => {
                setMissedDoseOn(e.target.checked);
                setIsDirty(true);
              }}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Shield className="size-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Daily Adherence Digest</p>
                <p className="text-[11px] text-muted-foreground">
                  Send an end-of-day summary of completed and missed doses to connected caregivers.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={dailyDigest}
              onChange={(e) => {
                setDailyDigest(e.target.checked);
                setIsDirty(true);
              }}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-border/60">
          <span className="text-xs text-muted-foreground">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>

          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="gap-2"
            data-testid="save-caregiver-prefs-button"
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

      {/* Quick link to full Caregiver Management hub */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">
              Caregiver Network & Permissions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invite family members, doctors, or healthcare assistants and customize granular permissions.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          nativeButton={false}
          render={<Link href="/caregiver" />}
        >
          <span>Manage Network</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
