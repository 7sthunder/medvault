import type { Metadata } from "next";

import { SchedulePage } from "@/features/schedule/SchedulePage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Today's Schedule" };

export default async function ScheduleRoutePage() {
  await requireUser();

  return <SchedulePage />;
}
