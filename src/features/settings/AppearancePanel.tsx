"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, MoveHorizontal, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { Theme, UiDensity } from "@/shared/enums";

export function AppearancePanel() {
  const { data: prefs, isLoading, isError, error, refetch } = api.settings.getPreferences.useQuery();
  const utils = api.useUtils();

  const [theme, setTheme] = useState<Theme>("light");
  const [uiDensity, setUiDensity] = useState<UiDensity>("comfortable");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (prefs) {
      setTheme(prefs.theme as Theme);
      setUiDensity(prefs.uiDensity as UiDensity);
      setReduceMotion(prefs.reduceMotion ?? false);
    }
  }, [prefs]);

  // Apply theme dynamically to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const applySystem = () => {
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };
      applySystem();
      mediaQuery.addEventListener("change", applySystem);
      return () => mediaQuery.removeEventListener("change", applySystem);
    }
  }, [theme]);

  // Apply reduceMotion dynamically to document element for immediate CSS reflection
  useEffect(() => {
    document.documentElement.setAttribute("data-reduce-motion", String(reduceMotion));
  }, [reduceMotion]);

  const updateMutation = api.settings.updateAppearance.useMutation({
    onSuccess: () => {
      toast.success("Appearance preferences updated!");
      void utils.settings.getPreferences.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save appearance settings.");
    },
  });

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateMutation.mutate({
      theme: newTheme,
      uiDensity,
      reduceMotion,
    });
  };

  const handleDensityChange = (density: UiDensity) => {
    setUiDensity(density);
    updateMutation.mutate({
      theme,
      uiDensity: density,
      reduceMotion,
    });
  };

  const handleReduceMotionToggle = (checked: boolean) => {
    setReduceMotion(checked);
    updateMutation.mutate({
      theme,
      uiDensity,
      reduceMotion: checked,
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
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
    <div data-testid="appearance-panel" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Theme & Interface</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select your preferred visual mode and adjust accessibility contrast and motion.
          </p>
        </div>

        {/* Theme Options */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-foreground">Color Theme</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Light */}
            <button
              type="button"
              data-testid="theme-light"
              onClick={() => handleThemeChange("light")}
              className={`rounded-xl border p-4 text-left transition-all flex flex-col justify-between h-28 ${
                theme === "light"
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "border-border/80 bg-background/50 hover:border-border hover:bg-muted/40"
              }`}
            >
              <Sun className={`size-5 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">Light Mode</p>
                <p className="text-[11px] text-muted-foreground">Crisp daylight palette</p>
              </div>
            </button>

            {/* Dark */}
            <button
              type="button"
              data-testid="theme-dark"
              onClick={() => handleThemeChange("dark")}
              className={`rounded-xl border p-4 text-left transition-all flex flex-col justify-between h-28 ${
                theme === "dark"
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "border-border/80 bg-background/50 hover:border-border hover:bg-muted/40"
              }`}
            >
              <Moon className={`size-5 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">Dark Mode</p>
                <p className="text-[11px] text-muted-foreground">Deep obsidian aesthetic</p>
              </div>
            </button>

            {/* System */}
            <button
              type="button"
              data-testid="theme-system"
              onClick={() => handleThemeChange("system")}
              className={`rounded-xl border p-4 text-left transition-all flex flex-col justify-between h-28 ${
                theme === "system"
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "border-border/80 bg-background/50 hover:border-border hover:bg-muted/40"
              }`}
            >
              <Laptop className={`size-5 ${theme === "system" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">System Synced</p>
                <p className="text-[11px] text-muted-foreground">Matches OS appearance</p>
              </div>
            </button>
          </div>
        </div>

        {/* UI Density */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <label className="text-xs font-semibold text-foreground">Display Density</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDensityChange("comfortable")}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                uiDensity === "comfortable"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border/80 bg-background/50 hover:bg-muted/40"
              }`}
            >
              <p className="text-xs font-semibold text-foreground">Comfortable</p>
              <p className="text-[11px] text-muted-foreground">Standard touch-friendly spacing and generous padding.</p>
            </button>

            <button
              type="button"
              onClick={() => handleDensityChange("compact")}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                uiDensity === "compact"
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border/80 bg-background/50 hover:bg-muted/40"
              }`}
            >
              <p className="text-xs font-semibold text-foreground">Compact</p>
              <p className="text-[11px] text-muted-foreground">Tight padding optimized for scanning high density medication tables.</p>
            </button>
          </div>
        </div>

        {/* Motion Preference */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <MoveHorizontal className="size-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Reduce Motion</p>
              <p className="text-[11px] text-muted-foreground">
                Minimize micro-animations and smooth transition effects across the interface.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => handleReduceMotionToggle(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
        </div>
      </div>

      {/* Live Sample Card Preview */}
      <div className="rounded-2xl border border-dashed border-border p-6 bg-card/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Live Preview
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-2 max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Metformin · 500 mg</span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Taken 8:02 AM
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Next dose scheduled for 8:00 PM with dinner.
          </p>
        </div>
      </div>
    </div>
  );
}
