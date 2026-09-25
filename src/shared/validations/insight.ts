import { z } from "zod";
import { INSIGHT_CATEGORIES, SUGGESTED_ACTIONS } from "../enums";

export const singleInsightSchema = z.object({
  category: z.enum(INSIGHT_CATEGORIES),
  summary: z.string().trim().min(5).max(300),
  detail: z.string().trim().max(1000).optional().nullable(),
  suggestedActionType: z.enum(SUGGESTED_ACTIONS).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export const insightResponseSchema = z.object({
  insights: z.array(singleInsightSchema).min(1).max(5),
  tone: z.enum(["neutral", "encouraging"]).default("encouraging"),
});

export const listInsightsSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(20).optional(),
  })
  .optional();

export type SingleInsight = z.infer<typeof singleInsightSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type ListInsightsInput = z.infer<typeof listInsightsSchema>;
