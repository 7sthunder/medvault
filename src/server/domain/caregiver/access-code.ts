import { randomBytes } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { users } from "@/server/db/schema";

/**
 * Generates an unambiguous, easy-to-read 6-character access code with 'MV-' prefix.
 * e.g., 'MV-8K2P9X'
 */
export function generateAccessCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude 0, 1, I, O to prevent confusion
  let code = "MV-";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      code += chars[byte % chars.length];
    }
  }
  return code;
}

/**
 * Ensures a user has a valid access code, assigning one if missing.
 */
export async function ensureUserAccessCode(db: Db | DbTx, userId: string): Promise<string> {
  const [user] = await db
    .select({ accessCode: users.accessCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.accessCode) {
    return user.accessCode;
  }

  let code = generateAccessCode();
  let assigned = false;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db
        .update(users)
        .set({ accessCode: code })
        .where(eq(users.id, userId));
      assigned = true;
      break;
    } catch {
      code = generateAccessCode();
    }
  }

  if (!assigned) {
    throw new Error("Failed to assign a unique access code.");
  }

  return code;
}

/**
 * Backfills any existing users who do not have an access code yet.
 */
export async function backfillAccessCodes(db: Db | DbTx): Promise<number> {
  const missingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.accessCode));

  let count = 0;
  for (const u of missingUsers) {
    let assigned = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const code = generateAccessCode();
        await db.update(users).set({ accessCode: code }).where(eq(users.id, u.id));
        assigned = true;
        count++;
        break;
      } catch {
        // Retry with a new code on rare collision
      }
    }
    if (!assigned) {
      console.error(`Could not assign code for user ${u.id}`);
    }
  }
  return count;
}
