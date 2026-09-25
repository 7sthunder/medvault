import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { demoStates, doseEvents, users } from "@/server/db/schema";
import { DEMO_USER_EMAIL, seedDemoWorkspace } from "@/server/db/demo-seed";
import { recomputeRange } from "@/server/domain/adherence/materialize";
import { caregiverService } from "@/server/domain/caregiver/service";
import { doseActionsService } from "@/server/domain/doseActions/service";
import type { MissedDoseRef } from "@/server/domain/doseEvents/producers";
import { insightsService } from "@/server/domain/insights/service";
import type { DemoScenario, DoseEventStatus } from "@/shared/enums";
import { addLocalDays, combineDateAndTime, localDateKey, startOfLocalDay } from "@/shared/times";
import type { DemoActionResultDTO, DemoStateDTO } from "@/shared/types";
import type { DemoAction } from "@/shared/validations/settings";

/**
 * Phase 18 — demo domain (plan §10.8).
 *
 * Every demo capability runs through the *real* domain services (`doseActionsService`,
 * `caregiverService`, `insightsService`) against the *real* demo user, so a simulated session
 * produces exactly the state a real session would. Nothing in the app has a "demo" code path to
 * drift out of sync: the only things demo mode changes are whose rows are read and what "now" is.
 *
 * Isolation is structural. The demo subject is always resolved server-side from
 * `DEMO_USER_EMAIL`; it never arrives from a request body, query string or cookie payload. That
 * is what makes it impossible for the simulation controls to touch a real account.
 */

const DEMO_TIMEZONE = "Asia/Kolkata";
const CAREGIVER_DEMO_EMAIL = "dr.meera@medvault.local";
const CAREGIVER_DEMO_NAME = "Dr. Meera Iyer";
const SCENARIO_DAYS = 14;

/** Statuses an interactive simulation can still transition (shared/calc/doseState). */
const TAKEABLE = ["upcoming", "due", "snoozed", "missed"] as const;

/**
 * Statuses a *scenario* may rewrite.
 *
 * Wider than {@link TAKEABLE} on purpose: a scenario reshapes history, so it must be able to turn
 * a settled `skipped` or `taken` row into a `missed` one and back. `upcoming` is still excluded so
 * today's slots stay actionable and the demo user can take a dose right after applying a scenario.
 */
const REWRITABLE = ["due", "snoozed", "taken", "missed", "skipped"] as const;

const DEMO_CAREGIVER_PERMISSIONS = {
  viewAdherence: true,
  viewMedications: true,
  receiveMissedDoseAlerts: true,
  receiveInsights: true,
  canAcknowledgeAlerts: true,
} as const;

/** Demo-specific failure so the router maps to a tRPC code without string matching. */
export class DemoError extends Error {
  constructor(
    readonly kind: "not_found" | "conflict" | "forbidden" | "bad_request",
    message: string,
  ) {
    super(message);
    this.name = "DemoError";
  }
}

function rethrow(error: unknown, fallback: "not_found" | "conflict" | "bad_request"): never {
  // A downstream `TRPCError` already carries a client-safe message; don't wrap it twice.
  if (error instanceof Error && error.name === "TRPCError") throw error;
  throw new DemoError(fallback, error instanceof Error ? error.message : "Unknown demo error");
}

/** The demo user as a row subset that mirrors what a Better Auth session user exposes. */
export interface DemoSubject {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  timezone: string;
  onboardingCompleted: boolean;
  isDemo: boolean;
}

const SUBJECT_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerified: users.emailVerified,
  image: users.image,
  timezone: users.timezone,
  onboardingCompleted: users.onboardingCompleted,
  isDemo: users.isDemo,
};

async function findDemoUser(db: DbClient): Promise<DemoSubject | null> {
  const [row] = await db
    .select(SUBJECT_COLUMNS)
    .from(users)
    .where(eq(users.email, DEMO_USER_EMAIL))
    .limit(1);
  return row ?? null;
}

