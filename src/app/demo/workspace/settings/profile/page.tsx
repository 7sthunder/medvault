import type { Metadata } from "next";

import { ProfileForm } from "@/features/settings/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

/**
 * Phase 19 — the demo workspace's Settings › Profile screen.
 *
 * The signed-in settings routes rely on the `(app)` layout for authentication; the demo layout
 * resolves the subject instead, so these are plain re-exports of the same feature components.
 */
export default function DemoSettingsProfilePage() {
  return <ProfileForm />;
}
