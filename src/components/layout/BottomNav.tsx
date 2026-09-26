"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/shared/nav";
import { NavIcon } from "@/components/ui/nav-icon";
import { cn } from "@/lib/utils";

export interface BottomNavProps {
  onMoreClick: () => void;
  isMoreOpen?: boolean;
}

export function BottomNav({ onMoreClick, isMoreOpen = false }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-[max(0px,env(safe-area-inset-bottom))] border-t border-border bg-white/95 dark:bg-card/95 backdrop-blur-md px-2"
    >
      <div className="grid h-full grid-cols-5 items-center">
        {BOTTOM_NAV.map((item) => {
          if (item.isMore) {
            const active = isMoreOpen;

            return (
              <button
                key={item.label}
                type="button"
                onClick={onMoreClick}
                aria-label="More navigation options"
                aria-expanded={isMoreOpen}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 text-xs transition-colors",
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100",
                )}
              >
                <NavIcon name={item.icon} className="size-5 shrink-0" />
                <span className="leading-none">{item.label}</span>
                {active ? (
                  <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                ) : (
                  <span className="h-1 w-1" aria-hidden="true" />
                )}
              </button>
            );
          }

          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 text-xs transition-colors",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100",
              )}
            >
              <NavIcon name={item.icon} className="size-5 shrink-0" />
              <span className="leading-none">{item.label}</span>
              {active ? (
                <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
              ) : (
                <span className="h-1 w-1" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
