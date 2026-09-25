"use client";

import Link from "next/link";
import { cn } from "cn";

import { NavIcon } from "@/components/ui/nav-icon";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { NAV_GROUP_ORDER, NAV_ITEMS, type NavGroup } from "@shared/nav";

import { isNavItemActive, withBasePath } from "@/components/layout/nav-model";
import { useShell } from "@/components/layout/shell-context";

const GROUP_LABELS: Readonly<Partial<Record<NavGroup, string>>> = {
  overview: "Overview",
  management: "Management",
  intelligence: "Intelligence",
  care: "Care",
};

export function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pathname, basePath } = useShell();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80dvh]">
        <DrawerHandle />
        <DrawerHeader className="text-left">
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerDescription>Everything in your vault.</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-4 overflow-y-auto pb-2">
          {NAV_GROUP_ORDER.map((group) => {
            const label = GROUP_LABELS[group];
            const items = NAV_ITEMS.filter((item) => item.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="grid gap-0.5">
                {label && (
                  <p className="px-2.5 pb-1 text-[11px] font-bold tracking-[0.12em] text-muted-foreground/80 uppercase">
                    {label}
                  </p>
                )}
                {items.map((item) => {
                  const active = isNavItemActive(item.href, pathname, basePath);
                  return (
                    <Link
                      key={item.href}
                      href={withBasePath(item.href, basePath)}
                      onClick={() => onOpenChange(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-tint text-primary-dark"
                          : "text-ink-600 hover:bg-muted hover:text-ink-900"
                      )}
                    >
                      <NavIcon name={item.icon} className="size-4.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}