import type { Metadata } from "next";
import { InsightsPage as InsightsView } from "@/features/insights/InsightsPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = {
  title: "AI Insights · MedVault",
  description: "Personalized behavioral coaching and adherence pattern analysis.",
};

export default async function InsightsPage() {
  await requireUser();

  return <InsightsView />;
}
