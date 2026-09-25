import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth/server";

/**
 * Phase 06 — Better Auth API surface under `/api/auth/*` (plan §14).
 */
export const { GET, POST } = toNextJsHandler(auth);
