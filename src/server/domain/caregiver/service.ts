/**
 * Phase 21 — Caregiver Domain Service (plan §10.6, §11.12, §21).
 *
 * Core caregiver system logic:
 * - Invitations (create token, query, revoke, accept).
 * - Relationships (list caregivers, list monitored patients, update permissions, revoke).
 * - Alerts (deduplicated missed-dose alert creation, alert feed, acknowledge/resolve).
 * - Caregiver overview (scoped read-only access with strict permission gating).
 */

import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import {
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  doseEvents,
  medications,
  users,
} from "@/server/db/schema";
import { getAdherenceSummary } from "@/server/domain/adherence/service";
import type { MissedDoseContext } from "@/server/domain/doseEvents/attachments";
import { createNotification } from "@/server/domain/notifications/service";
import { now } from "@/shared/times";
import type {
  AdherenceSummaryDTO,
  CaregiverAlertDTO,
  CaregiverInvitationDTO,
  CaregiverPermissions,
  CaregiverRelationshipDTO,
  DoseEventDTO,
  MedicationDTO,
} from "@/shared/types";
import { DEFAULT_CAREGIVER_PERMISSIONS } from "@/shared/types";
import type { RelationType } from "@/shared/enums";
import type { CaregiverInviteInput } from "@/shared/validations/caregiver";

export interface StoredInvitationMeta {
  text: string | null;
  permissions: CaregiverPermissions;
  relationType: RelationType;
}

function parseInvitationMeta(message: string | null): StoredInvitationMeta {
  if (!message) {
    return {
      text: null,
      permissions: DEFAULT_CAREGIVER_PERMISSIONS,
      relationType: "family",
    };
  }

  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === "object") {
      return {
        text: typeof parsed.text === "string" ? parsed.text : null,
        permissions: parsed.permissions ?? DEFAULT_CAREGIVER_PERMISSIONS,
        relationType: parsed.relationType ?? "family",
      };
    }
  } catch {
    // Plain text message
  }

  return {
    text: message,
    permissions: DEFAULT_CAREGIVER_PERMISSIONS,
    relationType: "family",
  };
}

/**
 * Creates an invitation for a caregiver by email, generating a unique token.
 */
export async function inviteCaregiver(
  db: Db | DbTx,
  patientUserId: string,
  input: CaregiverInviteInput,
): Promise<CaregiverInvitationDTO & { token: string; inviteUrl: string }> {
  // 1. Cannot invite oneself
  const [patientUser] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, patientUserId))
    .limit(1);

  if (patientUser && patientUser.email.toLowerCase() === input.email.toLowerCase()) {
    throw new Error("You cannot invite yourself as a caregiver.");
  }

  // 2. Check if already active caregiver
  const [existingCaregiverUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (existingCaregiverUser) {
    const [existingRel] = await db
      .select({ status: caregiverRelationships.status })
      .from(caregiverRelationships)
      .where(
        and(
          eq(caregiverRelationships.patientUserId, patientUserId),
          eq(caregiverRelationships.caregiverUserId, existingCaregiverUser.id),
        ),
      )
      .limit(1);

    if (existingRel?.status === "active") {
      throw new Error("This caregiver is already actively connected to your account.");
    }
  }

  // 3. Revoke any prior pending invitations for this email
  await db
    .update(caregiverInvitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(caregiverInvitations.patientUserId, patientUserId),
        eq(caregiverInvitations.email, input.email.toLowerCase()),
        eq(caregiverInvitations.status, "pending"),
      ),
    );

  // 4. Generate cryptographically random token
  const token = randomBytes(24).toString("base64url");
  const id = uuidv7();
  const currentNow = now();
  const expiresAt = new Date(currentNow.getTime() + 7 * 86400000); // 7 days

  const meta: StoredInvitationMeta = {
    text: input.message ?? null,
    permissions: input.permissions ?? DEFAULT_CAREGIVER_PERMISSIONS,
    relationType: input.relationType ?? "family",
  };

  await db.insert(caregiverInvitations).values({
    id,
    patientUserId,
    email: input.email.toLowerCase(),
    token,
    message: JSON.stringify(meta),
    status: "pending",
    expiresAt,
    createdAt: currentNow,
  });

  return {
    id,
    email: input.email.toLowerCase(),
    message: input.message ?? null,
    status: "pending",
    expiresAt,
    createdAt: currentNow,
    token,
    inviteUrl: `/caregiver/accept?token=${token}`,
  };
}

