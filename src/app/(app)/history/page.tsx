import type { Metadata } from "next";
import { requireUser } from "@/server/auth/require-user";
import { HistoryPage as HistoryView } from "@/features/history/HistoryPage";

export const metadata: Metadata = {
  title: "Dose History · MedVault",
  description: "Authoritative audit log of past medication intake, snoozes, skips, and adherence events.",
};

export default async function HistoryPage() {
  await requireUser();

  return <HistoryView />;
}
