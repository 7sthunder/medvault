import { z } from "zod";
import { NOTIFICATION_TABS } from "../enums";
import { uuidSchema } from "./common";

export const listNotificationsSchema = z.object({
  tab: z.enum(NOTIFICATION_TABS).default("all"),
  unreadOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const markReadSchema = z.object({
  notificationId: uuidSchema,
});

export const markAllReadSchema = z.object({}).optional();

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
