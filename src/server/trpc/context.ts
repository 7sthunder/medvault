import type { inferAsyncReturnType } from "@trpc/server";
import { headers } from "next/headers";

import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";

/**
 * Phase 06 — tRPC context (plan §14): resolves the Better Auth session from
 * request headers so every procedure sees `{ user, session, db }`.
 */
export async function createContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  return {
    db,
    user: session?.user ?? null,
    session: session?.session ?? null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;