/**
 * Next.js instrumentation hook — runs once when the server process boots.
 *
 * This is what actually starts the reconcile/push scheduler. Without it `startScheduler` is dead
 * code and a reminder only appears when the user happens to load a page after its window opens.
 *
 * Guarded on `NEXT_RUNTIME === "nodejs"`: the edge runtime has no `setInterval` guarantee and no
 * Postgres socket, and a duplicate interval would double-fire pushes.
 *
 * NOTE: this module must stay free of static Node-only imports. Next.js compiles
 * `instrumentation.ts` for the edge runtime as well as Node, and the edge pass cannot resolve
 * `fs`/`net`/`tls`. The guard above is not sufficient on its own — webpack resolves the import
 * graph before it evaluates the branch — so all Node-only code hangs off the single dynamic
 * import below, which `next.config.ts` aliases to `scheduler-bootstrap.edge-stub.ts` for edge.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.MEDITRACKAI_DISABLE_SCHEDULER === "1") return;

  // Next.js dev re-evaluates modules on hot reload; a globalThis singleton keeps exactly one
  // interval alive per process.
  const globals = globalThis as typeof globalThis & {
    __meditrackaiScheduler?: { stop: () => void };
  };
  if (globals.__meditrackaiScheduler) return;

  const { bootstrapScheduler } = await import("@/server/scheduler-bootstrap");
  globals.__meditrackaiScheduler = bootstrapScheduler();
}
