import type { MedicationStatus } from "@/shared/enums";
import type { ScheduleSlotInput } from "@/shared/validations/schedule";

export type MedicationFilterTab = "all" | "active" | "paused" | "archived";

export type FrequencyPreset = "once-daily" | "twice-daily" | "three-times-daily" | "custom";

export interface MedicationFormData {
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  instructions: string;
  notes: string;
  status: MedicationStatus;
  startDate: string;
  endDate: string;
  color: string;
  remindersEnabled: boolean;
  reminderBeforeMinutes: number;
  slots: ScheduleSlotInput[];
}
