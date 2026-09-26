"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";

import { NavIcon } from "@/components/ui/nav-icon";
import { isNavItemActive, withBasePath } from "@/components/layout/nav-model";
import { MoreSheet } from "@/components/layout/MoreSheet";
import { useShell } from "@/components/layout/shell-context";
import { BOTTOM_NAV } from "@shared/nav";

export function BottomNav() {
  const { pathname, basePath } = useShell();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background md:hidden"
      >
        {/* `h-16` grows by the home-indicator inset so the 4 columns keep their full 64px and the
            inset is reserved as padding beneath them, rather than eating into the tap targets. */}
        <div className="mx-auto grid h-[calc(4rem+env(safe-area-inset-bottom,0px))] max-w-md grid-cols-4 pb-[env(safe-area-inset-bottom,0px)]">
          {BOTTOM_NAV.map((item) => {
            if (item.add) {
              return (
                <span key={item.href} className="flex items-start justify-center pt-1.5">
                  <Link
                    href={withBasePath(item.href, basePath)}
                    aria-label={item.label}
                    className="-mt-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-primary-btn transition-transform active:scale-95"
                  >
                    <NavIcon name={item.icon} className="size-5" />
                  </Link>
                </span>
              );
            }

            const active =
              item.href === "more" ? moreOpen : isNavItemActive(item.href, pathname, basePath);

            if (item.href === "more") {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className="relative flex items-center justify-center">
                    <NavIcon name={item.icon} className="size-5" />
                    {active && (
                      <span
                        className="absolute top-full h-1 w-1 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={withBasePath(item.href, basePath)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative flex items-center justify-center">
                  <NavIcon name={item.icon} className="size-5" />
                  {active && (
                    <span
                      className="absolute top-full h-1 w-1 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
