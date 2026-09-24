"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Phase 06 — better-auth/react client used by auth forms and session-aware UI
 * (plan §14). `useSession` is the reactive cache for UI visibility; every
 * protected procedure still re-checks the session server-side.
 */
export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;