/** The demo subject, fully seeded on first use. */
export async function ensureDemoUser(db: DbClient): Promise<DemoSubject> {
  const existing = await findDemoUser(db);
  if (existing) return existing;

  const seeded = await seedDemoWorkspace(db);
  const [row] = await db
    .select(SUBJECT_COLUMNS)
    .from(users)
    .where(eq(users.id, seeded.userId))
    .limit(1);
  if (!row) throw new DemoError("not_found", "The demo workspace could not be created.");
  return row;
}

async function loadStateRow(db: DbClient, userId: string) {
  const [row] = await db.select().from(demoStates).where(eq(demoStates.userId, userId)).limit(1);
  return row ?? null;
}

async function writeState(
  db: DbClient,
  userId: string,
  patch: Partial<{
    simulationNow: Date | null;
    scenario: DemoScenario;
    hasCaregiverDemoData: boolean;
  }>,
): Promise<void> {
  const existing = await loadStateRow(db, userId);
  const at = new Date();
  if (existing) {
    await db
      .update(demoStates)
      .set({ ...patch, updatedAt: at })
      .where(eq(demoStates.id, existing.id));
    return;
  }
  await db.insert(demoStates).values({
    id: uuidv7(),
    userId,
    simulationNow: patch.simulationNow ?? null,
    scenario: patch.scenario ?? "baseline",
    hasCaregiverDemoData: patch.hasCaregiverDemoData ?? false,
    updatedAt: at,
  });
}

async function readTotals(db: DbClient, userId: string): Promise<DemoStateDTO["totals"]> {
  const [row] = await db
    .select({
      scheduled: sql<number>`count(*)::int`,
      taken: sql<number>`count(*) filter (where ${doseEvents.status} = 'taken')::int`,
      missed: sql<number>`count(*) filter (where ${doseEvents.status} = 'missed')::int`,
      skipped: sql<number>`count(*) filter (where ${doseEvents.status} = 'skipped')::int`,
      snoozed: sql<number>`count(*) filter (where ${doseEvents.snoozeCount} > 0)::int`,
    })
    .from(doseEvents)
    .where(eq(doseEvents.userId, userId));
  return row ?? { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 };
}

/** The `/demo` dock + clock payload. Never throws for a missing workspace. */
export async function readState(db: DbClient, userId: string): Promise<DemoStateDTO> {
  const user = await findDemoUser(db);
  if (!user) {
    return {
      active: false,
      scenario: "baseline",
      simulationNow: null,
      realNow: new Date(),
      hasCaregiverDemoData: false,
      totals: { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 },
    };
  }

  const [state, totals] = await Promise.all([loadStateRow(db, userId), readTotals(db, userId)]);
  return {
    active: true,
    scenario: state?.scenario ?? "baseline",
    simulationNow: state?.simulationNow ?? null,
    realNow: new Date(),
    hasCaregiverDemoData: state?.hasCaregiverDemoData ?? false,
    totals,
  };
}

/**
 * The effective "now" for demo reads, or `null` when the demo clock is off (real time).
 * The tRPC context installs this via `setNowImpl` so schedule/dashboard/adherence follow it.
 */
export async function resolveSimulationNow(db: DbClient, userId: string): Promise<Date | null> {
  const state = await loadStateRow(db, userId);
  return state?.simulationNow ?? null;
}

/** The next dose the demo user could act on, or `null` when nothing is actionable. */
async function nextActionableDose(
  db: DbClient,
  userId: string,
  simulationNow: Date,
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: doseEvents.id })
    .from(doseEvents)
    .where(
      and(
        eq(doseEvents.userId, userId),
        inArray(doseEvents.status, [...TAKEABLE]),
        lte(doseEvents.scheduledFor, simulationNow),
      ),
    )
    .orderBy(asc(doseEvents.scheduledFor))
    .limit(1);
  return row ?? null;
}

