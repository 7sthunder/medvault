import type { Metadata } from "next";

import { AssistantPanel } from "@/features/assistant/AssistantPanel";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Voice assistant" };

export default async function AssistantRoutePage() {
  await requireUser();

  return (
    <main className="mx-auto flex max-w-3xl flex-col">
      <AssistantPanel variant="page" />
    </main>
  );
}
