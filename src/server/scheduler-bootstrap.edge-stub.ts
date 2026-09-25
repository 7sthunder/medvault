/**
 * Edge-pass stand-in for `@/server/scheduler-bootstrap`.
 *
 * `next.config.ts` aliases the real module to this file for the Edge compilation, so webpack
 * never walks into `pg` → `pg-connection-string` → `require("fs")` and the build stops
 * failing. `register()` returns before the dynamic import on the Edge runtime, so nothing
 * here is ever executed — the throw only exists to surface an accidental call loudly.
 */
export function bootstrapScheduler(): { stop: () => void } {
  throw new Error("bootstrapScheduler is Node-only and must not run on the Edge runtime");
}
