/**
 * Next.js instrumentation hook — runs once when the server process boots.
 *
 * This is what actually starts the reconcile/push scheduler. Without it `startScheduler` is dead
 * code and a reminder only appears when the user happens to load a page after its window opens.
 *
 * Guarded on `NEXT_RUNTIME === "nodejs"`: the edge runtime has no `setInterval` guarantee and no
 * Postgres socket, and a duplicate interval would double-fire pushes.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.MEDVAULT_DISABLE_SCHEDULER === "1") return;

  // Next.js dev re-evaluates modules on hot reload; a globalThis singleton keeps exactly one
  // interval alive per process.
  const globals = globalThis as typeof globalThis & {
    __medvaultScheduler?: { stop: () => void };
  };
  if (globals.__medvaultScheduler) return;

  const { db } = await import("@/server/db/client");
  const { startScheduler } = await import("@/server/domain/jobs/scheduler");
  const { log } = await import("@/lib/log");

  const handle = startScheduler(db);
  globals.__medvaultScheduler = handle;
  log.info("Reminder scheduler started", { intervalMs: 15_000 });
}
