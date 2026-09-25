"use client";

import { useEffect, useState } from "react";
import { Check, Globe, Loader2, Mail, Save, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { TIMEZONE_LIST } from "@/shared/validations/common";

export function ProfileForm() {
  const { data: profile, isLoading, isError, error, refetch } = api.settings.getProfile.useQuery();

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTimezone(profile.timezone || "UTC");
      setIsDirty(false);
    }
  }, [profile]);

  const updateMutation = api.settings.updateProfile.useMutation({
    onSuccess: (updated) => {
      setName(updated.name);
      setTimezone(updated.timezone);
      setIsDirty(false);
      toast.success("Profile preferences saved successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile settings.");
    },
  });

  const handleNameChange = (val: string) => {
    setName(val);
    setIsDirty(true);
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    updateMutation.mutate({ name: name.trim(), timezone });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
        <p className="text-sm text-destructive">{error?.message || "Failed to load profile."}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form
      data-testid="profile-settings-form"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
    >
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Personal Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal identity, contact details, and local timezone.
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="settings-name" className="text-xs font-semibold text-foreground">
            Display Name
          </label>
          <div className="relative">
            <input
              id="settings-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="e.g. Eleanor Vance"
            />
            <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        {/* Email Address (read-only) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="settings-email" className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Check className="size-3" />
              Verified
            </span>
          </div>
          <div className="relative">
            <input
              id="settings-email"
              type="email"
              readOnly
              value={profile?.email || ""}
              className="w-full rounded-xl border border-border/80 bg-muted/50 px-3.5 py-2.5 pl-10 text-sm text-muted-foreground cursor-not-allowed outline-none"
            />
            <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Email addresses are securely managed through Better-Auth authentication.
          </p>
        </div>

        {/* Timezone Selector */}
        <div className="space-y-1.5">
          <label htmlFor="settings-timezone" className="text-xs font-semibold text-foreground">
            Local Timezone
          </label>
          <div className="relative">
            <select
              id="settings-timezone"
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-background px-3.5 py-2.5 pl-10 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              {TIMEZONE_LIST.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <Globe className="absolute left-3.5 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            All dose reminders and adherence day calculations are aligned to this timezone.
          </p>
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
          data-testid="save-profile-button"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
