"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/trpc";
import type { AppearanceSettingsDTO } from "@/shared/types";
import type { Theme, UiDensity } from "@/shared/enums";

/**
 * Phase 18 — `/settings/appearance` (§11.14 + §5.7).
 *
 * Theme/density/motion apply to `<html>` immediately (before the save round-trip) so the choice is
 * felt, not described: the user sees the whole app re-theme under the cursor and can back it out
 * with Discard. The server stays the source of truth, so a reload restores exactly what was saved.
 */

const THEME_OPTIONS: readonly { value: Theme; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", hint: "Bright background", icon: Sun },
  { value: "dark", label: "Dark", hint: "Low-light friendly", icon: Moon },
  { value: "system", label: "System", hint: "Follows your device", icon: Monitor },
];

const DENSITY_OPTIONS: readonly { value: UiDensity; label: string; hint: string }[] = [
  { value: "comfortable", label: "Comfortable", hint: "Roomy rows and cards" },
  { value: "compact", label: "Compact", hint: "More rows per screen" },
];

export function AppearancePanel() {
  const utils = api.useUtils();
  const query = api.settings.appearance.useQuery();
  const save = api.settings.updateAppearance.useMutation({
    onSuccess: (saved) => {
      toast.success("Appearance saved");
      setDraft(saved);
      void utils.settings.appearance.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [draft, setDraft] = useState<AppearanceSettingsDTO | null>(null);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  if (query.isLoading) return <Skeleton className="h-72 w-full rounded-xl" aria-busy="true" />;

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load appearance settings"
        description="Your theme preferences could not be loaded right now."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const dirty = Boolean(
    draft &&
      (draft.theme !== query.data.theme ||
        draft.uiDensity !== query.data.uiDensity ||
        draft.reduceMotion !== query.data.reduceMotion),
  );

  const commit = () => {
    if (!draft) return;
    save.mutate(draft);
  };

  return (
    <div className="grid gap-5">
      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Theme</CardTitle>
          <CardDescription>Applies immediately — you don&apos;t have to save to preview it.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">Theme</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const active = draft?.theme === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraft((current) => (current ? { ...current, theme: option.value } : current))}
                    aria-pressed={active}
                    className={
                      active
                        ? "flex flex-col items-start gap-1 rounded-xl border-2 border-primary bg-accent/40 p-4 text-left"
                        : "flex flex-col items-start gap-1 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted"
                    }
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <Icon className="size-4" aria-hidden />
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Density</CardTitle>
          <CardDescription>How much breathing room each row gets.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">Density</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {DENSITY_OPTIONS.map((option) => {
                const active = draft?.uiDensity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setDraft((current) => (current ? { ...current, uiDensity: option.value } : current))
                    }
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-xl border-2 border-primary bg-accent/40 p-4 text-left"
                        : "rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted"
                    }
                  >
                    <span className="block text-sm font-semibold text-ink-900">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Motion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <label htmlFor="reduce-motion" className="text-sm font-medium text-ink-900">
                Reduce motion
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Turns off transitions and animated feedback. Recommended if motion makes you
                uncomfortable.
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={draft?.reduceMotion ?? false}
              onCheckedChange={(next) =>
                setDraft((current) => (current ? { ...current, reduceMotion: next === true } : current))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={commit} disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setDraft(query.data)}>
          Discard
        </Button>
      </div>
    </div>
  );
}