export const demoService = {
  /**
   * §10.8 `simulate.action` — map a dock button onto the *real* dose action, so the resulting
   * event, audit row, notification and `adherence_daily` recompute all happen for real.
   */
  async simulateAction(
    db: DbClient,
    input: { action: DemoAction; doseEventId?: string; skipReason?: string },
  ): Promise<DemoActionResultDTO> {
    const demo = await ensureDemoUser(db);
    const at = (await resolveSimulationNow(db, demo.id)) ?? new Date();
    const action = input.action;

    let doseId = input.doseEventId;
    if (!doseId) {
      const next = await nextActionableDose(db, demo.id, at);
      if (!next) {
        return {
          ok: false,
          action,
          detail: "No dose is due. Move the demo clock forward to reach the next slot.",
          doseEventId: null,
          changed: 0,
        };
      }
      doseId = next.id;
    }

    try {
      if (action === "take") {
        const result = await doseActionsService.take(db, demo.id, doseId, {
          timeZone: demo.timezone,
          occurredAt: at,
        });
        return actionResult(action, result.doseId, result.changed, result.status);
      }
      if (action === "snooze") {
        const result = await doseActionsService.snooze(db, demo.id, doseId, {
          timeZone: demo.timezone,
        });
        return actionResult(action, result.doseId, result.changed, result.status);
      }
      if (action === "skip") {
        const result = await doseActionsService.skip(db, demo.id, doseId, {
          timeZone: demo.timezone,
          skipReason: input.skipReason,
        });
        return actionResult(action, result.doseId, result.changed, result.status);
      }
      return markMissed(db, demo.id, doseId, at);
    } catch (error) {
      return rethrow(error, "bad_request");
    }
  },

  /**
   * §10.8 `generate.adherenceChange` — rewrite the last {@link SCENARIO_DAYS} days of dose events
   * so the charts move, then recompute `adherence_daily` once for the whole window. Rows are only
   * rewritten while still actionable and only in the past, so the demo user can act on "today"
   * right after a scenario is applied.
   */
  async applyScenario(db: DbClient, scenario: DemoScenario): Promise<DemoActionResultDTO> {
    const demo = await ensureDemoUser(db);
    const simulationNow = (await resolveSimulationNow(db, demo.id)) ?? new Date();
    const dayStart = startOfLocalDay(simulationNow, demo.timezone);
    const from = addLocalDays(dayStart, -(SCENARIO_DAYS - 1), demo.timezone);
    const to = combineDateAndTime(
      localDateKey(simulationNow, demo.timezone),
      "23:59",
      demo.timezone,
    );

    const events = await db
      .select({
        id: doseEvents.id,
        status: doseEvents.status,
        scheduledFor: doseEvents.scheduledFor,
      })
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.userId, demo.id),
          gte(doseEvents.scheduledFor, from),
          lte(doseEvents.scheduledFor, to),
          lte(doseEvents.scheduledFor, simulationNow),
        ),
      )
      .orderBy(asc(doseEvents.scheduledFor));

    let changed = 0;
    for (const [index, event] of events.entries()) {
      const hourInZone = Number(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          hour12: false,
          timeZone: demo.timezone,
        }).format(new Date(event.scheduledFor)),
      );
      const desired = scenarioOutcome(scenario, index, hourInZone);
      if (desired === event.status) continue;

      const updated = await db
        .update(doseEvents)
        .set(desiredColumns(desired, event.scheduledFor, simulationNow))
        .where(
          and(
            eq(doseEvents.id, event.id),
            eq(doseEvents.userId, demo.id),
            inArray(doseEvents.status, [...REWRITABLE]),
          ),
        )
        .returning({ id: doseEvents.id });
      changed += updated.length;
    }

    await recomputeRange(db, {
      userId: demo.id,
      timeZone: demo.timezone,
      fromKey: localDateKey(from, demo.timezone),
      toKey: localDateKey(to, demo.timezone),
      now: simulationNow,
    });
    await writeState(db, demo.id, { scenario });

    return {
      ok: true,
      action: "scenario",
      detail: scenarioMessage(scenario, changed),
      doseEventId: null,
      changed,
    };
  },

  /**
   * §10.8 `generate.caregiverAlert` — link the demo caregiver (idempotent, through the real
   * invite/accept pair) and then raise a *real* missed-dose alert, so the alert, the caregiver
   * overview and the notification fan-out are genuinely produced rather than faked.
   */
  async generateCaregiverAlert(db: DbClient): Promise<DemoActionResultDTO> {
    const demo = await ensureDemoUser(db);
    const at = (await resolveSimulationNow(db, demo.id)) ?? new Date();

    try {
      const overview = await caregiverService.overview(db, demo.id);
      const hasActive = overview.asPatient.some((r) => r.status === "active");
      if (!hasActive) {
        const caregiver = await ensureDemoCaregiver(db);
        const invite = await caregiverService.invite(db, demo.id, {
          email: CAREGIVER_DEMO_EMAIL,
          relationType: "professional",
          permissions: { ...DEMO_CAREGIVER_PERMISSIONS },
        });
        await caregiverService.accept(db, caregiver.id, invite.token);
      }

      const [missed] = await db
        .select({
          id: doseEvents.id,
          medicationId: doseEvents.medicationId,
          scheduledFor: doseEvents.scheduledFor,
          missedDeadline: doseEvents.missedDeadline,
        })
        .from(doseEvents)
        .where(
          and(
            eq(doseEvents.userId, demo.id),
            eq(doseEvents.status, "missed"),
            lte(doseEvents.missedDeadline, at),
          ),
        )
        .orderBy(desc(doseEvents.scheduledFor))
        .limit(1);

      if (!missed?.missedDeadline) {
        return {
          ok: false,
          action: "caregiver_alert",
          detail: "No missed dose yet. Move the demo clock forward, then try again.",
          doseEventId: null,
          changed: 0,
        };
      }

      const ref: MissedDoseRef = {
        id: missed.id,
        medicationId: missed.medicationId,
        scheduledFor: missed.scheduledFor,
        missedDeadline: missed.missedDeadline,
      };
      const created = await caregiverService.createMissedDoseAlert(db, demo.id, ref, at);
      await writeState(db, demo.id, { hasCaregiverDemoData: true });

      return {
        ok: created > 0,
        action: "caregiver_alert",
        detail:
          created > 0
            ? "Caregiver linked and a missed-dose alert was raised."
            : "Caregiver linked, but they already have an alert for that dose.",
        doseEventId: missed.id,
        changed: created,
      };
    } catch (error) {
      return rethrow(error, "conflict");
    }
  },

  /** §10.8 `generate.aiInsight` — run the real insights pipeline over demo data. */
  async generateInsight(db: DbClient): Promise<DemoActionResultDTO> {
    const demo = await ensureDemoUser(db);
    try {
      const result = await insightsService.generate(db, demo.id, demo.timezone);
      const count = result.items?.length ?? 0;
      return {
        ok: count > 0,
        action: "insight",
        detail:
          count > 0
            ? `Generated ${count} insight${count === 1 ? "" : "s"} from the demo history.`
            : "No insight could be generated from the demo history yet.",
        doseEventId: null,
        changed: count,
      };
    } catch (error) {
      return rethrow(error, "conflict");
    }
  },

  /** §10.8 `setTime` — write `demo_state.simulationNow`; all demo reads then follow it. */
  async setTime(db: DbClient, simulationNow: Date | null): Promise<DemoStateDTO> {
    const demo = await ensureDemoUser(db);
    await writeState(db, demo.id, { simulationNow });
    return readState(db, demo.id);
  },

  /** The dock's "+1 day" affordance — always lands on a local midnight in the demo timezone. */
  async advanceDays(db: DbClient, days: number): Promise<DemoStateDTO> {
    const demo = await ensureDemoUser(db);
    const current = (await resolveSimulationNow(db, demo.id)) ?? new Date();
    const dayStart = startOfLocalDay(current, demo.timezone);
    return demoService.setTime(db, addLocalDays(dayStart, days, demo.timezone));
  },

  /** §10.8 `reset` — wipe demo-owned rows and reseed the exact §19 fixture. */
  async reset(db: DbClient): Promise<DemoStateDTO> {
    const existing = await findDemoUser(db);
    if (existing) {
      await writeState(db, existing.id, {
        simulationNow: null,
        scenario: "baseline",
        hasCaregiverDemoData: false,
      });
    }
    const seeded = await seedDemoWorkspace(db);
    return readState(db, seeded.userId);
  },
};

