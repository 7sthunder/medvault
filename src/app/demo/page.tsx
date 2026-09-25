import type { Metadata } from "next";
import { DashboardPage as DashboardView } from "@/features/dashboard/DashboardPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo Dashboard · MedVault",
  description: "Interactive demo dashboard for Arun Kumar with real-time simulation controls.",
};

export default function DemoPage() {
  return <DashboardView />;
}
