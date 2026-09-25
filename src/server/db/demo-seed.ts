import { eq } from "drizzle-orm";

import type { Db, DbTx } from "./helpers";
import { addDays, atTime, upsertUser, utcDateKey, uuidv7 } from "./helpers";
import {
  adherenceDaily,
  aiInsights,
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  demoStates,
  doseActions,
  doseEvents,
  medications,
  medicationSchedules,
  notifications,
  userPreferences,
  users,
  type DoseEventStatus,
} from "./schema";

export const DEMO_USER_EMAIL = "arun@medvault.local";
export const DEMO_PATIENT_NAME = "Arun Kumar";

/* ── §19 exact construction ──
   Window: today-16 … today (17 calendar days). 84 doses total:
   Metformin 08:00 + 20:00 daily (17d), Vitamin D 10:00 daily (17d), Aspirin 08:00 daily
   (17d), Vitamin B12 09:00 daily (16d — starts day 1). The final 7 days are perfect.
   Outcomes: 5 missed (Metformin evening, days 0-3 + 9), 3 skipped (B12, days 1-3),
   8 snoozed-then-taken (Vitamin D morning pattern 6 + Metformin evening 2).
   Totals: 84 scheduled / 76 taken / 5 missed / 3 skipped → 76/84 = 90.5%. */

const MEDS = [
  { key: "metformin", name: "Metformin", dosageAmount: "500", dosageUnit: "mg", color: "#10b981", times: [8, 20] },
  { key: "vitd", name: "Vitamin D", dosageAmount: "1000", dosageUnit: "IU", color: "#f59e0b", times: [10] },
  { key: "aspirin", name: "Aspirin", dosageAmount: "75", dosageUnit: "mg", color: "#3b82f6", times: [8] },
  { key: "b12", name: "Vitamin B12", dosageAmount: "500", dosageUnit: "mcg", color: "#f472b6", times: [9] },
] as const;

const DAY_COUNT = 17; // days 0..16; >=10 is the perfect streak window
const MET_PM_MISSED_DAYS = [0, 1, 2, 3, 9] as const; // 5 missed (Metformin 20:00); last miss on day 9 so the honest §10.5 rule yields exactly the 7-day tail streak
const B12_SKIPPED_DAYS = [1, 2, 3] as const; // 3 skipped
const VITD_SNOOZED_DAYS = [0, 1, 2, 3, 4, 5] as const; // 6 snoozes (morning pattern)
const MET_PM_SNOOZED_DAYS = [5, 6] as const; // 2 more snoozes → 8 total
const MISSED_AFTER_MIN = 30;
const SNOOZE_MINUTES = 10;

function outcomeFor(
  medKey: (typeof MEDS)[number]["key"],
  hour: number,
  dayIndex: number,
): { status: DoseEventStatus; snoozed: boolean; skippedReason?: string } {
  if (medKey === "metformin" && hour === 20) {
    if ((MET_PM_MISSED_DAYS as readonly number[]).includes(dayIndex)) return { status: "missed", snoozed: false };
    if ((MET_PM_SNOOZED_DAYS as readonly number[]).includes(dayIndex)) return { status: "taken", snoozed: true };
  }
  if (medKey === "b12" && (B12_SKIPPED_DAYS as readonly number[]).includes(dayIndex)) {
    return { status: "skipped", snoozed: false, skippedReason: dayIndex === 1 ? "Fasting today" : undefined };
  }
  if (medKey === "vitd" && (VITD_SNOOZED_DAYS as readonly number[]).includes(dayIndex)) {
    return { status: "taken", snoozed: true };
  }
  return { status: "taken", snoozed: false };
}

async function wipeDemoRows(tx: DbTx, userId: string) {
  await tx.delete(caregiverAlerts).where(eq(caregiverAlerts.patientUserId, userId));
  await tx.delete(caregiverRelationships).where(eq(caregiverRelationships.patientUserId, userId));
  await tx.delete(caregiverInvitations).where(eq(caregiverInvitations.patientUserId, userId));
  await tx.delete(doseActions).where(eq(doseActions.userId, userId));
  await tx.delete(demoStates).where(eq(demoStates.userId, userId));
  await tx.delete(aiInsights).where(eq(aiInsights.userId, userId));
  await tx.delete(notifications).where(eq(notifications.userId, userId));
  await tx.delete(adherenceDaily).where(eq(adherenceDaily.userId, userId));
  // medications cascade → medication_schedules + dose_events → dose_actions(again, safe)
  await tx.delete(medications).where(eq(medications.userId, userId));
}

