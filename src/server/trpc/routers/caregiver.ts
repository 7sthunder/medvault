import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import { caregiverService, AuthGateError, InviteError } from "@/server/domain/caregiver/service";
import {
  caregiverAcceptSchema,
  caregiverAlertActionSchema,
  caregiverInviteSchema,
  caregiverUpdatePermissionsSchema,
} from "@/shared/validations/caregiver";
import { protectedProcedure, router } from "../trpc";

/**
 * Phase 17 — caregiver router (§10.6/§11.12). Patient-scope procedures talk about the
 * caller's own relationships; caregiver-scope procedures take the target patient's userId
 * as input and run through `requireCaregiverAccess` so a revoked/excluded user can never
 * reach another patient's data (AuthGateError → FORBIDDEN).
 */
export const caregiverRouter = router({
  /** §11.12 patient invites a caregiver (email + message + permissions). */
  invite: protectedProcedure
    .input(caregiverInviteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await caregiverService.invite(ctx.db, ctx.user.id, input);
      } catch (error) {
        throw mapInviteError(error);
      }
    }),

  /** Caregiver redeems an invitation token → active relationship (auto-accept). */
  accept: protectedProcedure
    .input(caregiverAcceptSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.transaction((tx) => caregiverService.accept(tx, ctx.user.id, input.token));
      } catch (error) {
        throw mapInviteError(error, "BAD_REQUEST");
      }
    }),

  /** §11.12 accept page — non-sensitive preview of a pending invitation by token. */
  preview: protectedProcedure
    .input(caregiverAcceptSchema)
    .query(async ({ ctx, input }) => caregiverService.previewByToken(ctx.db, input.token)),

  /** §11.12 aggregated overview for both roles (patient + caregiver + invitations). */
  overview: protectedProcedure.query(async ({ ctx }) => caregiverService.overview(ctx.db, ctx.user.id)),

  /** Patient edits a caregiver's permissions on an active relationship. */
  updatePermissions: protectedProcedure
    .input(caregiverUpdatePermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await caregiverService.updatePermissions(ctx.db, ctx.user.id, input.relationshipId, input.permissions);
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  revoke: protectedProcedure
    .input(z.object({ relationshipId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await caregiverService.revoke(ctx.db, ctx.user.id, input.relationshipId);
        return { ok: true };
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  leave: protectedProcedure
    .input(z.object({ relationshipId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await caregiverService.leave(ctx.db, ctx.user.id, input.relationshipId);
        return { ok: true };
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  revokeInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await caregiverService.revokeInvitation(ctx.db, ctx.user.id, input.invitationId);
        return { ok: true };
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  /** Caregiver reads one patient they actively care for (permission-gated). */
  patientOverview: protectedProcedure
    .input(z.object({ patientUserId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const rel = await caregiverService.requireCaregiverAccess(ctx.db, ctx.user.id, input.patientUserId);
        if (!rel) throw new AuthGateError("You are not an active caregiver for this patient.");
        const [patient] = await ctx.db
          .select({ timezone: users.timezone })
          .from(users)
          .where(eq(users.id, input.patientUserId))
          .limit(1);
        const timeZone = patient?.timezone ?? ctx.user.timezone ?? "UTC";
        return await caregiverService.patientOverview(ctx.db, ctx.user.id, input.patientUserId, timeZone);
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  /** Caregiver alert list for a patient they care for. */
  patientAlerts: protectedProcedure
    .input(z.object({ patientUserId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const rel = await caregiverService.requireCaregiverAccess(ctx.db, ctx.user.id, input.patientUserId);
        if (!rel) throw new AuthGateError("You are not an active caregiver for this patient.");
        return await caregiverService.listPatientAlerts(ctx.db, ctx.user.id, input.patientUserId);
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  alertDetail: protectedProcedure
    .input(z.object({ alertId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const detail = await caregiverService.alertDetail(ctx.db, ctx.user.id, input.alertId);
        if (!detail) throw new AuthGateError("Alert not found.");
        return detail;
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),

  alertAction: protectedProcedure
    .input(caregiverAlertActionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await caregiverService.alertAction(ctx.db, ctx.user.id, input.alertId, input.action);
      } catch (error) {
        throw mapAuthGateError(error);
      }
    }),
});

function mapInviteError(error: unknown, code: "CONFLICT" | "BAD_REQUEST" = "CONFLICT"): TRPCError {
  if (error instanceof InviteError) return new TRPCError({ code, message: error.message });
  if (error instanceof AuthGateError) return new TRPCError({ code: "FORBIDDEN", message: error.message });
  if (error instanceof TRPCError) return error;
  throw error;
}

function mapAuthGateError(error: unknown): TRPCError {
  if (error instanceof AuthGateError) return new TRPCError({ code: "FORBIDDEN", message: error.message });
  if (error instanceof TRPCError) return error;
  throw error;
}