/**
 * Lists all invitations sent by the patient.
 */
export async function listPatientInvitations(
  db: Db | DbTx,
  patientUserId: string,
): Promise<(CaregiverInvitationDTO & { token: string; relationType: RelationType })[]> {
  const currentNow = now();

  // Mark expired invitations
  await db
    .update(caregiverInvitations)
    .set({ status: "expired" })
    .where(
      and(
        eq(caregiverInvitations.patientUserId, patientUserId),
        eq(caregiverInvitations.status, "pending"),
        lt(caregiverInvitations.expiresAt, currentNow),
      ),
    );

  const rows = await db
    .select()
    .from(caregiverInvitations)
    .where(eq(caregiverInvitations.patientUserId, patientUserId))
    .orderBy(desc(caregiverInvitations.createdAt));

  return rows.map((r) => {
    const meta = parseInvitationMeta(r.message);
    return {
      id: r.id,
      email: r.email,
      message: meta.text,
      status: r.status,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      token: r.token,
      relationType: meta.relationType,
    };
  });
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvitation(
  db: Db | DbTx,
  patientUserId: string,
  invitationId: string,
): Promise<{ success: boolean }> {
  const [inv] = await db
    .select()
    .from(caregiverInvitations)
    .where(
      and(
        eq(caregiverInvitations.id, invitationId),
        eq(caregiverInvitations.patientUserId, patientUserId),
      ),
    )
    .limit(1);

  if (!inv) {
    throw new Error("Invitation not found or unauthorized.");
  }

  await db
    .update(caregiverInvitations)
    .set({ status: "revoked" })
    .where(eq(caregiverInvitations.id, invitationId));

  return { success: true };
}

/**
 * Queries invitation details by token for the accept invitation page.
 */
export async function getInvitationByToken(
  db: Db | DbTx,
  token: string,
): Promise<{
  id: string;
  patientUserId: string;
  patientName: string;
  patientEmail: string;
  email: string;
  relationType: RelationType;
  permissions: CaregiverPermissions;
  message: string | null;
  status: string;
  expiresAt: Date;
}> {
  const currentNow = now();

  const [inv] = await db
    .select({
      id: caregiverInvitations.id,
      patientUserId: caregiverInvitations.patientUserId,
      email: caregiverInvitations.email,
      message: caregiverInvitations.message,
      status: caregiverInvitations.status,
      expiresAt: caregiverInvitations.expiresAt,
      patientName: users.name,
      patientEmail: users.email,
    })
    .from(caregiverInvitations)
    .innerJoin(users, eq(users.id, caregiverInvitations.patientUserId))
    .where(eq(caregiverInvitations.token, token))
    .limit(1);

  if (!inv) {
    throw new Error("Invalid or expired invitation token.");
  }

  if (inv.status === "revoked") {
    throw new Error("This invitation has been revoked by the patient.");
  }

  if (inv.status === "accepted") {
    throw new Error("This invitation has already been accepted.");
  }

  if (inv.expiresAt < currentNow || inv.status === "expired") {
    if (inv.status !== "expired") {
      await db
        .update(caregiverInvitations)
        .set({ status: "expired" })
        .where(eq(caregiverInvitations.id, inv.id));
    }
    throw new Error("This invitation has expired.");
  }

  const meta = parseInvitationMeta(inv.message);

  return {
    id: inv.id,
    patientUserId: inv.patientUserId,
    patientName: inv.patientName || "Patient",
    patientEmail: inv.patientEmail,
    email: inv.email,
    relationType: meta.relationType,
    permissions: meta.permissions,
    message: meta.text,
    status: inv.status,
    expiresAt: inv.expiresAt,
  };
}

/**
 * Accepts an invitation using a valid token, transitioning or creating an active relationship.
 */
export async function acceptInvitation(
  db: Db | DbTx,
  caregiverUserId: string,
  token: string,
): Promise<CaregiverRelationshipDTO> {
  const invitation = await getInvitationByToken(db, token);

  if (caregiverUserId === invitation.patientUserId) {
    throw new Error("You cannot accept an invitation to become your own caregiver.");
  }

  const currentNow = now();

  // Mark invitation accepted
  await db
    .update(caregiverInvitations)
    .set({ status: "accepted" })
    .where(eq(caregiverInvitations.id, invitation.id));

  // Check existing relationship between patient & caregiver
  const [existingRel] = await db
    .select()
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.patientUserId, invitation.patientUserId),
        eq(caregiverRelationships.caregiverUserId, caregiverUserId),
      ),
    )
    .limit(1);

  let relationshipId: string;

  if (existingRel) {
    relationshipId = existingRel.id;
    await db
      .update(caregiverRelationships)
      .set({
        status: "active",
        relationType: invitation.relationType,
        permissions: invitation.permissions,
        revokedAt: null,
        acceptedAt: currentNow,
        updatedAt: currentNow,
      })
      .where(eq(caregiverRelationships.id, existingRel.id));
  } else {
    relationshipId = uuidv7();
    await db.insert(caregiverRelationships).values({
      id: relationshipId,
      patientUserId: invitation.patientUserId,
      caregiverUserId,
      status: "active",
      relationType: invitation.relationType,
      permissions: invitation.permissions,
      invitedByUserId: invitation.patientUserId,
      acceptedAt: currentNow,
      createdAt: currentNow,
      updatedAt: currentNow,
    });
  }

  const [caregiverUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, caregiverUserId))
    .limit(1);

  return {
    id: relationshipId,
    patientUserId: invitation.patientUserId,
    caregiverUserId,
    patientName: invitation.patientName,
    caregiverName: caregiverUser?.name || "Caregiver",
    status: "active",
    relationType: invitation.relationType,
    permissions: invitation.permissions,
    acceptedAt: currentNow,
    createdAt: currentNow,
  };
}

