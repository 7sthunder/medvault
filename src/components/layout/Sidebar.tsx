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
  /** Desktop only: shrink the rail to icons and hide the labels. */
  collapsed?: boolean;
}

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: NavIconName;
  collapsed?: boolean;
}

function SidebarLink({ href, label, icon, collapsed }: SidebarLinkProps) {
  const { pathname, basePath } = useShell();
  const active = isNavItemActive(href, pathname, basePath);
  return (
    <Link
      href={withBasePath(href, basePath)}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary-tint text-primary-dark"
          : "text-ink-600 hover:bg-muted hover:text-ink-900",
      )}
    >
      <NavIcon name={icon} className="size-4.5 shrink-0" />
      {/* Kept in the accessibility tree when collapsed so the link still has an accessible name. */}
      <span className={cn(collapsed && "sr-only")}>{label}</span>
    </Link>
  );
}

function GroupLabel({ label, collapsed }: { label: string; collapsed?: boolean }) {
  return (
    <p
      className={cn(
        "px-2.5 text-[11px] font-bold tracking-[0.12em] text-muted-foreground/80 uppercase",
        collapsed && "sr-only",
      )}
    >
      {label}
    </p>
  );
}

function SidebarContent({ collapsed, showBrand }: { collapsed?: boolean; showBrand?: boolean }) {
  const primaryGroups = NAV_GROUP_ORDER.filter((group) => group !== "bottom");
  const bottomItems = NAV_ITEMS.filter((item) => item.group === "bottom");
  const { basePath } = useShell();

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Only the mobile drawer brands itself: on desktop the logo lives in the top bar, right
          next to the collapse toggle. */}
      {showBrand ? (
        <div className={cn("flex", collapsed && "justify-center")}>
          <Brand size={36} showWordmark={!collapsed} href={withBasePath("/dashboard", basePath)} />
        </div>
      ) : null}
      <nav
        aria-label="Main navigation"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
      >
        {primaryGroups.map((group) => (
          <div key={group} className="grid gap-1">
            <GroupLabel label={GROUP_LABELS[group]} collapsed={collapsed} />
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className="grid gap-1 border-t border-border/60 pt-4">
        <GroupLabel label={GROUP_LABELS.bottom} collapsed={collapsed} />
        {bottomItems.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ open, onOpenChange, collapsed = false }: SidebarProps) {
  return (
    <>
      <aside
        id="sidebar"
        aria-label="Sidebar"
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-width) flex-col border-r border-border/60 bg-background p-4 transition-[width] duration-200 lg:flex",
          collapsed && "p-2",
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      <DrawerPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)} modal>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink-900/40 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 lg:hidden" />
          <DrawerPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-border bg-background p-4 outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-left-2 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-left-2 lg:hidden">
            <DrawerPrimitive.Title className="sr-only">Navigation menu</DrawerPrimitive.Title>
            <SidebarContent showBrand />
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    </>
  );
}
