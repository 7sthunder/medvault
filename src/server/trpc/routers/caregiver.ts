/**
 * Phase 21 — Caregiver tRPC Router (plan §10.6, §11.12, §21).
 *
 * Implements:
 * - Patient scope: invite, list invitations, revoke invitations, list caregivers, update permissions, revoke caregiver.
 * - Caregiver scope: inspect invitation, accept invitation, list monitored patients, patient overview, alert feed, alert status update.
 * - Seam hook: registers missed dose handler to automatically create caregiver alerts.
 */

import { z } from "zod";
import { db } from "@/server/db/client";
import * as caregiverService from "@/server/domain/caregiver/service";
import { registerMissedDoseHandlers } from "@/server/domain/doseEvents/attachments";
import {
  caregiverAcceptSchema,
  caregiverAlertActionSchema,
  caregiverInviteSchema,
  caregiverRevokeSchema,
  caregiverUpdatePermissionsSchema,
} from "@/shared/validations/caregiver";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// ── Hook registration (side-effect connection into Phase 13 missed-dose seam) ──
registerMissedDoseHandlers(async (ctx) => {
  try {
    await caregiverService.createMissedDoseAlerts(db, ctx);
  } catch (err) {
    console.error("Failed to generate caregiver missed dose alerts:", err);
  }
});

export const caregiverRouter = router({
  /* ── Patient procedures ─────────────────────────────────────────────────── */

  invite: protectedProcedure
    .input(caregiverInviteSchema)
    .mutation(async ({ ctx, input }) => {
      return caregiverService.inviteCaregiver(ctx.db, ctx.user.id, input);
    }),

  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    return caregiverService.listPatientInvitations(ctx.db, ctx.user.id);
  }),

  revokeInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return caregiverService.revokeInvitation(ctx.db, ctx.user.id, input.invitationId);
    }),

  listCaregivers: protectedProcedure.query(async ({ ctx }) => {
    return caregiverService.listPatientCaregivers(ctx.db, ctx.user.id);
  }),

  updatePermissions: protectedProcedure
    .input(caregiverUpdatePermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      return caregiverService.updateCaregiverPermissions(
        ctx.db,
        ctx.user.id,
        input.relationshipId,
        input.permissions,
      );
    }),

  revokeCaregiver: protectedProcedure
    .input(caregiverRevokeSchema)
    .mutation(async ({ ctx, input }) => {
      return caregiverService.revokeRelationship(ctx.db, ctx.user.id, input.relationshipId);
    }),

  /* ── Caregiver procedures ───────────────────────────────────────────────── */

  getInvitation: publicProcedure
    .input(caregiverAcceptSchema)
    .query(async ({ ctx, input }) => {
      return caregiverService.getInvitationByToken(ctx.db, input.token);
    }),

  acceptInvitation: protectedProcedure
    .input(caregiverAcceptSchema)
    .mutation(async ({ ctx, input }) => {
      return caregiverService.acceptInvitation(ctx.db, ctx.user.id, input.token);
    }),

  listPatients: protectedProcedure.query(async ({ ctx }) => {
    return caregiverService.listMonitoredPatients(ctx.db, ctx.user.id);
  }),

  patientOverview: protectedProcedure
    .input(z.object({ patientUserId: z.string() }))
    .query(async ({ ctx, input }) => {
      return caregiverService.getMonitoredPatientOverview(
        ctx.db,
        ctx.user.id,
        input.patientUserId,
      );
    }),

  listAlerts: protectedProcedure
    .input(
      z
        .object({
          patientUserId: z.string().optional(),
          status: z.enum(["new", "acknowledged", "resolved"]).optional(),
          limit: z.number().int().positive().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return caregiverService.listCaregiverAlerts(ctx.db, ctx.user.id, input);
    }),

  getAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .query(async ({ ctx, input }) => {
      return caregiverService.getCaregiverAlert(ctx.db, ctx.user.id, input.alertId);
    }),

  updateAlert: protectedProcedure
    .input(caregiverAlertActionSchema)
    .mutation(async ({ ctx, input }) => {
      return caregiverService.updateAlertStatus(
        ctx.db,
        ctx.user.id,
        input.alertId,
        input.action,
      );
    }),

  leavePatient: protectedProcedure
    .input(caregiverRevokeSchema)
    .mutation(async ({ ctx, input }) => {
      return caregiverService.revokeRelationship(ctx.db, ctx.user.id, input.relationshipId);
    }),

  connectWithCode: protectedProcedure
    .input(
      z.object({
        accessCode: z.string().min(1, "Access code is required"),
        relationType: z.enum(["family", "professional", "friend", "other"]).default("family"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return caregiverService.connectWithAccessCode(
        ctx.db,
        ctx.user.id,
        input.accessCode,
        input.relationType,
      );
    }),
});