/**
 * Lists all caregivers assigned to the patient.
 */
export async function listPatientCaregivers(
  db: Db | DbTx,
  patientUserId: string,
): Promise<CaregiverRelationshipDTO[]> {
  const rows = await db
    .select({
      id: caregiverRelationships.id,
      patientUserId: caregiverRelationships.patientUserId,
      caregiverUserId: caregiverRelationships.caregiverUserId,
      status: caregiverRelationships.status,
      relationType: caregiverRelationships.relationType,
      permissions: caregiverRelationships.permissions,
      acceptedAt: caregiverRelationships.acceptedAt,
      createdAt: caregiverRelationships.createdAt,
      caregiverName: users.name,
      caregiverEmail: users.email,
    })
    .from(caregiverRelationships)
    .innerJoin(users, eq(users.id, caregiverRelationships.caregiverUserId))
    .where(eq(caregiverRelationships.patientUserId, patientUserId))
    .orderBy(desc(caregiverRelationships.createdAt));

  return rows.map((r) => ({
    id: r.id,
    patientUserId: r.patientUserId,
    caregiverUserId: r.caregiverUserId,
    patientName: "",
    caregiverName: r.caregiverName || r.caregiverEmail,
    status: r.status,
    relationType: r.relationType,
    permissions: (r.permissions as CaregiverPermissions) || DEFAULT_CAREGIVER_PERMISSIONS,
    acceptedAt: r.acceptedAt,
    createdAt: r.createdAt,
  }));
}

/**
 * Lists all patients monitored by this caregiver with active status.
 */
export async function listMonitoredPatients(
  db: Db | DbTx,
  caregiverUserId: string,
): Promise<(CaregiverRelationshipDTO & { patientEmail: string })[]> {
  const rows = await db
    .select({
      id: caregiverRelationships.id,
      patientUserId: caregiverRelationships.patientUserId,
      caregiverUserId: caregiverRelationships.caregiverUserId,
      status: caregiverRelationships.status,
      relationType: caregiverRelationships.relationType,
      permissions: caregiverRelationships.permissions,
      acceptedAt: caregiverRelationships.acceptedAt,
      createdAt: caregiverRelationships.createdAt,
      patientName: users.name,
      patientEmail: users.email,
    })
    .from(caregiverRelationships)
    .innerJoin(users, eq(users.id, caregiverRelationships.patientUserId))
    .where(
      and(
        eq(caregiverRelationships.caregiverUserId, caregiverUserId),
        eq(caregiverRelationships.status, "active"),
      ),
    )
    .orderBy(desc(caregiverRelationships.createdAt));

  return rows.map((r) => ({
    id: r.id,
    patientUserId: r.patientUserId,
    caregiverUserId: r.caregiverUserId,
    patientName: r.patientName || r.patientEmail,
    caregiverName: "",
    patientEmail: r.patientEmail,
    status: r.status,
    relationType: r.relationType,
    permissions: (r.permissions as CaregiverPermissions) || DEFAULT_CAREGIVER_PERMISSIONS,
    acceptedAt: r.acceptedAt,
    createdAt: r.createdAt,
  }));
}

