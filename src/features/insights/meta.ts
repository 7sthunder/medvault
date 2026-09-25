import type { ChipTone } from "@/components/ui/chip";
import type { InsightCategory, InsightSource, SuggestedAction } from "@/shared/enums";

/** §10.10 category → chip tone. Tint chips carry the label text too — never colour-only. */
export const INSIGHT_CATEGORY_TONE: Readonly<Record<InsightCategory, ChipTone>> = {
  timing_pattern: "blue",
  adherence_decline: "amber",
  adherence_improvement: "emerald",
  snooze_pattern: "violet",
  medication_difference: "magenta",
  missed_analysis: "slate",
  general: "neutral",
};

export function categoryTone(category: InsightCategory): ChipTone {
  return INSIGHT_CATEGORY_TONE[category] ?? "neutral";
}

/** §11.9 suggested-action → short button label (navigation lands with Phase 18 settings). */
export const SUGGESTED_ACTION_LABEL: Readonly<Record<SuggestedAction, string>> = {
  review_schedule: "Review schedule",
  review_reminders: "Review reminders",
  encourage: "Keep it up",
  review_caregiver: "Share with caregiver",
};

export function suggestedActionLabel(action: SuggestedAction): string {
  return SUGGESTED_ACTION_LABEL[action] ?? action;
}

/** Source tag (AI vs "generated from your data" fallback). */
export function sourceLabel(source: InsightSource): string {
  if (source === "ai") return "AI insight";
  if (source === "fallback") return "Generated from your data";
  return "Sample";
}
