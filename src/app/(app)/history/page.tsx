import type { Metadata } from "next";

import { HistoryPage } from "@/features/history/HistoryPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "History" };

export default async function HistoryRoute() {
  await requireUser();
  return <HistoryPage />;
}