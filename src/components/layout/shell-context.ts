"use client";

import { createContext, useContext, useMemo } from "react";

import { withBasePath } from "@/components/layout/nav-model";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  timezone: string;
  onboardingCompleted: boolean;
}

export interface ShellState {
  pathname: string;
  user: ShellUser;
  /**
   * Phase 18 (§10.8) — true when the shell is rendering the shared demo workspace rather than a
   * real account. Set by the `/demo` layout; `undefined` everywhere else. The shell uses it to
   * swap account controls for a demo chip so nobody mistakes sample data for their own.
   */
  isDemo?: boolean;
  /**
   * Phase 18 (§10.8) — when set, every nav href is resolved under this prefix. The demo workspace
   * sets it to `/demo/workspace` so it can reuse the real screens without forking the nav.
   */
  basePath?: string;
}

export const ShellContext = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <AppShell>");
  return ctx;
}

/**
 * Phase 19 — build an in-app href for the shell you are actually inside.
 *
 * The nav chrome already routed through `withBasePath`, but every `router.push` in a feature
 * screen was a hardcoded `/medications/new`, which silently ejected a visitor out of
 * `/demo/workspace` and into the signed-in app. Every push/Link in a feature should go through
 * this so the demo workspace stays self-contained.
 */
export function useAppHref(): (href: string) => string {
  const { basePath } = useShell();
  return useMemo(() => (href: string) => withBasePath(href, basePath), [basePath]);
}
