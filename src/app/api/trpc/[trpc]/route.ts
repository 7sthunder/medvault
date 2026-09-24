import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/root";

/**
 * Phase 06 — tRPC HTTP handler at `/api/trpc/*` (fetch adapter). The superjson
 * transformer is configured once on the router (`initTRPC.create({ transformer })`)
 * and inherited here.
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };