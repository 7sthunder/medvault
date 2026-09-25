import type { Metadata } from "next";
import { ScheduleView } from "@/features/schedule/ScheduleView";

export const metadata: Metadata = {
  title: "Today's Schedule · MedVault",
  description: "View and log your scheduled medication doses for today.",
};

export default function SchedulePage() {
  return <ScheduleView />;
}
