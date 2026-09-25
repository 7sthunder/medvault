"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_NAV } from "@/shared/nav";
import { NavIcon } from "@/components/ui/nav-icon";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal preferences, schedule reminders, and security settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Nav */}
        <aside className="w-full md:w-56 shrink-0" aria-label="Settings sub-navigation">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0" role="tablist">
            {SETTINGS_NAV.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary-tint text-primary font-semibold"
                      : "text-ink-600 dark:text-ink-300 hover:bg-muted/80 hover:text-ink-900 dark:hover:text-ink-100",
                  )}
                >
                  <NavIcon
                    name={item.icon}
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
