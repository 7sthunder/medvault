"use client";

import Link from "next/link";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "cn";

import { Brand } from "@/components/brand/Brand";
import { NavIcon } from "@/components/ui/nav-icon";
import { NAV_GROUP_ORDER, NAV_ITEMS, type NavGroup, type NavIconName } from "@shared/nav";

import { isNavItemActive, withBasePath } from "@/components/layout/nav-model";
import { useShell } from "@/components/layout/shell-context";

const GROUP_LABELS: Readonly<Record<NavGroup, string>> = {
  overview: "Overview",
  management: "Management",
  intelligence: "Intelligence",
  care: "Care",
  bottom: "Account",
};

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: NavIconName;
}

function SidebarLink({ href, label, icon }: SidebarLinkProps) {
  const { pathname, basePath } = useShell();
  const active = isNavItemActive(href, pathname, basePath);
  return (
    <Link
      href={withBasePath(href, basePath)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-tint text-primary-dark"
          : "text-ink-600 hover:bg-muted hover:text-ink-900"
      )}
    >
      <NavIcon name={icon} className="size-4.5" />
      <span>{label}</span>
    </Link>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-2.5 text-[11px] font-bold tracking-[0.12em] text-muted-foreground/80 uppercase">
      {label}
    </p>
  );
}

function SidebarContent() {
  const primaryGroups = NAV_GROUP_ORDER.filter((group) => group !== "bottom");
  const bottomItems = NAV_ITEMS.filter((item) => item.group === "bottom");

  return (
    <div className="flex h-full flex-col gap-6">
      <Brand size={36} href="/dashboard" />
      <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {primaryGroups.map((group) => (
          <div key={group} className="grid gap-1">
            <GroupLabel label={GROUP_LABELS[group]} />
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
              <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        ))}
      </nav>
      <div className="grid gap-1 border-t border-border/60 pt-4">
        <GroupLabel label={GROUP_LABELS.bottom} />
        {bottomItems.map((item) => (
          <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-background p-4 lg:flex">
        <SidebarContent />
      </aside>

      <DrawerPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)} modal>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink-900/40 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 lg:hidden" />
          <DrawerPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-border bg-background p-4 outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-left-2 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-left-2 lg:hidden">
            <DrawerPrimitive.Title className="sr-only">
              Navigation menu
            </DrawerPrimitive.Title>
            <SidebarContent />
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    </>
  );
}