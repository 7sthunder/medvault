/**
 * Missed-dose hooks (Phase 13 seam) — shared on `main`, FROZEN (nobody edits).
 *
 * aadhi's `reconcile.ts` CALLS `runMissedDoseHandlers` after auto-missing a dose;
 * hp registers handlers (notifications, caregiver alerts) from its own router
 * module (side-effect import) WITHOUT touching aadhi files.
 */
export interface MissedDoseContext {
  userId: string;
  medicationId: string;
  doseEventId: string;
  scheduledFor: Date;
}

export type MissedDoseHandler = (ctx: MissedDoseContext) => Promise<void> | void;

const handlers = new Set<MissedDoseHandler>();

export function registerMissedDoseHandlers(...next: MissedDoseHandler[]): void {
  for (const h of next) handlers.add(h);
}

export async function runMissedDoseHandlers(ctx: MissedDoseContext): Promise<void> {
  await Promise.allSettled([...handlers].map((h) => h(ctx)));
}

export function missedDoseHandlerCount(): number {
  return handlers.size;
}
