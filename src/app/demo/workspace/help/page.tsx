import type { Metadata } from "next";

import { HelpContent } from "@/features/help/HelpContent";

export const metadata: Metadata = { title: "Help" };

/**
 * Phase 18 - the demo workspace's Help screen.
 *
 * A plain re-export of the shared body, not a re-export of `src/app/help/page.tsx`: that page
 * resolves a session to decide its own chrome, and inside the demo shell it would render a second
 * `AppShell` (or none, since the demo user has no session) inside the one the layout already
 * provides. Rendering `HelpContent` directly is the screen the nav link should reach.
 */
export default function DemoHelpPage() {
  return <HelpContent />;
}
