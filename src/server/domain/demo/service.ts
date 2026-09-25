import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import {
  caregiverAlerts,
  caregiverRelationships,
  demoStates,
  doseActions,
  doseEvents,
  users,
} from "@/server/db/schema";
import { DEMO_USER_EMAIL, seedDemoWorkspace } from "@/server/db/demo-seed";
import { generateInsights } from "@/server/domain/insights/service";
import { createNotification } from "@/server/domain/notifications/service";
import type { DemoScenario } from "@/shared/enums";
import { now } from "@/shared/times";
import type {
  ApplyScenarioInput,
  SetTimeInput,
  SimulateActionInput,
} from "@/shared/validations/demo";

export const DEMO_CAREGIVER_EMAIL = "dr.patel@medvault.demo";
export const DEMO_COOKIE_NAME = "medvault_demo_session";

/**
 * Initializes or resolves the demo environment for entry.
 */
export async function enterDemo(db: Db | DbTx) {
  const demoUser = await getDemoUser(db);
  const state = await getDemoState(db, demoUser.id);
  return {
    success: true,
    demoUserId: demoUser.id,
    state,
  };
}

/**
 * Leaves demo environment.
 */
export async function leaveDemo() {
  return { success: true };
}

/**
 * Resolves the persistent Arun Kumar demo user, initializing seed if absent.
 */
export async function getDemoUser(db: Db | DbTx) {
  let [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_USER_EMAIL))
    .limit(1);

  if (!demoUser) {
    await seedDemoWorkspace(db);
    [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_USER_EMAIL))
      .limit(1);
  }

  if (!demoUser) {
    throw new Error("Failed to initialize demo workspace user.");
  }

  return demoUser;
}

/**
 * Fetches or creates the 1:1 demo_state row.
 */
export async function getDemoState(db: Db | DbTx, demoUserId: string) {
  let [state] = await db
    .select()
    .from(demoStates)
    .where(eq(demoStates.userId, demoUserId))
    .limit(1);

  if (!state) {
    const id = uuidv7();
    await db.insert(demoStates).values({
      id,
      userId: demoUserId,
      simulationNow: null,
      timeMultiplier: 1,
      scenario: "baseline",
      hasCaregiverDemoData: false,
    });

    [state] = await db
      .select()
      .from(demoStates)
      .where(eq(demoStates.userId, demoUserId))
      .limit(1);
  }

  return state!;
}

/**
 * Resets the demo workspace to pristine §19 seed totals and clears overrides.
 */
export async function resetDemo(db: Db | DbTx) {
  const result = await seedDemoWorkspace(db);
  const demoUserId = result.userId;

  // Ensure demo_state is back to baseline
  await db
    .update(demoStates)
    .set({
      simulationNow: null,
      timeMultiplier: 1,
      scenario: "baseline",
      hasCaregiverDemoData: false,
      updatedAt: new Date(),
    })
    .where(eq(demoStates.userId, demoUserId));

  return { success: true, userId: demoUserId };
}

/**
 * Overrides simulation time on demo_state.
 */
export async function setTime(
  db: Db | DbTx,
  demoUserId: string,
  input: SetTimeInput,
) {
  const simulationDate = input.time ? new Date(input.time) : null;

  await db
    .update(demoStates)
    .set({
      simulationNow: simulationDate,
      updatedAt: new Date(),
    })
    .where(eq(demoStates.userId, demoUserId));

  return { simulationNow: simulationDate };
}

/**
 * Simulates a dose action (take, miss, skip, snooze) on target or next-due dose.
 */