/**
 * Rebuild the §19 demo workspace transactionally. Idempotent: every run ends with the same
 * row counts (the 17-day window rolls with "today" so the totals are invariant).
 */
export async function seedDemoWorkspace(db: Db): Promise<{
  userId: string;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  snoozed: number;
}> {
  return db.transaction(async (tx) => {
    const userId = await upsertUser(tx, {
      name: DEMO_PATIENT_NAME,
      email: DEMO_USER_EMAIL,
      timezone: "Asia/Kolkata",
      onboardingCompleted: true,
      isDemo: true,
    });

    await wipeDemoRows(tx, userId);

    await tx
      .insert(userPreferences)
      .values({
        userId,
        theme: "system",
        notificationPrefs: { doseReminders: true, caregiverMissedAlerts: true, insights: true, sounds: true },
        caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: null, dailyDigest: false },
      })
      .onConflictDoNothing();

    const start = addDays(new Date(), -(DAY_COUNT - 1));
    const medRows = MEDS.map((m) => ({
      id: uuidv7(),
      userId,
      name: m.name,
      dosageAmount: m.dosageAmount,
      dosageUnit: m.dosageUnit,
      color: m.color,
      status: "active" as const,
      startDate: utcDateKey(start),
    }));

    const slotRows: (typeof medicationSchedules.$inferInsert)[] = [];
    medRows.forEach((medRow, medIdx) => {
      MEDS[medIdx]!.times.forEach((hour) => {
        slotRows.push({
          id: uuidv7(),
          medicationId: medRow.id,
          timeOfDay: `${String(hour).padStart(2, "0")}:00`,
        });
      });
    });

    await tx.insert(medications).values(medRows);
    await tx.insert(medicationSchedules).values(slotRows);

    const events: (typeof doseEvents.$inferInsert)[] = [];
    const actions: (typeof doseActions.$inferInsert)[] = [];
    const daily: Record<string, { scheduled: number; taken: number; missed: number; skipped: number; snoozed: number }> = {};

    for (let i = 0; i < DAY_COUNT; i++) {
      const day = addDays(start, i);
      const dateKey = utcDateKey(day);
      const bucket = (daily[dateKey] ??= { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 });

      for (const [medIdx, med] of MEDS.entries()) {
        if (med.key === "b12" && i === 0) continue; // B12 starts day 1
        for (const hour of med.times) {
          const scheduledFor = atTime(day, hour, 0);
          const outcome = outcomeFor(med.key, hour, i);
          const medRow = medRows[medIdx]!;
          const slot = slotRows.find((s) => s.medicationId === medRow.id && s.timeOfDay === `${String(hour).padStart(2, "0")}:00`)!;
          const eventId = uuidv7();

          bucket.scheduled += 1;
          events.push({
            id: eventId,
            userId,
            medicationId: medRow.id,
            scheduleId: slot.id,
            scheduledFor,
            status: outcome.status,
            isDemo: true,
            source: "demo",
            statusUpdatedAt: scheduledFor,
          });

          if (outcome.status === "taken") {
            const takenAt = new Date(scheduledFor.getTime() + (outcome.snoozed ? SNOOZE_MINUTES : 12) * 60_000);
            bucket.taken += 1;
            if (outcome.snoozed) {
              bucket.snoozed += 1;
              const snoozeUntil = new Date(scheduledFor.getTime() + SNOOZE_MINUTES * 60_000);
              events[events.length - 1]!.snoozeCount = 1;
              events[events.length - 1]!.snoozeUntil = snoozeUntil;
              events[events.length - 1]!.takenAt = takenAt;
              actions.push({
                id: uuidv7(),
                userId,
                doseEventId: eventId,
                action: "snooze",
                occurredAt: new Date(scheduledFor.getTime() + 5 * 60_000),
                meta: { snoozeMinutes: SNOOZE_MINUTES, snoozeUntil, source: "demo" },
              });
            } else {
              events[events.length - 1]!.takenAt = takenAt;
            }
            actions.push({ id: uuidv7(), userId, doseEventId: eventId, action: "take", occurredAt: takenAt, meta: { source: "demo" } });
          } else if (outcome.status === "missed") {
            const missedDeadline = new Date(scheduledFor.getTime() + MISSED_AFTER_MIN * 60_000);
            bucket.missed += 1;
            events[events.length - 1]!.missedDeadline = missedDeadline;
            events[events.length - 1]!.statusUpdatedAt = missedDeadline;
            actions.push({
              id: uuidv7(),
              userId,
              doseEventId: eventId,
              action: "missed_auto",
              occurredAt: missedDeadline,
              meta: { source: "demo" },
            });
          } else {
            const skippedAt = new Date(scheduledFor.getTime() + 20 * 60_000);
            bucket.skipped += 1;
            events[events.length - 1]!.skippedAt = skippedAt;
            events[events.length - 1]!.skippedReason = outcome.skippedReason;
            actions.push({
              id: uuidv7(),
              userId,
              doseEventId: eventId,
              action: "skip",
              occurredAt: skippedAt,
              meta: { skipReason: outcome.skippedReason, source: "demo" },
            });
          }
        }
      }
    }

    await tx.insert(doseEvents).values(events);
    await tx.insert(doseActions).values(actions);

    const adherenceRows: (typeof adherenceDaily.$inferInsert)[] = Object.entries(daily).map(([date, d], i) => {
      const attended = d.taken + d.missed + d.skipped;
      const percent = attended > 0 ? ((d.taken / attended) * 100).toFixed(2) : "0.00";
      return {
        id: uuidv7(),
        userId,
        date,
        scheduled: d.scheduled,
        taken: d.taken,
        missed: d.missed,
        skipped: d.skipped,
        snoozed: d.snoozed,
        adherencePercent: percent,
        streakDay: i >= 10 && d.missed === 0 && d.skipped === 0,
      };
    });
    await tx.insert(adherenceDaily).values(adherenceRows);

    const metforminId = medRows[0]!.id;
    const vitdId = medRows[1]!.id;
    await tx.insert(aiInsights).values([
      {
        id: uuidv7(),
        userId,
        category: "missed_analysis",
        summary: "Evening Metformin doses are often missed",
        detail: "5 of your last 10 evening doses were missed — consider a later-time reminder.",
        suggestedActionType: "review_schedule",
        dataSnapshot: { medicationId: metforminId, missedEvening: 5 },
        source: "demo",
        confidence: "90.40",
      },
      {
        id: uuidv7(),
        userId,
        category: "snooze_pattern",
        summary: "Vitamin D is frequently snoozed each morning",
        detail: "6 morning snoozes in the last 10 days — try pairing it with breakfast.",
        suggestedActionType: "review_reminders",
        dataSnapshot: { medicationId: vitdId, snoozes: 6 },
        source: "demo",
        confidence: "85.00",
      },
      {
        id: uuidv7(),
        userId,
        category: "general",
        summary: "Your 7-day streak looks great",
        detail: "Perfect adherence over the last 7 days. Keep it up!",
        suggestedActionType: "encourage",
        dataSnapshot: { streakDays: 7 },
        source: "demo",
        confidence: "99.00",
      },
    ]);

    await tx.insert(demoStates).values({
      id: uuidv7(),
      userId,
      timeMultiplier: 1,
      scenario: "baseline",
      hasCaregiverDemoData: false,
    });

    const totals = { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 };
    for (const d of Object.values(daily)) {
      totals.scheduled += d.scheduled;
      totals.taken += d.taken;
      totals.missed += d.missed;
      totals.skipped += d.skipped;
      totals.snoozed += d.snoozed;
    }

    return { userId, ...totals };
  });
}

/** §19 totals pulled live from the DB (sums are seeds computed independently here). */
export async function demoTotals(db: Db) {
  const [demoUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_USER_EMAIL)).limit(1);
  if (!demoUser) return null;

  const events = await db.select().from(doseEvents).where(eq(doseEvents.userId, demoUser.id));
  const snoozeActions = await db
    .select()
    .from(doseActions)
    .where(eq(doseActions.userId, demoUser.id));
  const days = await db.select().from(adherenceDaily).where(eq(adherenceDaily.userId, demoUser.id));

  return {
    scheduled: events.length,
    taken: events.filter((e) => e.status === "taken").length,
    missed: events.filter((e) => e.status === "missed").length,
    skipped: events.filter((e) => e.status === "skipped").length,
    snoozedEvents: events.filter((e) => (e.snoozeCount ?? 0) > 0).length,
    snoozeActions: snoozeActions.filter((a) => a.action === "snooze").length,
    streakDays: days.filter((d) => d.streakDay).length,
    dayRows: days.length,
    percent: Number(events.length ? ((events.filter((e) => e.status === "taken").length / events.length) * 100).toFixed(1) : 0),
  };
}