/**
 * Updates permissions for a caregiver relationship (patient-side).
 */
export async function updateCaregiverPermissions(
  db: Db | DbTx,
  patientUserId: string,
  relationshipId: string,
  permissions: CaregiverPermissions,
): Promise<{ success: boolean }> {
  const [rel] = await db
    .select()
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.id, relationshipId),
        eq(caregiverRelationships.patientUserId, patientUserId),
      ),
    )
    .limit(1);

  if (!rel) {
    throw new Error("Caregiver relationship not found or unauthorized.");
  }

  await db
    .update(caregiverRelationships)
    .set({
      permissions,
      updatedAt: now(),
    })
    .where(eq(caregiverRelationships.id, relationshipId));

  return { success: true };
}

/**
 * Revokes a caregiver relationship. Callable by patient or caregiver.
 */
export async function revokeRelationship(
  db: Db | DbTx,
  userId: string,
  relationshipId: string,
): Promise<{ success: boolean }> {
  const [rel] = await db
    .select()
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.id, relationshipId),
        or(
          eq(caregiverRelationships.patientUserId, userId),
          eq(caregiverRelationships.caregiverUserId, userId),
        ),
      ),
    )
    .limit(1);

  if (!rel) {
    throw new Error("Relationship not found or unauthorized.");
  }

  await db
    .update(caregiverRelationships)
    .set({
      status: "revoked",
      revokedAt: now(),
      updatedAt: now(),
    })
    .where(eq(caregiverRelationships.id, relationshipId));

  return { success: true };
}

/**
 * Lists alerts received by the caregiver.
 */
export async function listCaregiverAlerts(
  db: Db | DbTx,
  caregiverUserId: string,
  options?: {
    patientUserId?: string;
    status?: "new" | "acknowledged" | "resolved";
    limit?: number;
  },
): Promise<CaregiverAlertDTO[]> {
  const conditions = [eq(caregiverAlerts.caregiverUserId, caregiverUserId)];

  if (options?.patientUserId) {
    conditions.push(eq(caregiverAlerts.patientUserId, options.patientUserId));
  }
  if (options?.status) {
    conditions.push(eq(caregiverAlerts.status, options.status));
  }

  const query = db
    .select({
      id: caregiverAlerts.id,
      type: caregiverAlerts.type,
      title: caregiverAlerts.title,
      body: caregiverAlerts.body,
      status: caregiverAlerts.status,
      createdAt: caregiverAlerts.createdAt,
      resolvedAt: caregiverAlerts.resolvedAt,
      data: caregiverAlerts.data,
      patientName: users.name,
      patientEmail: users.email,
    })
    .from(caregiverAlerts)
    .innerJoin(users, eq(users.id, caregiverAlerts.patientUserId))
    .where(and(...conditions))
    .orderBy(desc(caregiverAlerts.createdAt));

  const rows = options?.limit ? await query.limit(options.limit) : await query;

  return rows.map((r) => {
    const data = (r.data as Record<string, unknown>) ?? {};
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      status: r.status as "new" | "acknowledged" | "resolved",
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      patientName: (data.patientName as string) || r.patientName || r.patientEmail,
      medicationName: (data.medicationName as string) || null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor as string) : null,
      doseEventId: (data.doseEventId as string) || null,
    };
  });
}

/**
 * Gets a single caregiver alert by ID.
 */
