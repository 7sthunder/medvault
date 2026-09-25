"use client";

import { useEffect, useLayoutEffect } from "react";

import type { AppearanceSettingsDTO } from "@/shared/types";

/**
 * Phase 18 — appearance application (§11.14 / §5.7).
 *
 * Appearance is applied straight to `<html>` as data attributes so the Tailwind token set in
 * `globals.css` reacts with zero re-render:
 *  - `class="dark"`            → the `.dark` token block
 *  - `data-density="compact"`  → spacing scale
 *  - `data-reduce-motion`      → animation kill-switch
 *
 * Kept as pure functions plus a tiny controller so the logic is unit-testable without a DOM
 * framework, and so the settings panel can preview a change on a sample card before saving.
 */

/** Resolve `theme` against the OS preference. Pure — safe to unit test. */
export function resolveTheme(theme: AppearanceSettingsDTO["theme"], prefersDark: boolean): "light" | "dark" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

/** Class list `<html>` should carry for the given appearance. Pure. */
export function appearanceClassName(appearance: AppearanceSettingsDTO, prefersDark: boolean): string {
  return resolveTheme(appearance.theme, prefersDark) === "dark" ? "dark" : "";
}

function applyToDocument(appearance: AppearanceSettingsDTO, prefersDark: boolean): void {
  const root = document.documentElement;
  const dark = resolveTheme(appearance.theme, prefersDark) === "dark";

  root.classList.toggle("dark", dark);
  // Tells the browser to render native controls (scrollbars, form widgets) dark too.
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.density = appearance.uiDensity;
  if (appearance.reduceMotion) root.dataset.reduceMotion = "true";
  else delete root.dataset.reduceMotion;
}

/**
 * Applies (and keeps applying) the persisted appearance.
 *
 * `useLayoutEffect` runs before paint on the client so a dark-theme user never sees a white
 * flash; the `system` theme additionally subscribes to the OS preference so switching the
 * laptop to dark mode re-themes the app live.
 */
export function AppearanceController({ appearance }: { appearance: AppearanceSettingsDTO }) {
  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyToDocument(appearance, media.matches);
    sync();
    if (appearance.theme !== "system") return;
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [appearance]);

  return null;
}

/** Client-only mirror of `AppearanceController` for panels that preview un-saved values. */
export function usePreviewAppearance(appearance: AppearanceSettingsDTO | null): void {
  useEffect(() => {
    if (!appearance) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    applyToDocument(appearance, media.matches);
  }, [appearance]);
}
