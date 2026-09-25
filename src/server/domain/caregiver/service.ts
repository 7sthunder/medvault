/**
 * Phase 17 — caregiver domain (§10.6). The STRONGEST authorization boundary in the app:
 * every caregiver-scope read/mutation is guarded by `requireCaregiverAccess`, which only
 * yields for an `active` relationship where the caller is the caregiver (permission gates
 * applied on top). Patients manage their own invitations/relationships; caregivers get a
 * read-only view of a specific patient; alerts are deduped once per (dose, relationship).
 */

import { randomBytes } from "node:crypto";

import { and, desc, eq, gte, inArray } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import {
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  doseActions,
  doseEvents,
  medications,
  userPreferences,
  users,
} from "@/server/db/schema";
import { INVITATION_TTL_DAYS, LIST_PAGE_SIZE } from "@/shared/constants";
import type { AlertStatus, CaregiverRelationshipStatus } from "@/shared/enums";
import { addLocalDays, combineDateAndTime, localDateKey, now } from "@/shared/times";
import { DEFAULT_CAREGIVER_PERMISSIONS } from "@/shared/types";
import type {
  CaregiverAlertDTO,
  CaregiverAlertDetailDTO,
  CaregiverInvitationDTO,
  CaregiverInvitationPreviewDTO,
  CaregiverInviteResultDTO,
  CaregiverOverviewDTO,
  CaregiverPatientDTO,
  CaregiverRelationshipDTO,
  CaregiverPermissions,
  PatientOverviewDTO,
} from "@/shared/types";
import type { CaregiverInviteInput } from "@/shared/validations/caregiver";

import { adherenceService } from "@/server/domain/adherence/service";
import { toDoseActionDTO } from "@/server/domain/doseEvents/mapper";
import type { MissedDoseRef } from "@/server/domain/doseEvents/producers";
import { medicationService } from "@/server/domain/medications/service";
import { notificationsService } from "@/server/domain/notifications/service";
import { scheduleService } from "@/server/domain/schedule/service";

type RelationshipRow = typeof caregiverRelationships.$inferSelect;
type InvitationRow = typeof caregiverInvitations.$inferSelect;
type AlertRow = typeof caregiverAlerts.$inferSelect;

const ACTIVE: CaregiverRelationshipStatus = "active";

/** Validate + normalise the permissions stored on a row (defaults on null). */
function permissionsOf(raw: unknown | null): CaregiverPermissions {
  const p = (raw ?? null) as Partial<CaregiverPermissions> | null;
  return {
    viewAdherence: p?.viewAdherence ?? DEFAULT_CAREGIVER_PERMISSIONS.viewAdherence,
    viewMedications: p?.viewMedications ?? DEFAULT_CAREGIVER_PERMISSIONS.viewMedications,
    receiveMissedDoseAlerts: p?.receiveMissedDoseAlerts ?? DEFAULT_CAREGIVER_PERMISSIONS.receiveMissedDoseAlerts,
    receiveInsights: p?.receiveInsights ?? DEFAULT_CAREGIVER_PERMISSIONS.receiveInsights,
    canAcknowledgeAlerts: p?.canAcknowledgeAlerts ?? DEFAULT_CAREGIVER_PERMISSIONS.canAcknowledgeAlerts,
  };
}

function toRelationshipDTO(
  row: RelationshipRow,
  patientName: string,
  caregiverName: string,
): CaregiverRelationshipDTO {
  return {
    id: row.id,
    patientUserId: row.patientUserId,
    caregiverUserId: row.caregiverUserId,
    patientName,
    caregiverName,
    status: row.status,
    relationType: row.relationType,
    permissions: permissionsOf(row.permissions),
    acceptedAt: row.acceptedAt,
    createdAt: row.createdAt,
  };
}

function toInvitationDTO(row: InvitationRow): CaregiverInvitationDTO {
  return {
    id: row.id,
    email: row.email,
    message: row.message,
    status: row.status,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

function toAlertDTO(
  row: AlertRow,
  names: Map<string, string>,
  snapshot: { medicationName?: string | null; scheduledFor?: string | null } | null,
): CaregiverAlertDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    patientName: names.get(row.patientUserId) ?? "Patient",
    caregiverName: names.get(row.caregiverUserId) ?? "Caregiver",
    medicationName: snapshot?.medicationName ?? null,
    scheduledFor: snapshot?.scheduledFor ? new Date(snapshot.scheduledFor) : null,
    doseEventId: row.doseEventId,
  };
}

