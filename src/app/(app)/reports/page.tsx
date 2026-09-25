import type { Metadata } from "next";
import { ReportsPage as ReportsView } from "@/features/reports/ReportsPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = {
  title: "Reports & Analytics · MedVault",
  description: "Clinical-grade adherence reports, trend analytics, and downloadable RFC 4180 audit logs.",
};

export default async function ReportsPage() {
  await requireUser();

  return <ReportsView />;
}
