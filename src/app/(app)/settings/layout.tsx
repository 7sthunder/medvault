import type { ReactNode } from "react";

import { SettingsNav } from "@/features/settings/SettingsNav";

/**
 * Phase 18 — shared `/settings` chrome (§11.14): a vertical menu beside the content area on
 * `md+`, a horizontally scrollable pill row on mobile (§16). The section list is static (it
 * comes from `SETTINGS_NAV`, the same source the profile menu and route test use), while the
 * current-section highlight is client-side because only the browser knows the pathname.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:gap-8">
      <SettingsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