export async function simulateAction(
  db: Db | DbTx,
  demoUserId: string,
  input: SimulateActionInput,
) {
  const currentTime = now();

  // Find target dose
  let targetDose: typeof doseEvents.$inferSelect | undefined;

  if (input.doseId) {
    const [d] = await db
      .select()
      .from(doseEvents)
      .where(and(eq(doseEvents.id, input.doseId), eq(doseEvents.userId, demoUserId)))
      .limit(1);
    targetDose = d;
  } else {
    // Find nearest due or upcoming dose
    const doses = await db
      .select()
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.userId, demoUserId),
          or(eq(doseEvents.status, "due"), eq(doseEvents.status, "upcoming"), eq(doseEvents.status, "snoozed")),
        ),
      )
      .orderBy(desc(doseEvents.scheduledFor))
      .limit(1);
    targetDose = doses[0];
  }

  if (!targetDose) {
    // If no open dose, grab the latest dose
    const [latest] = await db
      .select()
      .from(doseEvents)
      .where(eq(doseEvents.userId, demoUserId))
      .orderBy(desc(doseEvents.scheduledFor))
      .limit(1);
    targetDose = latest;
  }

  if (!targetDose) {
    throw new Error("No dose events found in demo workspace.");
  }

  const doseId = targetDose.id;
  const action = input.action;

  if (action === "take") {
    await db
      .update(doseEvents)
      .set({
        status: "taken",
        takenAt: currentTime,
        statusUpdatedAt: currentTime,
      })
      .where(eq(doseEvents.id, doseId));

    await db.insert(doseActions).values({
      id: uuidv7(),
      doseEventId: doseId,
      userId: demoUserId,
      action: "take",
      occurredAt: currentTime,
    });
  } else if (action === "miss") {
    await db
      .update(doseEvents)
      .set({
        status: "missed",
        statusUpdatedAt: currentTime,
      })
      .where(eq(doseEvents.id, doseId));

    await db.insert(doseActions).values({
      id: uuidv7(),
      doseEventId: doseId,
      userId: demoUserId,
      action: "missed_auto",
      occurredAt: currentTime,
    });
  } else if (action === "skip") {
    const reason = input.skipReason || "Doctor advised temporary skip";
    await db
      .update(doseEvents)
      .set({
        status: "skipped",
        skippedAt: currentTime,
        skippedReason: reason,
        statusUpdatedAt: currentTime,
      })
      .where(eq(doseEvents.id, doseId));

    await db.insert(doseActions).values({
      id: uuidv7(),
      doseEventId: doseId,
      userId: demoUserId,
      action: "skip",
      occurredAt: currentTime,
      meta: { reason },
    });
  } else if (action === "snooze") {
    const newCount = targetDose.snoozeCount + 1;
    await db
      .update(doseEvents)
      .set({
        status: "snoozed",
        snoozeCount: newCount,
        snoozeUntil: new Date(currentTime.getTime() + 10 * 60000),
        statusUpdatedAt: currentTime,
      })
      .where(eq(doseEvents.id, doseId));

    await db.insert(doseActions).values({
      id: uuidv7(),
      doseEventId: doseId,
      userId: demoUserId,
      action: "snooze",
      occurredAt: currentTime,
    });
  }

  return { success: true, doseId, action };
}

/**
 * Applies a demo scenario block (baseline, decline, improvement, caregiver_demo).
 */
