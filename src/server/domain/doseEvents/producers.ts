import { formatInstant } from "@/lib/format";
import type { DbClient } from "@/server/db/helpers";
import { caregiverService } from "@/server/domain/caregiver/service";
import { notificationsService } from "@/server/domain/notifications/service";

export interface DoseReminderRef {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledFor: Date;
}

export interface MissedDoseRef {
  id: string;
  medicationId: string;
  scheduledFor: Date;
  missedDeadline: Date;
}

export interface DoseFlowProducers {
  onUpcoming: (
    db: DbClient,
    userId: string,
    event: DoseReminderRef,
    at: Date,
    timeZone: string,
  ) => Promise<void> | void;
  onDue: (
    db: DbClient,
    userId: string,
    event: DoseReminderRef,
    at: Date,
    timeZone: string,
  ) => Promise<void> | void;
}

export const doseReminderProducers: DoseFlowProducers = {
  onUpcoming: async (db, userId, event, at, timeZone) => {
    await notificationsService.create(db, {
      userId,
      type: "upcoming_dose",
      title: "Dose coming up",
      body: `${event.medicationName} is scheduled for ${formatInstant(event.scheduledFor, timeZone)}.`,
      entityType: "doseEvent",
      entityId: event.id,
      createdAt: at,
    });
  },
  onDue: async (db, userId, event, at, timeZone) => {
    await notificationsService.create(db, {
      userId,
      type: "due_dose",
      title: "Dose due now",
      body: `${event.medicationName} is due at ${formatInstant(event.scheduledFor, timeZone)}.`,
      entityType: "doseEvent",
      entityId: event.id,
      createdAt: at,
    });
  },
};

export interface MissedFlowProducers {
  onMissed: (db: DbClient, userId: string, event: MissedDoseRef, at: Date) => Promise<void> | void;
}

export const missedFlowProducers: MissedFlowProducers = {
  onMissed: async (db, userId, event, at) => {
    await notificationsService.create(db, {
      userId,
      type: "missed_dose",
      title: "Missed dose",
      body: `A dose scheduled for ${event.scheduledFor.toISOString()} was missed.`,
      entityType: "doseEvent",
      entityId: event.id,
      createdAt: at,
    });
    await caregiverService.createMissedDoseAlert(db, userId, event, at);
  },
};
