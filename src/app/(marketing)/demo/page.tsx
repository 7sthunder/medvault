import type { Metadata } from "next";

import { DemoLanding } from "@/features/demo/DemoLanding";
import { BRAND } from "@/shared/brand";

export const metadata: Metadata = {
  title: "Try the demo",
  description: `Explore ${BRAND.name} with a fully populated sample workspace — schedule, adherence charts, insights and caregiver alerts. No sign-up needed.`,
};

/**
 * The clock badge reads live demo state, so this page must never be baked at build time — a
 * statically cached "simulated clock" on a marketing page is worse than no clock at all.
 */
export const dynamic = "force-dynamic";

/**
 * Phase 18 (10.8 / 11.16) - the signed-out demo entry point. Sits in the marketing group
 * because it is a landing page, not an app screen; the workspace itself lives under
 * `/demo/workspace` and reuses the real `(app)` screens. `DemoLanding` mounts the tRPC provider
 * itself, since this page has no `AppShell` to inherit one from.
 */
export default function DemoPage() {
  return <DemoLanding />;
}
