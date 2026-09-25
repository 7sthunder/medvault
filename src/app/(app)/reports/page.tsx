import type { Metadata } from "next";

import { ReportsPage } from "@/features/reports/ReportsPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsRoute() {
  await requireUser();
  return <ReportsPage />;
}