function actionResult(
  action: DemoAction,
  doseEventId: string,
  changed: boolean,
  status: DoseEventStatus | null | undefined,
): DemoActionResultDTO {
  const label: Record<DemoAction, string> = {
    take: "Dose marked as taken.",
    miss: "Dose marked as missed.",
    skip: "Dose skipped.",
    snooze: "Dose snoozed.",
  };
  return {
    ok: changed,
    action,
    detail: changed ? label[action] : `No change — that dose is already ${status ?? "settled"}.`,
    doseEventId,
    changed: changed ? 1 : 0,
  };
}

/**
 * `miss` has no dedicated action service (a dose becomes missed when the reconcile pass passes
 * the deadline), so the demo writes the same columns the reconciler would — scoped to a dose the
 * demo user owns and only while that dose is still actionable.
 */
async function markMissed(
  db: DbClient,
  userId: string,
  doseId: string,
  at: Date,
): Promise<DemoActionResultDTO> {
  const updated = await db
    .update(doseEvents)
    .set({ status: "missed", takenAt: null, snoozeUntil: null, statusUpdatedAt: at })
    .where(
      and(
        eq(doseEvents.id, doseId),
        eq(doseEvents.userId, userId),
        inArray(doseEvents.status, [...TAKEABLE]),
      ),
    )
    .returning({ id: doseEvents.id });

  const changed = updated.length > 0;
  return {
    ok: changed,
    action: "miss",
    detail: changed ? "Dose marked as missed." : "No change — that dose can't be marked missed.",
    doseEventId: doseId,
    changed: changed ? 1 : 0,
  };
}

