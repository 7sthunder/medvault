/**
 * Phase 07 — caregiver contracts (plan §13 `caregiverSchema`, §10.6/§11.12).
 * Permissions object is validated on invite, accept, revoke and permission updates.
 */

import { z } from "zod";

import { CAREGIVER_MESSAGE_MAX } from "../constants";
import { RELATION_TYPES } from "../enums";
import { emailSchema, uuidSchema } from "./common";

export const caregiverPermissionsSchema = z.object({
  viewAdherence: z.boolean().default(true),
  viewMedications: z.boolean().default(false),
  receiveMissedDoseAlerts: z.boolean().default(true),
  receiveInsights: z.boolean().default(false),
  canAcknowledgeAlerts: z.boolean().default(true),
});

export const caregiverInviteSchema = z.object({
  email: emailSchema,
  message: z
    .string()
    .trim()
    .max(CAREGIVER_MESSAGE_MAX, `Message must be at most ${CAREGIVER_MESSAGE_MAX} characters.`)
    .optional(),
  relationType: z.enum(RELATION_TYPES),
  permissions: caregiverPermissionsSchema,
});

export const caregiverAcceptSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required.").max(200),
});

export const caregiverUpdatePermissionsSchema = z.object({
  relationshipId: uuidSchema,
  permissions: caregiverPermissionsSchema,
});

export const caregiverRevokeSchema = z.object({ relationshipId: uuidSchema });

export const caregiverAlertActionSchema = z.object({
  alertId: uuidSchema,
  action: z.enum(["acknowledge", "resolve"]),
});

export type CaregiverInviteInput = z.infer<typeof caregiverInviteSchema>;
export type CaregiverPermissionsInput = z.infer<typeof caregiverPermissionsSchema>;