export async function getCaregiverAlert(
  db: Db | DbTx,
  caregiverUserId: string,
  alertId: string,
): Promise<CaregiverAlertDTO> {
  const [row] = await db
    .select({
      id: caregiverAlerts.id,
      type: caregiverAlerts.type,
      title: caregiverAlerts.title,
      body: caregiverAlerts.body,
      status: caregiverAlerts.status,
      createdAt: caregiverAlerts.createdAt,
      resolvedAt: caregiverAlerts.resolvedAt,
      data: caregiverAlerts.data,
      patientName: users.name,
      patientEmail: users.email,
    })
    .from(caregiverAlerts)
    .innerJoin(users, eq(users.id, caregiverAlerts.patientUserId))
    .where(
      and(
        eq(caregiverAlerts.id, alertId),
        eq(caregiverAlerts.caregiverUserId, caregiverUserId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("Alert not found or unauthorized.");
  }

  const data = (row.data as Record<string, unknown>) ?? {};
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    status: row.status as "new" | "acknowledged" | "resolved",
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    patientName: (data.patientName as string) || row.patientName || row.patientEmail,
    medicationName: (data.medicationName as string) || null,
    scheduledFor: data.scheduledFor ? new Date(data.scheduledFor as string) : null,
    doseEventId: (data.doseEventId as string) || null,
  };
}

/**
 * Updates alert status (acknowledge or resolve).
 */
export async function updateAlertStatus(
  db: Db | DbTx,
  caregiverUserId: string,
  alertId: string,
  action: "acknowledge" | "resolve",
): Promise<CaregiverAlertDTO> {
  const current = await getCaregiverAlert(db, caregiverUserId, alertId);

  const currentNow = now();
  const nextStatus = action === "acknowledge" ? "acknowledged" : "resolved";
  const resolvedAt = action === "resolve" ? currentNow : current.resolvedAt;

  await db
    .update(caregiverAlerts)
    .set({
      status: nextStatus,
      resolvedAt,
    })
    .where(
      and(
        eq(caregiverAlerts.id, alertId),
        eq(caregiverAlerts.caregiverUserId, caregiverUserId),
      ),
    );

  return {
    ...current,
    status: nextStatus,
    resolvedAt,
  };
}

/**
 * Phase 13 seam consumer: Generates deduplicated caregiver alerts when a dose is missed.
 */
export async function createMissedDoseAlerts(
  db: Db | DbTx,
  ctx: MissedDoseContext,
): Promise<number> {
  // 1. Query active caregiver relationships for this patient with missed alert permission
  const activeRelationships = await db
    .select({
      id: caregiverRelationships.id,
      caregiverUserId: caregiverRelationships.caregiverUserId,
      permissions: caregiverRelationships.permissions,
    })
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.patientUserId, ctx.userId),
        eq(caregiverRelationships.status, "active"),
      ),
    );

  if (activeRelationships.length === 0) return 0;

  // 2. Fetch patient and medication details for the alert payload
  const [patientUser] = await db
    .select({ name: users.name, timezone: users.timezone })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  const [med] = await db
    .select({
      name: medications.name,
      dosageAmount: medications.dosageAmount,
      dosageUnit: medications.dosageUnit,
    })
    .from(medications)
    .where(eq(medications.id, ctx.medicationId))
    .limit(1);

  const patientName = patientUser?.name || "Patient";
  const medName = med?.name || "Medication";
  const dosage = med ? `${med.dosageAmount} ${med.dosageUnit}` : "";

  let alertsCreated = 0;

  for (const rel of activeRelationships) {
    const permissions = (rel.permissions as CaregiverPermissions) || DEFAULT_CAREGIVER_PERMISSIONS;
    if (permissions.receiveMissedDoseAlerts === false) continue;

    // 3. Deduplication check: Has this caregiver already received an alert for this dose?
    const [existing] = await db
      .select({ id: caregiverAlerts.id })
      .from(caregiverAlerts)
      .where(
        and(
          eq(caregiverAlerts.caregiverUserId, rel.caregiverUserId),
          eq(caregiverAlerts.doseEventId, ctx.doseEventId),
        ),
      )
      .limit(1);

    if (existing) continue;

    // 4. Insert alert
    const alertId = uuidv7();
    await db.insert(caregiverAlerts).values({
      id: alertId,
      patientUserId: ctx.userId,
      caregiverUserId: rel.caregiverUserId,
      relationshipId: rel.id,
      doseEventId: ctx.doseEventId,
      type: "missed_dose",
      title: `Missed dose: ${medName}`,
      body: `${patientName} missed their scheduled ${medName} ${dosage} dose.`,
      data: {
        patientName,
        medicationName: medName,
        dosage,
        scheduledFor: ctx.scheduledFor,
        doseEventId: ctx.doseEventId,
      },
      status: "new",
      createdAt: now(),
    });

    // 5. Notify caregiver via notification center
    await createNotification(db, {
      userId: rel.caregiverUserId,
      type: "caregiver_alert",
      title: `Caregiver Alert: ${patientName}`,
      body: `${patientName} missed their scheduled ${medName} ${dosage} dose.`,
      entityType: "caregiverAlert",
      entityId: alertId,
    });

    alertsCreated++;
  }

  return alertsCreated;
}

