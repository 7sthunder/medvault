/**
 * Phase 16 — history domain (§11.10). The append-only `dose_actions` log joined with the
 * current medication snapshot (soft-delete keeps the row, so archived meds render with a
 * stable name) and the event's resolved status for filter/rendering. Cursor-paginated by
 * `occurredAt`; owner-scoped; range + med + status filters all optional.
 */

import { and, desc, eq, gte, inArray, lt, lte } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { doseActions, doseEvents, medications } from "@/server/db/schema";
import { HISTORY_PAGE_SIZE } from "@/shared/constants";
import type { DoseEventStatus } from "@/shared/enums";
import { combineDateAndTime, localDateKey } from "@/shared/times";
import type { HistoryPageDTO } from "@/shared/types";

import { toDoseActionDTO, toMedicationLiteMap } from "../doseEvents/mapper";

export interface HistoryQuery {
  from?: string;
  to?: string;
  medicationId?: string;
  status?: DoseEventStatus;
  cursor?: string;
  limit?: number;
}

type FilterableStatus = "taken" | "missed" | "skipped" | "snoozed";

function resolveStatus(status: string): FilterableStatus | null {
  if (status === "taken" || status === "missed" || status === "skipped" || status === "snoozed") {
    return status;
  }
  return null;
}

/** Start/end instants for the range keys (inclusive local-day window, user TZ). */
function rangeBounds(timeZone: string, from?: string, to?: string): { start?: Date; end?: Date } {
  const start = from ? combineDateAndTime(from, "00:00", timeZone) : undefined;
  const end = to ? combineDateAndTime(localDateKey(combineDateAndTime(to, "23:59", timeZone), timeZone), "23:59", timeZone) : undefined;
  return { start, end };
}

export const historyService = {
  /**
   * §11.10 `history.query` — newest-first cursor page of `dose_actions` for the user.
   * `snoozed` maps to `due`/`snoozed` events (snoozeCount > 0) since events can be snoozed
   * while the final status is `taken`. Archived meds still resolve (soft-delete).
   */
  async query(db: DbClient, userId: string, timeZone: string, q: HistoryQuery): Promise<HistoryPageDTO> {
    const { start, end } = rangeBounds(timeZone, q.from, q.to);
    const where = [eq(doseActions.userId, userId)];
    if (start) where.push(gte(doseActions.occurredAt, start));
    if (end) where.push(lte(doseActions.occurredAt, end));
    if (q.cursor) where.push(lt(doseActions.occurredAt, new Date(q.cursor)));
    if (q.medicationId) {
      where.push(eq(doseActions.doseEventId, doseEvents.id), eq(doseEvents.medicationId, q.medicationId));
    }

    const status = resolveStatus(q.status ?? "");
    if (status) {
      where.push(eq(doseActions.doseEventId, doseEvents.id));
      if (status === "snoozed") {
        // Snoozes are audit rows; the event resolves to taken/missed later.
        where.push(eq(doseActions.action, "snooze"));
      } else {
        // Filter on the event's final resolved status (take-late events are `taken`).
        where.push(eq(doseEvents.status, status));
      }
    }

    const limit = q.limit ?? HISTORY_PAGE_SIZE;
    const rows = await db
      .select({ action: doseActions, event: doseEvents })
      .from(doseActions)
      .leftJoin(doseEvents, eq(doseActions.doseEventId, doseEvents.id))
      .where(and(...where))
      .orderBy(desc(doseActions.occurredAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    const medIds = [...new Set(page.map((r) => r.event?.medicationId).filter(Boolean))] as string[];
    const meds = medIds.length
      ? await db.select().from(medications).where(inArray(medications.id, medIds))
      : [];
    const medMap = toMedicationLiteMap(meds);

    const items = page
      .map((r) =>
        r.event
          ? toDoseActionDTO(r.action, medMap.get(r.event.medicationId)!, {
              eventStatus: r.event.status,
              eventScheduledFor: r.event.scheduledFor,
            })
          : null,
      )
      .filter((dto): dto is NonNullable<typeof dto> => Boolean(dto?.medication));

    const nextCursor = hasMore && items.length > 0 ? new Date(items[items.length - 1]!.occurredAt).toISOString() : null;
    return { items, nextCursor };
  },
};