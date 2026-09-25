import type { Metadata } from "next";

import { AssistantPanel } from "@/features/assistant/AssistantPanel";

export const metadata: Metadata = { title: "Voice assistant" };

/**
 * The demo workspace has no Gemini key, so this page renders the assistant's "needs a key"
 * notice — which is itself the correct demo behaviour, rather than a 404.
 */
export default function DemoAssistantRoutePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col">
      <AssistantPanel variant="page" />
    </main>
  );
}
