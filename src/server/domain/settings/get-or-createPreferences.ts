import { eq } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { userPreferences } from "@/server/db/schema";
import {
  MAX_SNOOZES_DEFAULT,
  MISSED_AFTER_DEFAULT,
  REMINDER_BEFORE_DEFAULT,
  SNOOZE_MIN_DEFAULT,
} from "@/shared/constants";

/**
 * Phase 10 — owner-scoped reminder defaults for `user_preferences` (§8.13).
 * Onboarding writes the four global reminder numbers; settings reads them later.
 * Upsert semantics: a missing row is created with the given defaults (falling
 * back to the §10.3 engine defaults); an existing row is updated so a repeat
 * onboarding/submit always reflects the latest values.
 */

export interface ReminderDefaultsInput {
  missedAfterMinutes: number;
  snoozeMinutes: number;
  maxSnoozes: number;
  reminderBeforeMinutes: number;
}

export const DEFAULT_REMINDER_DEFAULTS: ReminderDefaultsInput = {
  missedAfterMinutes: MISSED_AFTER_DEFAULT,
  snoozeMinutes: SNOOZE_MIN_DEFAULT,
  maxSnoozes: MAX_SNOOZES_DEFAULT,
  reminderBeforeMinutes: REMINDER_BEFORE_DEFAULT,
};

export async function getOrCreatePreferences(
  db: Db | DbTx,
  userId: string,
  defaults: ReminderDefaultsInput,
) {
  const [row] = await db
    .insert(userPreferences)
    .values({ userId, ...defaults })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...defaults, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function getPreferences(db: Db | DbTx, userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}
