import type { OnboardingInput } from "@/shared/validations/onboarding";

export type OnboardingWizardStep = 1 | 2 | 3;

export interface OnboardingWizardState extends OnboardingInput {
  name?: string | null;
}

export const DEFAULT_ONBOARDING_STATE: OnboardingWizardState = {
  timezone: "Asia/Kolkata",
  missedAfterMinutes: 30,
  snoozeMinutes: 10,
  maxSnoozes: 3,
  reminderBeforeMinutes: 5,
  addSampleMed: true,
};
