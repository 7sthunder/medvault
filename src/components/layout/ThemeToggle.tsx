"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import type { AppearanceSettingsDTO } from "@/shared/types";
import type { Theme } from "@/shared/enums";

/** Resolve the effective (light/dark) theme from stored appearance + OS preference. */
function effectiveTheme(
  appearance: AppearanceSettingsDTO | null | undefined,
  prefersDark: boolean,
): "light" | "dark" {
  if (!appearance) return prefersDark ? "dark" : "light";
  if (appearance.theme === "system") return prefersDark ? "dark" : "light";
  return appearance.theme;
}

/**
 * Dark mode toggle that lives in the top nav next to the profile icon.
 *
 * Toggles the `.dark` class on `<html>` immediately (no flash) and persists the
 * choice to the user's appearance settings via tRPC so it survives a reload.
 */
export function ThemeToggle() {
  const query = api.settings.appearance.useQuery();
  const update = api.settings.updateAppearance.useMutation({
    onSuccess: () => {
      void query.refetch();
    },
  });

  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = effectiveTheme(query.data, prefersDark);
  const next: Theme = current === "dark" ? "light" : "dark";

  const handleClick = () => {
    if (!query.data) return; // need the full appearance record to persist
    const willBeDark = next === "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", willBeDark);
    root.style.colorScheme = willBeDark ? "dark" : "light";
    update.mutate({ ...query.data, theme: next });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={update.isPending || !query.data}
      aria-label={current === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={current === "dark" ? "Light mode" : "Dark mode"}
    >
      {current === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
