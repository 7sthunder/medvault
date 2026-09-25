import { uuidv7 } from "@/server/db/helpers";
import type { Db, DbTx } from "@/server/db/helpers";
import { notifications } from "@/server/db/schema";
import type { NotificationType } from "@/shared/enums";
import type { NotifDTO } from "@/shared/types";
import { now } from "@/shared/times";

export interface NotificationPayload {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: "medication" | "doseEvent" | "insight" | "caregiverAlert" | null;
  entityId?: string | null;
}

export interface NotificationChannel {
  name: string;
  deliver(db: Db | DbTx, payload: NotificationPayload): Promise<NotifDTO | null>;
}

export class InAppNotificationChannel implements NotificationChannel {
  name = "in-app";

  async deliver(db: Db | DbTx, payload: NotificationPayload): Promise<NotifDTO> {
    const id = payload.id ?? uuidv7();
    const createdAt = now();

    const insertBuilder = db
      .insert(notifications)
      .values({
        id,
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        readAt: null,
        createdAt,
      });

    if (typeof (insertBuilder as { returning?: unknown }).returning === "function") {
      const [row] = await insertBuilder.returning();
      if (!row) {
        throw new Error("Failed to insert notification record.");
      }
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        entityType: row.entityType as NotifDTO["entityType"],
        entityId: row.entityId,
        readAt: row.readAt,
        createdAt: row.createdAt,
      };
    }

    await insertBuilder;

    return {
      id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      entityType: (payload.entityType ?? null) as NotifDTO["entityType"],
      entityId: payload.entityId ?? null,
      readAt: null,
      createdAt,
    };
  }
}

export class ConsoleNotificationChannel implements NotificationChannel {
  name = "console";

  async deliver(_db: Db | DbTx, payload: NotificationPayload): Promise<null> {
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      console.log(`[Notification delivered via console] To: ${payload.userId} | [${payload.type}] ${payload.title} - ${payload.body}`);
    }
    return null;
  }
}

export const defaultChannels: NotificationChannel[] = [
  new InAppNotificationChannel(),
  new ConsoleNotificationChannel(),
];
