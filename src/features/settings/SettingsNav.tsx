"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavIcon } from "@/components/ui/nav-icon";
import { SETTINGS_NAV } from "@/shared/nav";

/**
 * Phase 18 — `/settings` section menu (§11.14). Reads the single `SETTINGS_NAV` source so this
 * menu, the profile menu and the route-manifest test can never disagree about the sections.
 * Mobile: horizontal scroll strip; `md+`: vertical aside.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="md:w-56 md:shrink-0">
      <h1 className="font-heading text-2xl font-extrabold text-ink-900">Settings</h1>
      <ul className="mt-4 flex gap-2 overflow-x-auto pb-2 md:mt-6 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
        {SETTINGS_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0 md:shrink">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors"
                    : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-ink-900"
                }
              >
                <NavIcon name={item.icon} className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