export interface MonitoredPatientOverviewDTO {
  relationship: CaregiverRelationshipDTO;
  permissions: CaregiverPermissions;
  adherenceSummary: AdherenceSummaryDTO | null;
  medications: MedicationDTO[];
  todayDoses: DoseEventDTO[];
  recentAlerts: CaregiverAlertDTO[];
}

/**
 * Gets overview for a monitored patient with server-enforced permission gating.
 */
export async function getMonitoredPatientOverview(
  db: Db | DbTx,
  caregiverUserId: string,
  patientUserId: string,
): Promise<MonitoredPatientOverviewDTO> {
  // 1. Authorize: relationship must be active
  const [rel] = await db
    .select({
      id: caregiverRelationships.id,
      patientUserId: caregiverRelationships.patientUserId,
      caregiverUserId: caregiverRelationships.caregiverUserId,
      status: caregiverRelationships.status,
      relationType: caregiverRelationships.relationType,
      permissions: caregiverRelationships.permissions,
      acceptedAt: caregiverRelationships.acceptedAt,
      createdAt: caregiverRelationships.createdAt,
      patientName: users.name,
      patientEmail: users.email,
      patientTimezone: users.timezone,
    })
    .from(caregiverRelationships)
    .innerJoin(users, eq(users.id, caregiverRelationships.patientUserId))
    .where(
      and(
        eq(caregiverRelationships.caregiverUserId, caregiverUserId),
        eq(caregiverRelationships.patientUserId, patientUserId),
        eq(caregiverRelationships.status, "active"),
      ),
    )
    .limit(1);

  if (!rel) {
    throw new Error("Access denied: no active relationship with this patient.");
  }

  const permissions = (rel.permissions as CaregiverPermissions) || DEFAULT_CAREGIVER_PERMISSIONS;
  const timeZone = rel.patientTimezone || "UTC";

  // 2. Adherence summary (if viewAdherence permission granted)
  let adherenceSummary: AdherenceSummaryDTO | null = null;
  if (permissions.viewAdherence) {
    adherenceSummary = await getAdherenceSummary(db, patientUserId, { timeZone });
  }

  // 3. Medications (if viewMedications permission granted)
  let medList: MedicationDTO[] = [];
  if (permissions.viewMedications) {
    const medRows = await db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, patientUserId), eq(medications.status, "active")));

    medList = medRows.map((m) => ({
      id: m.id,
      name: m.name,
      dosageAmount: Number(m.dosageAmount),
      dosageUnit: m.dosageUnit,
      instructions: m.instructions,
      notes: m.notes,
      status: m.status,
      startDate: m.startDate,
      endDate: m.endDate,
      color: m.color,
      remindersEnabled: m.remindersEnabled,
      frequencyLabel: "once-daily",
      isArchived: Boolean(m.archivedAt),
      slots: [],
      archivedAt: m.archivedAt,
      nextDoseAt: null,
      adherencePercent: null,
      createdAt: m.createdAt,
    }));
  }

  // 4. Today's doses for context (if either viewAdherence or viewMedications granted)
  let todayDoses: DoseEventDTO[] = [];
  if (permissions.viewAdherence || permissions.viewMedications) {
    const doseRows = await db
      .select({
        id: doseEvents.id,
        medicationId: doseEvents.medicationId,
        scheduleId: doseEvents.scheduleId,
        scheduledFor: doseEvents.scheduledFor,
        status: doseEvents.status,
        takenAt: doseEvents.takenAt,
        skippedAt: doseEvents.skippedAt,
        snoozeUntil: doseEvents.snoozeUntil,
        snoozeCount: doseEvents.snoozeCount,
        skippedReason: doseEvents.skippedReason,
        missedDeadline: doseEvents.missedDeadline,
        statusUpdatedAt: doseEvents.statusUpdatedAt,
        source: doseEvents.source,
        medicationName: medications.name,
        dosageAmount: medications.dosageAmount,
        dosageUnit: medications.dosageUnit,
        color: medications.color,
        archivedAt: medications.archivedAt,
      })
      .from(doseEvents)
      .innerJoin(medications, eq(medications.id, doseEvents.medicationId))
      .where(
        and(
          eq(doseEvents.userId, patientUserId),
          inArray(doseEvents.status, ["upcoming", "due", "snoozed", "taken", "missed", "skipped"]),
        ),
      )
      .orderBy(desc(doseEvents.scheduledFor))
      .limit(10);

    todayDoses = doseRows.map((d) => ({
      id: d.id,
      medicationId: d.medicationId,
      scheduleId: d.scheduleId,
      scheduledFor: d.scheduledFor,
      status: d.status as DoseEventDTO["status"],
      missedDeadline: d.missedDeadline,
      takenAt: d.takenAt,
      skippedAt: d.skippedAt,
      skippedReason: d.skippedReason,
      snoozeCount: d.snoozeCount,
      snoozeUntil: d.snoozeUntil,
      statusUpdatedAt: d.statusUpdatedAt,
      source: d.source as "generated" | "demo",
      medication: {
        id: d.medicationId,
        name: permissions.viewMedications ? d.medicationName : "Medication",
        dosageAmount: permissions.viewMedications ? Number(d.dosageAmount) : 0,
        dosageUnit: permissions.viewMedications ? d.dosageUnit : "",
        color: d.color,
        archivedAt: d.archivedAt,
      },
    }));
  }

  // 5. Recent alerts for this patient
  const recentAlerts = await listCaregiverAlerts(db, caregiverUserId, {
    patientUserId,
    limit: 10,
  });

  const relationshipDTO: CaregiverRelationshipDTO = {
    id: rel.id,
    patientUserId: rel.patientUserId,
    caregiverUserId: rel.caregiverUserId,
    patientName: rel.patientName || rel.patientEmail,
    caregiverName: "",
    status: rel.status,
    relationType: rel.relationType,
    permissions,
    acceptedAt: rel.acceptedAt,
    createdAt: rel.createdAt,
  };

  return {
    relationship: relationshipDTO,
    permissions,
    adherenceSummary,
    medications: medList,
    todayDoses,
    recentAlerts,
  };
}

