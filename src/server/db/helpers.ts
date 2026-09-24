import { randomBytes } from "node:crypto";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

/** Migrated `drizzle` client type (client.ts) — accepted by seed helpers. */
export type Db = NodePgDatabase<typeof schema>;
/** Transaction client type handed to `db.transaction` callbacks. */
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * RFC 9562 UUIDv7 — time-ordered so IDs sort by creation. Used for every `id text primary key`.
 * Falls back through the same crypto source as `crypto.randomUUID()`.
 */
export function uuidv7(): string {
  const bytes = randomBytes(16);
  const ms = BigInt(Date.now());
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n) & 0xffn);
  bytes[5] = Number(ms & 0xffn);
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** UTC date key `YYYY-MM-DD` for a given instant (seed + calendar-day grouping). */
export function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Shift a date by whole days, keeping the time-of-day. */
export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Local `HH:mm` on a day (modelled in UTC for deterministic seeds). */
export function atTime(d: Date, hh: number, mm: number): Date {
  const out = new Date(d);
  out.setUTCHours(hh, mm, 0, 0);
  return out;
}

/** Build a local `HH:mm` text for a store-dedicated time-of-day. */
export function hhmm(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * Safe upsert of a user by unique `users.email`. Returns the stable id (existing row on
 * conflict, so children FK stays consistent across idempotent seeds).
 */
export async function upsertUser(
  db: Db | DbTx,
  input: Pick<typeof schema.users.$inferInsert, "name" | "email"> &
    Partial<Omit<typeof schema.users.$inferInsert, "id" | "name" | "email" | "createdAt" | "updatedAt">>,
): Promise<string> {
  const [row] = await db
    .insert(schema.users)
    .values({
      id: uuidv7(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: {
        name: input.name,
        updatedAt: new Date(),
      },
    })
    .returning({ id: schema.users.id });
  return row!.id;
}