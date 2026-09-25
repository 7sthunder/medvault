import type { Metadata } from "next";

import { requireUser } from "@/server/auth/require-user";
import { InsightsPage } from "@/features/insights/InsightsPage";

export const metadata: Metadata = { title: "AI Insights" };

export default async function InsightsRoute() {
  await requireUser();
  return <InsightsPage />;
}
