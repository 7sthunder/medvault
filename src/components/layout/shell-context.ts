"use client";

import { createContext, useContext } from "react";

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