export async function applyScenario(
  db: Db | DbTx,
  demoUserId: string,
  input: ApplyScenarioInput,
) {
  const scenario = input.scenario as DemoScenario;

  if (scenario === "baseline") {
    await resetDemo(db);
    return { scenario: "baseline", message: "Restored pristine baseline adherence (90.5%)." };
  }

  if (scenario === "decline") {
    // Convert the 8 most recent doses to missed to simulate sharp decline
    const recentDoses = await db
      .select({ id: doseEvents.id })
      .from(doseEvents)
      .where(eq(doseEvents.userId, demoUserId))
      .orderBy(desc(doseEvents.scheduledFor))
      .limit(8);

    const ids = recentDoses.map((d) => d.id);
    if (ids.length > 0) {
      await db
        .update(doseEvents)
        .set({ status: "missed", statusUpdatedAt: now() })
        .where(inArray(doseEvents.id, ids));
    }

    await db
      .update(demoStates)
      .set({ scenario: "decline", updatedAt: new Date() })
      .where(eq(demoStates.userId, demoUserId));

    return { scenario: "decline", message: "Simulated adherence decline across the last 3 days." };
  }

  if (scenario === "improvement") {
    // Convert all missed doses in the last 14 days to taken
    await db
      .update(doseEvents)
      .set({ status: "taken", takenAt: now(), statusUpdatedAt: now() })
      .where(and(eq(doseEvents.userId, demoUserId), eq(doseEvents.status, "missed")));

    await db
      .update(demoStates)
      .set({ scenario: "improvement", updatedAt: new Date() })
      .where(eq(demoStates.userId, demoUserId));

    return { scenario: "improvement", message: "Simulated 100% adherence streak recovery." };
  }

  if (scenario === "caregiver_demo") {
    await generateCaregiverAlert(db, demoUserId);
    await db
      .update(demoStates)
      .set({ scenario: "caregiver_demo", hasCaregiverDemoData: true, updatedAt: new Date() })
      .where(eq(demoStates.userId, demoUserId));

    return { scenario: "caregiver_demo", message: "Connected Dr. Priya Patel and generated urgent missed-dose alert." };
  }

  return { scenario, message: "Applied scenario." };
}

/**
 * Creates a demo caregiver relationship and an alert.
 */
export async function generateCaregiverAlert(db: Db | DbTx, demoUserId: string) {
  // Ensure caregiver user exists
  let [caregiverUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_CAREGIVER_EMAIL))
    .limit(1);

  if (!caregiverUser) {
    const cgId = uuidv7();
    await db.insert(users).values({
      id: cgId,
      name: "Dr. Priya Patel",
      email: DEMO_CAREGIVER_EMAIL,
      emailVerified: true,
      timezone: "UTC",
      onboardingCompleted: true,
      isDemo: true,
    });

    [caregiverUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, cgId))
      .limit(1);
  }

  const cgId = caregiverUser!.id;

  // Ensure relationship exists
  let [rel] = await db
    .select()
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.patientUserId, demoUserId),
        eq(caregiverRelationships.caregiverUserId, cgId),
      ),
    )
    .limit(1);

  if (!rel) {
    const relId = uuidv7();
    await db.insert(caregiverRelationships).values({
      id: relId,
      patientUserId: demoUserId,
      caregiverUserId: cgId,
      relationType: "professional",
      status: "active",
      permissions: {
        viewDoses: true,
        viewMedications: true,
        viewAdherence: true,
        receiveAlerts: true,
      },
    });

    [rel] = await db
      .select()
      .from(caregiverRelationships)
      .where(eq(caregiverRelationships.id, relId))
      .limit(1);
  }

  // Find a dose to trigger alert on
  const [dose] = await db
    .select()
    .from(doseEvents)
    .where(eq(doseEvents.userId, demoUserId))
    .orderBy(desc(doseEvents.scheduledFor))
    .limit(1);

  if (dose) {
    // Mark as missed
    await db
      .update(doseEvents)
      .set({ status: "missed", statusUpdatedAt: now() })
      .where(eq(doseEvents.id, dose.id));

    // Create caregiver alert
    const alertId = uuidv7();
    await db.insert(caregiverAlerts).values({
      id: alertId,
      relationshipId: rel!.id,
      patientUserId: demoUserId,
      caregiverUserId: cgId,
      doseEventId: dose.id,
      type: "missed_dose",
      title: "Missed Dose Alert",
      body: "Arun Kumar has missed a scheduled medication dose.",
      status: "new",
      createdAt: now(),
    });

    // Notify patient
    await createNotification(db, {
      userId: demoUserId,
      type: "caregiver_alert",
      title: "Caregiver Alert Dispatched",
      body: `Dr. Priya Patel was notified of your missed dose.`,
      entityType: "caregiverAlert",
      entityId: alertId,
    });
  }

  return { success: true };
}

/**
 * Runs generative AI or fallback insights on demo data.
 */
export async function generateDemoInsight(db: Db | DbTx, demoUserId: string) {
  return generateInsights(db, demoUserId);
}
