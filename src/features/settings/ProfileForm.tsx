"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  HeartHandshake,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [animationTheme, setAnimationTheme] = useState<"batman" | "spidergwen" | "medical">("medical");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medvault_animation_theme") as "batman" | "spidergwen" | "medical" | null;
      if (saved) setAnimationTheme(saved);
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleThemeChange = (newTheme: "batman" | "spidergwen" | "medical") => {
    setAnimationTheme(newTheme);
    try {
      localStorage.setItem("medvault_animation_theme", newTheme);
      window.dispatchEvent(new Event("medvault_theme_change"));
      toast.success(
        `Background theme changed to ${
          newTheme === "batman" ? "Batman" : newTheme === "spidergwen" ? "Spider-Gwen" : "Medical Neutral"
        }!`,
      );
    } catch {}
  };

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

  const handleCopyCode = async () => {
    if (!profile?.accessCode) return;
    try {
      await navigator.clipboard.writeText(profile.accessCode);
      setCopiedCode(true);
      toast.success("Access code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast.error("Failed to copy code to clipboard.");
    }
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

  const isCaregiver = profile?.role === "caregiver";
  const userInitials = profile?.name
    ? profile.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MV";

  return (
    <div className="space-y-6">
      {/* ── Interactive Glassmorphism Identity Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 shadow-md backdrop-blur-xl"
      >
        {/* Glow orb */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-600 font-heading text-xl font-bold text-white shadow-lg ring-4 ring-primary/10">
              {userInitials}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                <span className="h-2 w-2 animate-ping rounded-full bg-white opacity-75" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  {profile?.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                    isCaregiver
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30"
                      : "bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30"
                  }`}
                >
                  {isCaregiver ? (
                    <>
                      <HeartHandshake className="size-3.5" />
                      Caregiver
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" />
                      Patient
                    </>
                  )}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          {/* Quick Portal Switcher for Caregivers */}
          {isCaregiver && (
            <Link
              href="/caregiver"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
            >
              <span>Open Caregiver Portal</span>
              <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>

        {/* ── Secure Access Code Pod ── */}
        <div className="mt-6 rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <KeyRound className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Patient Link Access Code
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="size-2.5" />
                    Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Give this code to your caregiver to let them securely monitor your medications and appointments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 font-mono text-sm font-bold tracking-widest text-primary shadow-xs">
                <span>{profile?.accessCode || "MV-READY"}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <AnimatePresence mode="wait">
                  {copiedCode ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                    >
                      <Check className="size-3.5" />
                      <span>Copied!</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="flex items-center gap-1 text-foreground"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Settings Form ── */}
      <form
        data-testid="profile-settings-form"
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
      >
        <div>
          <h3 className="font-heading text-base font-bold text-foreground">Personal Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal identity, display name, and local schedule timezone.
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
              All dose reminders, appointments, and adherence day calculations are aligned to this timezone.
            </p>
          </div>

          {/* Ambient Animation Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-secondary" />
              <span>Ambient Animation Theme</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: "batman", title: "Batman Dark Knight", desc: "Male < 27 / Cyberpunk" },
                { id: "spidergwen", title: "Spider-Gwen Neon", desc: "Female < 27 / Spider-Verse" },
                { id: "medical", title: "Medical Neutral", desc: "Age 28+ / Translucent Glass" },
              ].map((th) => {
                const isSelected = animationTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleThemeChange(th.id as "batman" | "spidergwen" | "medical")}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all text-xs ${
                      isSelected
                        ? "border-secondary bg-secondary/15 ring-2 ring-secondary/30 font-bold shadow-xs"
                        : "border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="font-semibold text-foreground">{th.title}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{th.desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automatically assigned from age and gender during registration, customizable anytime.
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
    </div>
  );
}
