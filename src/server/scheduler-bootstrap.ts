import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { startScheduler } from "@/server/domain/jobs/scheduler";

/**
 * Node-only half of the instrumentation hook — the only module that may touch `pg`.
 *
 * It is split out of `instrumentation.ts` on purpose: Next.js compiles that file for *both*
 * the Node and the Edge runtime, and the Edge pass cannot bundle `pg` (`pg-connection-string`
 * calls `require("fs")` at module scope, and the edge sandbox has no `fs`). A `NEXT_RUNTIME`
 * guard inside `register()` does not save us, because webpack resolves the whole import graph
 * before it ever evaluates the branch. Keeping the graph behind one dynamic import lets
 * `next.config.ts` swap this module for an empty stub in the Edge pass.
 */
export function bootstrapScheduler(): { stop: () => void } {
  const handle = startScheduler(db);
  log.info("Reminder scheduler started", { intervalMs: 15_000 });
  return handle;
}
