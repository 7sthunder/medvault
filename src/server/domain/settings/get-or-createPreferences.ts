import { eq } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { userPreferences } from "@/server/db/schema";

export type UserPreferencesRecord = typeof userPreferences.$inferSelect;
export type UserPreferencesInsert = typeof userPreferences.$inferInsert;

/**
 * Phase 10 — get-or-create pattern for user_preferences (plan §8.13).
 * Ensures every user always has a backed preferences row with valid defaults.
 */
export async function getOrCreatePreferences(
  db: Db | DbTx,
  userId: string,
  defaults?: Partial<Omit<UserPreferencesInsert, "userId">>,
): Promise<UserPreferencesRecord> {
  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const [created] = await db
    .insert(userPreferences)
    .values({
      userId,
      theme: "light",
      missedAfterMinutes: defaults?.missedAfterMinutes ?? 30,
      snoozeMinutes: defaults?.snoozeMinutes ?? 10,
      maxSnoozes: defaults?.maxSnoozes ?? 3,
      reminderBeforeMinutes: defaults?.reminderBeforeMinutes ?? 5,
      reduceMotion: defaults?.reduceMotion ?? false,
      uiDensity: defaults?.uiDensity ?? "comfortable",
      updatedAt: new Date(),
    })
    .returning();

  return created!;
}

/**
 * Upsert preferences for a user (onboarding completion or settings update).
 */
export async function upsertPreferences(
  db: Db | DbTx,
  userId: string,
  values: Partial<Omit<UserPreferencesInsert, "userId">>,
): Promise<UserPreferencesRecord> {
  const [row] = await db
    .insert(userPreferences)
    .values({
      userId,
      theme: "light",
      missedAfterMinutes: 30,
      snoozeMinutes: 10,
      maxSnoozes: 3,
      reminderBeforeMinutes: 5,
      reduceMotion: false,
      uiDensity: "comfortable",
      ...values,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        ...values,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row!;
}
