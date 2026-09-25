/**
 * Phase 19 — Dose history and audit domain service (plan §11.10, §10.3).
 *
 * Provides query capabilities across append-only `dose_actions` joined with
 * `dose_events` and `medications` (preserving archived medication snapshots).
 * Supports cursor-based pagination and filtering by date range, medication, and action type.
 */

import { and, desc, eq, gte, lte, or, lt, sql } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { doseActions, doseEvents, medications } from "@/server/db/schema";
import { toDoseActionDTO } from "@/server/domain/doseEvents/mapper";
import type { DoseActionDTO } from "@/shared/types";
import { historyQuerySchema, type HistoryQueryInput } from "@/shared/validations/history";

export interface HistoryQueryResponse {
  items: DoseActionDTO[];
  nextCursor: string | null;
  totalCount: number;
}

export function encodeHistoryCursor(occurredAt: Date, id: string): string {
  const payload = { t: occurredAt.toISOString(), id };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeHistoryCursor(cursor: string): { occurredAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as { t?: string; id?: string };
    if (parsed && typeof parsed.t === "string" && typeof parsed.id === "string") {
      const d = new Date(parsed.t);
      if (!Number.isNaN(d.getTime())) {
        return { occurredAt: d, id: parsed.id };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function queryDoseHistory(
  db: Db | DbTx,
  userId: string,
  rawFilter?: HistoryQueryInput,
): Promise<HistoryQueryResponse> {
  const filter = historyQuerySchema.parse(rawFilter ?? {});
  const limit = filter.limit;

  // 1. Base filter conditions (shared by total count and items query)
  const baseConditions = [eq(doseActions.userId, userId)];

  if (filter?.from) {
    baseConditions.push(gte(doseActions.occurredAt, filter.from));
  }
  if (filter?.to) {
    baseConditions.push(lte(doseActions.occurredAt, filter.to));
  }
  if (filter?.action && filter.action !== "all") {
    baseConditions.push(eq(doseActions.action, filter.action));
  }
  if (filter?.medicationId) {
    baseConditions.push(eq(doseEvents.medicationId, filter.medicationId));
  }

  // 2. Count total records matching base filters
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(doseActions)
    .innerJoin(doseEvents, eq(doseActions.doseEventId, doseEvents.id))
    .where(and(...baseConditions));

  const totalCount = countResult[0]?.count ?? 0;

  // 3. Apply cursor pagination condition if present
  const queryConditions = [...baseConditions];
  if (filter?.cursor) {
    const cursorData = decodeHistoryCursor(filter.cursor);
    if (cursorData) {
      queryConditions.push(
        or(
          lt(doseActions.occurredAt, cursorData.occurredAt),
          and(
            eq(doseActions.occurredAt, cursorData.occurredAt),
            lt(doseActions.id, cursorData.id),
          ),
        )!,
      );
    }
  }

  // 4. Query items (fetching limit + 1 to detect next page)
  const rows = await db
    .select({
      action: doseActions,
      event: {
        status: doseEvents.status,
        scheduledFor: doseEvents.scheduledFor,
        medicationId: doseEvents.medicationId,
      },
      medication: medications,
    })
    .from(doseActions)
    .innerJoin(doseEvents, eq(doseActions.doseEventId, doseEvents.id))
    .innerJoin(medications, eq(doseEvents.medicationId, medications.id))
    .where(and(...queryConditions))
    .orderBy(desc(doseActions.occurredAt), desc(doseActions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slicedRows = hasMore ? rows.slice(0, limit) : rows;

  const items = slicedRows.map((r) =>
    toDoseActionDTO(r.action, r.event, r.medication),
  );

  let nextCursor: string | null = null;
  if (hasMore && slicedRows.length > 0) {
    const lastRow = slicedRows[slicedRows.length - 1];
    if (lastRow) {
      nextCursor = encodeHistoryCursor(
        lastRow.action.occurredAt instanceof Date
          ? lastRow.action.occurredAt
          : new Date(lastRow.action.occurredAt),
        lastRow.action.id,
      );
    }
  }

  return {
    items,
    nextCursor,
    totalCount,
  };
}