/**
 * Connects a caregiver to a patient directly using the patient's unique access code.
 */
export async function connectWithAccessCode(
  db: Db | DbTx,
  caregiverUserId: string,
  accessCode: string,
  relationType: RelationType = "family",
): Promise<CaregiverRelationshipDTO> {
  const cleanCode = accessCode.trim().toUpperCase();

  const [patientUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.accessCode, cleanCode))
    .limit(1);

  if (!patientUser) {
    throw new Error("Invalid access code. Please verify the code with the patient.");
  }

  if (patientUser.id === caregiverUserId) {
    throw new Error("You cannot use your own access code to monitor yourself.");
  }

  const currentNow = now();
  const permissions: CaregiverPermissions = {
    viewAdherence: true,
    viewMedications: true,
    receiveMissedDoseAlerts: true,
    receiveInsights: true,
    canAcknowledgeAlerts: true,
    manageMedications: true,
  };

  const [existingRel] = await db
    .select()
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.patientUserId, patientUser.id),
        eq(caregiverRelationships.caregiverUserId, caregiverUserId),
      ),
    )
    .limit(1);

  let relationshipId: string;
  let createdAt = currentNow;

  if (existingRel) {
    relationshipId = existingRel.id;
    createdAt = existingRel.createdAt;
    await db
      .update(caregiverRelationships)
      .set({
        status: "active",
        relationType,
        permissions,
        revokedAt: null,
        acceptedAt: currentNow,
        updatedAt: currentNow,
      })
      .where(eq(caregiverRelationships.id, existingRel.id));
  } else {
    relationshipId = uuidv7();
    await db.insert(caregiverRelationships).values({
      id: relationshipId,
      patientUserId: patientUser.id,
      caregiverUserId,
      status: "active",
      relationType,
      permissions,
      invitedByUserId: patientUser.id,
      acceptedAt: currentNow,
      createdAt: currentNow,
      updatedAt: currentNow,
    });
  }

  const [caregiverUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, caregiverUserId))
    .limit(1);

  await createNotification(db, {
    userId: patientUser.id,
    type: "system",
    title: "Caregiver Connected",
    body: `${caregiverUser?.name ?? "A caregiver"} has connected to your account using your access code.`,
  }).catch(() => {});

  return {
    id: relationshipId,
    patientUserId: patientUser.id,
    caregiverUserId,
    patientName: patientUser.name || "Patient",
    caregiverName: caregiverUser?.name || "Caregiver",
    status: "active",
    relationType,
    permissions,
    acceptedAt: currentNow,
    createdAt,
  };
}