function alertSnapshot(row: AlertRow): { medicationName?: string | null; scheduledFor?: string | null } | null {
  const data = (row.data ?? null) as { medicationName?: string | null; scheduledFor?: string | null } | null;
  return data;
}

/** Fetch names for a set of user ids (one query, no N+1). */
async function namesOf(db: Db | DbTx, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, unique));
  return new Map(rows.map((r) => [r.id, r.name]));
}

/** (patient, email) already has a live invitation? */
async function pendingInvitationFor(db: Db | DbTx, patientUserId: string, email: string): Promise<InvitationRow | null> {
  const [row] = await db
    .select()
    .from(caregiverInvitations)
    .where(
      and(
        eq(caregiverInvitations.patientUserId, patientUserId),
        eq(caregiverInvitations.email, email),
        eq(caregiverInvitations.status, "pending"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export const caregiverService = {
  /**
   * §10.6 invite — patient creates a one-time base64url token invitation carrying the
   * selected permissions (schema §8.9 + Phase 17 `permissions` column). Blocks
   * self-invites and duplicate pending invites for the same (patient, email).
   */
  async invite(db: Db | DbTx, patientUserId: string, input: CaregiverInviteInput): Promise<CaregiverInviteResultDTO> {
    const [existingPatient] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existingPatient?.id === patientUserId) {
      throw new InviteError("You can't invite yourself as a caregiver.");
    }
    const dup = await pendingInvitationFor(db, patientUserId, input.email);
    if (dup) throw new InviteError("A pending invitation already exists for that email.");

    const token = randomBytes(24).toString("base64url");
    const [row] = await db
      .insert(caregiverInvitations)
      .values({
        id: uuidv7(),
        patientUserId,
        email: input.email,
        token,
        message: input.message ?? null,
        permissions: input.permissions,
        status: "pending",
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
      })
      .returning();
    return { ...toInvitationDTO(row!), token, href: `/caregiver/accept?token=${token}` };
  },

  /**
   * §11.12 `/caregiver/accept` — non-sensitive preview of a pending invitation BEFORE the
   * caregiver redeems it. Only leaks what the token already authorises the holder to redeem;
   * expired/used tokens preview `null` so the page can render the right empty state.
   */
  async previewByToken(db: Db | DbTx, token: string): Promise<CaregiverInvitationPreviewDTO | null> {
    const [inv] = await db
      .select()
      .from(caregiverInvitations)
      .where(and(eq(caregiverInvitations.token, token), eq(caregiverInvitations.status, "pending")))
      .limit(1);
    if (!inv) return null;
    if (inv.expiresAt.getTime() < now().getTime()) return null;
    const [patient] = await db.select({ name: users.name }).from(users).where(eq(users.id, inv.patientUserId)).limit(1);
    return {
      patientName: patient?.name ?? "Patient",
      message: inv.message ?? null,
      permissions: permissionsOf(inv.permissions),
      expiresAt: inv.expiresAt,
    };
  },

  /**
   * §10.6 accept — a signed-in user redeems a token: the relationship becomes `active`
   * (auto-accept on redemption) with the invited (or default) permissions. Re-activates
   * a prior revoked relationship for the same pair; idempotent when already active.
   */
  async accept(db: Db | DbTx, caregiverUserId: string, token: string): Promise<CaregiverRelationshipDTO> {
    const [inv] = await db
      .select()
      .from(caregiverInvitations)
      .where(and(eq(caregiverInvitations.token, token), eq(caregiverInvitations.status, "pending")))
      .limit(1);
    if (!inv) throw new InviteError("This invitation is invalid or has already been used.");

    const at = now();
    if (inv.expiresAt.getTime() < at.getTime()) {
      await db.update(caregiverInvitations).set({ status: "expired" }).where(eq(caregiverInvitations.id, inv.id));
      throw new InviteError("This invitation has expired.");
    }
    if (inv.patientUserId === caregiverUserId) {
      throw new InviteError("You can't accept your own invitation.");
    }

    const permissions = permissionsOf(inv.permissions);
    const names = await namesOf(db, [inv.patientUserId, caregiverUserId]);
    await notificationsService.create(db, {
      userId: inv.patientUserId,
      type: "system",
      title: "New caregiver connection",
      body: `${names.get(caregiverUserId) ?? "A caregiver"} accepted your invitation.`,
      entityType: null,
      entityId: null,
      createdAt: at,
    });

    const [existing] = await db
      .select()
      .from(caregiverRelationships)
      .where(
        and(
          eq(caregiverRelationships.patientUserId, inv.patientUserId),
          eq(caregiverRelationships.caregiverUserId, caregiverUserId),
        ),
      )
      .limit(1);

    let row: RelationshipRow;
    if (existing && existing.status === "active") {
      row = existing;
    } else if (existing) {
      const [updated] = await db
        .update(caregiverRelationships)
        .set({
          status: "active",
          permissions,
          invitedByUserId: inv.patientUserId,
          revokedAt: null,
          acceptedAt: at,
        })
        .where(eq(caregiverRelationships.id, existing.id))
        .returning();
      row = updated!;
    } else {
      const [created] = await db
        .insert(caregiverRelationships)
        .values({
          id: uuidv7(),
          patientUserId: inv.patientUserId,
          caregiverUserId,
          status: "active",
          relationType: "family",
          permissions,
          invitedByUserId: inv.patientUserId,
          acceptedAt: at,
        })
        .returning();
      row = created!;
    }

    await db.update(caregiverInvitations).set({ status: "accepted" }).where(eq(caregiverInvitations.id, inv.id));
    return toRelationshipDTO(row, names.get(inv.patientUserId) ?? "Patient", names.get(caregiverUserId) ?? "Caregiver");
  },

  /**
   * §11.12 `/caregiver` (patient view + caregiver role view). Patient side lists the
   * caregivers managing the patient's data + invitations + "alerts sent" history;
   * caregiver side lists the patients the caller actively cares for.
   */
  async overview(db: Db | DbTx, userId: string): Promise<CaregiverOverviewDTO> {
    const [asPatient, asCaregiver, invitations, sentAlerts] = await Promise.all([
      db
        .select()
        .from(caregiverRelationships)
        .where(eq(caregiverRelationships.patientUserId, userId))
        .orderBy(desc(caregiverRelationships.updatedAt)),
      db
        .select()
        .from(caregiverRelationships)
        .where(and(eq(caregiverRelationships.caregiverUserId, userId), eq(caregiverRelationships.status, ACTIVE)))
        .orderBy(desc(caregiverRelationships.updatedAt)),
      db
        .select()
        .from(caregiverInvitations)
        .where(eq(caregiverInvitations.patientUserId, userId))
        .orderBy(desc(caregiverInvitations.createdAt)),
      db
        .select()
        .from(caregiverAlerts)
        .where(eq(caregiverAlerts.patientUserId, userId))
        .orderBy(desc(caregiverAlerts.createdAt))
        .limit(50),
    ]);

    const ids = new Set<string>();
    for (const r of [...asPatient, ...asCaregiver, ...sentAlerts]) {
      ids.add(r.patientUserId);
      ids.add(r.caregiverUserId);
    }
    const names = await namesOf(db, [...ids]);

    return {
      asPatient: asPatient.map((r) =>
        toRelationshipDTO(r, names.get(r.patientUserId) ?? "Patient", names.get(r.caregiverUserId) ?? "Caregiver"),
      ),
      asCaregiver: asCaregiver.map((r): CaregiverPatientDTO => ({
        relationshipId: r.id,
        patientUserId: r.patientUserId,
        patientName: names.get(r.patientUserId) ?? "Patient",
        relationType: r.relationType,
        permissions: permissionsOf(r.permissions),
        acceptedAt: r.acceptedAt,
      })),
      invitations: invitations.map(toInvitationDTO),
      sentAlerts: sentAlerts.map((r) => toAlertDTO(r, names, alertSnapshot(r))),
    };
  },

  /**
   * §10.6 patient-scoped permission edit — only the patient of the pair may edit, and only
   * while the relationship is `active` (a revoked row is history: its permissions are frozen).
   */
  async updatePermissions(
    db: Db | DbTx,
    patientUserId: string,
    relationshipId: string,
    permissions: CaregiverPermissions,
  ): Promise<CaregiverRelationshipDTO> {
    const row = await ownedRelationship(db, patientUserId, relationshipId);
    if (!row) throw new AuthGateError("Relationship not found.");
    if (row.status !== ACTIVE) throw new AuthGateError("This caregiver connection is no longer active.");

    const [updated] = await db
      .update(caregiverRelationships)
      .set({ permissions, updatedAt: new Date() })
      .where(and(eq(caregiverRelationships.id, relationshipId), eq(caregiverRelationships.status, ACTIVE)))
      .returning();
    if (!updated) throw new AuthGateError("This caregiver connection is no longer active.");
    const names = await namesOf(db, [row.patientUserId, row.caregiverUserId]);
    return toRelationshipDTO(updated, names.get(row.patientUserId) ?? "Patient", names.get(row.caregiverUserId) ?? "Caregiver");
  },

  /** Patient revokes a relationship — stops all future alerts; row kept for history. */
  async revoke(db: Db | DbTx, patientUserId: string, relationshipId: string): Promise<void> {
    const row = await ownedRelationship(db, patientUserId, relationshipId);
    if (!row) throw new AuthGateError("Relationship not found.");
    if (row.status === "revoked") return;
    await db
      .update(caregiverRelationships)
      .set({ status: "revoked", revokedAt: now(), updatedAt: new Date() })
      .where(and(eq(caregiverRelationships.id, relationshipId), eq(caregiverRelationships.status, ACTIVE)));
  },

  /** Caregiver steps away from a patient — same soft-delete semantics, caller differs. */
  async leave(db: Db | DbTx, caregiverUserId: string, relationshipId: string): Promise<void> {
    const [row] = await db
      .select()
      .from(caregiverRelationships)
      .where(and(eq(caregiverRelationships.id, relationshipId), eq(caregiverRelationships.caregiverUserId, caregiverUserId)))
      .limit(1);
    if (!row) throw new AuthGateError("Relationship not found.");
    if (row.status === "revoked") return;
    await db
      .update(caregiverRelationships)
      .set({ status: "revoked", revokedAt: now(), updatedAt: new Date() })
      .where(and(eq(caregiverRelationships.id, relationshipId), eq(caregiverRelationships.status, ACTIVE)));
  },

  /** Patient recalls a pending invitation before it is redeemed. */
  async revokeInvitation(db: Db | DbTx, patientUserId: string, invitationId: string): Promise<void> {
    const [row] = await db
      .select()
      .from(caregiverInvitations)
      .where(and(eq(caregiverInvitations.id, invitationId), eq(caregiverInvitations.patientUserId, patientUserId)))
      .limit(1);
    if (!row) throw new AuthGateError("Invitation not found.");
    if (row.status === "revoked") return;
    if (row.status !== "pending") throw new AuthGateError("This invitation can no longer be revoked.");
    await db
      .update(caregiverInvitations)
      .set({ status: "revoked" })
      .where(
        and(
          eq(caregiverInvitations.id, invitationId),
          eq(caregiverInvitations.patientUserId, patientUserId),
          eq(caregiverInvitations.status, "pending"),
        ),
      );
  },

  /**
   * §10.6 authorization core. Returns the ACTIVE relationship when `caregiverUserId`
   * currently cares for `patientUserId`, else `null`. Routers treat `null` as
   * UNAUTHORIZED/FORBIDDEN — never a leak-able 404. Permission gates layer on top.
   */
  async requireCaregiverAccess(
    db: Db | DbTx,
    caregiverUserId: string,
    patientUserId: string,
  ): Promise<CaregiverRelationshipDTO | null> {
    const [row] = await db
      .select()
      .from(caregiverRelationships)
      .where(
        and(
          eq(caregiverRelationships.patientUserId, patientUserId),
          eq(caregiverRelationships.caregiverUserId, caregiverUserId),
          eq(caregiverRelationships.status, ACTIVE),
        ),
      )
      .limit(1);
    if (!row) return null;
    const names = await namesOf(db, [patientUserId, caregiverUserId]);
    return toRelationshipDTO(row, names.get(patientUserId) ?? "Patient", names.get(caregiverUserId) ?? "Caregiver");
  },

  /** Read-only patient overview for an authorized caregiver (§11.12 caregiver mode). */
  async patientOverview(
    db: Db | DbTx,
    caregiverUserId: string,
    patientUserId: string,
    timeZone: string,
  ): Promise<PatientOverviewDTO | null> {
    const rel = await caregiverService.requireCaregiverAccess(db, caregiverUserId, patientUserId);
    if (!rel) return null;
    if (!rel.permissions.viewAdherence) throw new AuthGateError("view-adherence permission is required.");

    const todayKey = localDateKey(now(), timeZone);
    const dayStart = combineDateAndTime(todayKey, "00:00", timeZone);
    const dayEnd = combineDateAndTime(todayKey, "23:59", timeZone);

    const [day, summary7, summary30, alerts] = await Promise.all([
      scheduleService.day(db, patientUserId, timeZone, todayKey),
      adherenceService.summary(db, patientUserId, timeZone, { from: addLocalDays(dayStart, -6, timeZone), to: dayEnd }),
      adherenceService.summary(db, patientUserId, timeZone, { from: addLocalDays(dayStart, -29, timeZone), to: dayEnd }),
      caregiverService.listPatientAlerts(db, caregiverUserId, patientUserId),
    ]);

    return {
      patient: {
        relationshipId: rel.id,
        patientUserId: rel.patientUserId,
        patientName: rel.patientName,
        relationType: rel.relationType,
        permissions: rel.permissions,
        acceptedAt: rel.acceptedAt,
      },
      today: {
        scheduled: day.events.length,
        taken: day.events.filter((e) => e.status === "taken").length,
        missed: day.events.filter((e) => e.status === "missed").length,
      },
      summary7,
      summary30,
      medications: rel.permissions.viewMedications
        ? (await medicationService.list(db, patientUserId, timeZone)).medications
        : [],
      alerts,
    };
  },

  /** Caregiver alert feed for their own patient (owner-scoped by caregiverUserId). */
  async listPatientAlerts(db: Db | DbTx, caregiverUserId: string, patientUserId: string): Promise<CaregiverAlertDTO[]> {
    const rows = await db
      .select()
      .from(caregiverAlerts)
      .where(
        and(
          eq(caregiverAlerts.caregiverUserId, caregiverUserId),
          eq(caregiverAlerts.patientUserId, patientUserId),
        ),
      )
      .orderBy(desc(caregiverAlerts.createdAt))
      .limit(LIST_PAGE_SIZE);
    return enrichAlerts(db, rows);
  },

  /**
   * Alert detail for the acting caregiver, plus the underlying dose's action timeline.
   *
   * Two actors may read one alert: the patient it was sent about (their own "alerts sent"
   * history) and the caregiver it was addressed to — the latter only while the relationship
   * is still `active`, so revoking instantly closes historical access.
   */
  async alertDetail(
    db: Db | DbTx,
    actorUserId: string,
    alertId: string,
  ): Promise<CaregiverAlertDetailDTO | null> {
    const [row] = await db.select().from(caregiverAlerts).where(eq(caregiverAlerts.id, alertId)).limit(1);
    if (!row) return null;

    if (row.patientUserId === actorUserId) {
      // Patient reading their own alert — no relationship gate needed.
    } else if (row.caregiverUserId === actorUserId) {
      const rel = await caregiverService.requireCaregiverAccess(db, actorUserId, row.patientUserId);
      if (!rel) return null;
    } else {
      return null;
    }

    const names = await namesOf(db, [row.patientUserId, row.caregiverUserId]);
    const event = row.doseEventId
      ? (await db.select().from(doseEvents).where(eq(doseEvents.id, row.doseEventId)).limit(1))[0]
      : undefined;
    const med = event
      ? (await db.select().from(medications).where(eq(medications.id, event.medicationId)).limit(1))[0]
      : undefined;
    const actions = event
      ? await db.select().from(doseActions).where(eq(doseActions.doseEventId, event.id)).orderBy(doseActions.occurredAt)
      : [];

    return {
      ...toAlertDTO(row, names, {
        medicationName: event ? med?.name ?? null : null,
        scheduledFor: event ? event.scheduledFor.toISOString() : undefined,
      }),
      patientUserId: row.patientUserId,
      history: event && med ? actions.map((a) => toDoseActionDTO(a, med, { eventStatus: event!.status, eventScheduledFor: event!.scheduledFor })) : [],
    };
  },

  /**
   * Caregiver acknowledges/resolves an alert. Gated by `canAcknowledgeAlerts` on the
   * ACTIVE relationship — never by the alert row alone (a revoked relationship loses
   * the ability even for historical alerts).
   */
  async alertAction(
    db: Db | DbTx,
    caregiverUserId: string,
    alertId: string,
    action: "acknowledge" | "resolve",
  ): Promise<CaregiverAlertDTO> {
    const [alert] = await db
      .select()
      .from(caregiverAlerts)
      .where(and(eq(caregiverAlerts.id, alertId), eq(caregiverAlerts.caregiverUserId, caregiverUserId)))
      .limit(1);
    if (!alert) throw new AuthGateError("Alert not found.");

    const rel = await caregiverService.requireCaregiverAccess(db, caregiverUserId, alert.patientUserId);
    if (!rel || !rel.permissions.canAcknowledgeAlerts) {
      throw new AuthGateError("You don't have permission to manage this alert.");
    }

    const status: AlertStatus = action === "resolve" ? "resolved" : "acknowledged";
    const [updated] = await db
      .update(caregiverAlerts)
      .set({ status, resolvedAt: action === "resolve" ? now() : alert.resolvedAt })
      .where(eq(caregiverAlerts.id, alertId))
      .returning();
    const names = await namesOf(db, [updated!.patientUserId, updated!.caregiverUserId]);
    return toAlertDTO(updated!, names, alertSnapshot(updated!));
  },

  /**
   * §10.6 optional adherence-drop trigger: when the patient configured an
   * `adherenceDropThreshold` and the trailing 7-day rate falls under it, raise one
   * `adherence_drop` alert per qualifying ACTIVE relationship. Deduped per relationship per
   * local day so a recurring job can never spam the same drop. Returns alerts created.
   */
  async evaluateAdherenceDrop(db: Db | DbTx, patientUserId: string, timeZone: string, at: Date = now()): Promise<number> {
    const [prefs] = await db
      .select({ caregiverAlertPrefs: userPreferences.caregiverAlertPrefs })
      .from(userPreferences)
      .where(eq(userPreferences.userId, patientUserId))
      .limit(1);
    const threshold = (prefs?.caregiverAlertPrefs as { adherenceDropThreshold?: number | null } | null)
      ?.adherenceDropThreshold;
    if (threshold === null || threshold === undefined) return 0;

    const relationships = await db
      .select()
      .from(caregiverRelationships)
      .where(and(eq(caregiverRelationships.patientUserId, patientUserId), eq(caregiverRelationships.status, ACTIVE)));
    const targets = relationships.filter((r) => permissionsOf(r.permissions).receiveMissedDoseAlerts);
    if (targets.length === 0) return 0;

    const todayKey = localDateKey(at, timeZone);
    const dayStart = combineDateAndTime(todayKey, "00:00", timeZone);
    const dayEnd = combineDateAndTime(todayKey, "23:59", timeZone);

    const [current, previous, patientRows] = await Promise.all([
      adherenceService.summary(db, patientUserId, timeZone, { from: addLocalDays(dayStart, -6, timeZone), to: dayEnd }),
      adherenceService.summary(db, patientUserId, timeZone, {
        from: addLocalDays(dayStart, -13, timeZone),
        to: addLocalDays(dayStart, -7, timeZone),
      }),
      db.select({ name: users.name }).from(users).where(eq(users.id, patientUserId)).limit(1),
    ]);

    const rate = current.adherencePercent;
    if (rate === null || rate >= threshold) return 0;

    const patientName = patientRows[0]?.name ?? "Patient";
    const title = "Adherence dropped";
    const body = `${patientName}'s 7-day adherence fell to ${Math.round(rate)}%, below the ${Math.round(threshold)}% alert threshold.`;

    let created = 0;
    for (const rel of targets) {
      const [existing] = await db
        .select({ id: caregiverAlerts.id })
        .from(caregiverAlerts)
        .where(
          and(
            eq(caregiverAlerts.relationshipId, rel.id),
            eq(caregiverAlerts.type, "adherence_drop"),
            gte(caregiverAlerts.createdAt, dayStart),
          ),
        )
        .limit(1);
      if (existing) continue;

      const alertId = uuidv7();
      await db.insert(caregiverAlerts).values({
        id: alertId,
        patientUserId,
        caregiverUserId: rel.caregiverUserId,
        relationshipId: rel.id,
        doseEventId: null,
        type: "adherence_drop",
        title,
        body,
        data: {
          adherenceBefore: previous.adherencePercent,
          adherenceAfter: rate,
          threshold,
          windowDays: 7,
          patientName,
        },
        status: "new",
        createdAt: at,
      });
      await notificationsService.create(db, {
        userId: rel.caregiverUserId,
        type: "caregiver_alert",
        title,
        body,
        entityType: "caregiverAlert",
        entityId: alertId,
        createdAt: at,
      });
      created += 1;
    }
    return created;
  },

  /**
   * §10.6 + Phase 13 hook — a missed dose fans out to every ACTIVE relationship where the
   * patient granted `receiveMissedDoseAlerts`. Deduped once per (dose, relationship) and
   * mirrored to the caregiver's notification center via the §10.7 single writer.
   * Returns how many alerts were actually created.
   */
  async createMissedDoseAlert(db: Db | DbTx, patientUserId: string, ref: MissedDoseRef, at: Date): Promise<number> {
    const relationships = await db
      .select()
      .from(caregiverRelationships)
      .where(and(eq(caregiverRelationships.patientUserId, patientUserId), eq(caregiverRelationships.status, ACTIVE)));
    const targets = relationships.filter((r) => permissionsOf(r.permissions).receiveMissedDoseAlerts);
    if (targets.length === 0) return 0;

    const [med] = await db.select().from(medications).where(eq(medications.id, ref.medicationId)).limit(1);
    const [patient] = await db.select({ name: users.name }).from(users).where(eq(users.id, patientUserId)).limit(1);

    let created = 0;
    for (const rel of targets) {
      const [existing] = await db
        .select({ id: caregiverAlerts.id })
        .from(caregiverAlerts)
        .where(and(eq(caregiverAlerts.doseEventId, ref.id), eq(caregiverAlerts.relationshipId, rel.id)))
        .limit(1);
      if (existing) continue;

      const medicationName = med?.name ?? "a medication";
      const title = "Missed dose";
      const body = `${patient?.name ?? "Patient"} missed ${medicationName} scheduled for ${ref.scheduledFor.toISOString()}.`;
      const alertId = uuidv7();
      await db.insert(caregiverAlerts).values({
        id: alertId,
        patientUserId,
        caregiverUserId: rel.caregiverUserId,
        relationshipId: rel.id,
        doseEventId: ref.id,
        type: "missed_dose",
        title,
        body,
        data: {
          medicationName: med?.name ?? null,
          scheduledFor: ref.scheduledFor.toISOString(),
          patientName: patient?.name ?? null,
        },
        status: "new",
        createdAt: at,
      });
      await notificationsService.create(db, {
        userId: rel.caregiverUserId,
        type: "caregiver_alert",
        title,
        body,
        entityType: "caregiverAlert",
        entityId: alertId,
        createdAt: at,
      });
      created += 1;
    }
    return created;
  },
};

/** Attach names + cached snapshot fields to a batch of alert rows. */
async function enrichAlerts(db: Db | DbTx, rows: AlertRow[]): Promise<CaregiverAlertDTO[]> {
  if (rows.length === 0) return [];
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.patientUserId);
    ids.add(r.caregiverUserId);
  }
  const names = await namesOf(db, [...ids]);
  return rows.map((r) => toAlertDTO(r, names, alertSnapshot(r)));
}

async function ownedRelationship(
  db: Db | DbTx,
  patientUserId: string,
  relationshipId: string,
): Promise<RelationshipRow | null> {
  const [row] = await db
    .select()
    .from(caregiverRelationships)
    .where(and(eq(caregiverRelationships.id, relationshipId), eq(caregiverRelationships.patientUserId, patientUserId)))
    .limit(1);
  return row ?? null;
}

/** TRPC-facing errors — the router maps these to a TRPCError with a clean message. */
export class InviteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteError";
  }
}
export class AuthGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthGateError";
  }
}