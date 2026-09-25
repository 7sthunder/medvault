import type { Metadata } from "next";

import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPageRoute() {
  await requireUser();
  return <DashboardPage />;
}
