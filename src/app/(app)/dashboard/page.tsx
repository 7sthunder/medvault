import type { Metadata } from "next";
import { requireUser } from "@/server/auth/require-user";
import { DashboardPage as DashboardView } from "@/features/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard · MedVault",
  description: "Personal medication schedule, next dose actions, and adherence dashboard.",
};

export default async function DashboardPage() {
  await requireUser();

  return <DashboardView />;
}