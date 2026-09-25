import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";

import { authClient } from "@/lib/auth";
import { TRPC_URL, api, trpcHeaders } from "@/lib/trpc";

/**
 * tRPC + React Query wiring.
 *
 * Identical to the web provider except the link: the web client uses a relative
 * `/api/trpc` because a browser is already on the origin, whereas a device needs the
 * absolute `TRPC_URL` plus the session cookie (see `trpcHeaders`).
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A medication app is used in bursts, often on patchy mobile data; showing
            // a cached dose list instantly and refetching behind it beats a spinner.
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: TRPC_URL,
          transformer: superjson,
          headers: trpcHeaders,
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

export { authClient };
