"use client";

import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import superjson from "superjson";

import type { AppRouter } from "@/server/trpc/root";

/**
 * Shared tRPC client + React Query provider (phase 08 hand-off; now shared infra
 * committed on `main` so every track codes against ONE client).
 *
 * OWNERSHIP: this file is FROZEN on main — no branch edits it. `AppRouter` is
 * inferred from `root.ts`, so per-track routers (which each track registers in
 * its own `routers/<track>.ts`) show up in `api.<trackRouter>.*` types on the
 * branch that owns them.
 */
export const api = createTRPCReact<AppRouter>();

export interface TRPCProviderProps {
  children: ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}