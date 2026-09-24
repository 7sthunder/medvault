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
}

export const ShellContext = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <AppShell>");
  return ctx;
}