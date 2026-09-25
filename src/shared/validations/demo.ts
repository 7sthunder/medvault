import { z } from "zod";
import { DEMO_SCENARIOS } from "../enums";

export const simulateActionSchema = z.object({
  action: z.enum(["take", "miss", "skip", "snooze"]),
  doseId: z.string().optional(),
  skipReason: z.string().max(200).optional(),
});

export const applyScenarioSchema = z.object({
  scenario: z.enum(DEMO_SCENARIOS),
});

export const setTimeSchema = z.object({
  time: z.string().nullable().optional(),
});

export type SimulateActionInput = z.infer<typeof simulateActionSchema>;
export type ApplyScenarioInput = z.infer<typeof applyScenarioSchema>;
export type SetTimeInput = z.infer<typeof setTimeSchema>;