/**
 * Scenario shape. Position within the window encodes the trend so the resulting adherence
 * percent differs meaningfully between scenarios:
 *  - `baseline`    — everything taken.
 *  - `decline`     — healthy at the start of the window, failing at the end.
 *  - `improvement` — the mirror image, so the trend line reverses.
 * Evening doses are the failure point in `decline` because the §19 fixture's own miss pattern is
 * an afternoon one, which keeps the resulting insight coherent with that story.
 */
function scenarioOutcome(
  scenario: DemoScenario,
  dayIndex: number,
  hour: number,
): "taken" | "missed" | "skipped" {
  if (scenario === "baseline") return "taken";
  const progress = dayIndex / Math.max(1, SCENARIO_DAYS - 1);
  const evening = hour >= 12;
  if (scenario === "decline") {
    if (evening && progress >= 0.35) return "missed";
    if (!evening && progress >= 0.7) return "skipped";
    return "taken";
  }
  if (scenario === "improvement") {
    if (progress < 0.35) return evening ? "missed" : "skipped";
    return "taken";
  }
  return "taken";
}

function desiredColumns(desired: "taken" | "missed" | "skipped", scheduledFor: Date, at: Date) {
  if (desired === "missed") {
    return {
      status: "missed" as const,
      takenAt: null,
      skippedReason: null,
      snoozeCount: 0,
      snoozeUntil: null,
      statusUpdatedAt: at,
    };
  }
  if (desired === "skipped") {
    return {
      status: "skipped" as const,
      takenAt: null,
      skippedReason: "Demo scenario",
      snoozeCount: 0,
      snoozeUntil: null,
      statusUpdatedAt: at,
    };
  }
  return {
    status: "taken" as const,
    // Taken "on time" relative to the slot, so streaks read the way a real on-time history does.
    takenAt: scheduledFor,
    skippedReason: null,
    snoozeCount: 0,
    snoozeUntil: null,
    statusUpdatedAt: at,
  };
}

function scenarioMessage(scenario: DemoScenario, changed: number): string {
  const label =
    scenario === "decline" ? "declining" : scenario === "improvement" ? "improving" : "flat";
  if (changed === 0) return "Nothing to change — the window was already fully settled.";
  return `Applied a ${label} pattern across ${changed} past dose${changed === 1 ? "" : "s"}.`;
}

/**
 * Creates the demo caregiver user if absent. Preferences are left to the default reader, so this
 * stays a single-row insert with nothing to get wrong.
 */
async function ensureDemoCaregiver(db: DbClient): Promise<{ id: string }> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, CAREGIVER_DEMO_EMAIL))
    .limit(1);
  if (existing) return existing;

  const id = uuidv7();
  await db.insert(users).values({
    id,
    name: CAREGIVER_DEMO_NAME,
    email: CAREGIVER_DEMO_EMAIL,
    emailVerified: true,
    timezone: DEMO_TIMEZONE,
    isDemo: true,
  });
  return { id };
}
