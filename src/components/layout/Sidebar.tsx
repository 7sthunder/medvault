"use client";

import Link from "next/link";

import { Brand } from "@/components/brand/Brand";
import { NavIcon } from "@/components/ui/nav-icon";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
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

/**
 * Icon + label row. The row is a Next `Link` handed to `SidebarMenuButton` as its rendered
 * element, so the whole row is one link (one tab stop, one hit area) rather than an icon wrapped
 * in a separate anchor.
 */
function SidebarLink({ href, label, icon }: { href: string; label: string; icon: NavIconName }) {
  const { pathname, basePath } = useShell();
  const { isMobile, setOpenMobile } = useSidebar();
  const active = isNavItemActive(href, pathname, basePath);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        size="lg"
        tooltip={label}
        render={
          <Link
            href={withBasePath(href, basePath)}
            aria-current={active ? "page" : undefined}
            /* On mobile this row lives in the drawer, so navigating has to dismiss it or the
               drawer sits on top of the page it just navigated to. */
            onClick={() => isMobile && setOpenMobile(false)}
          />
        }
      >
        <NavIcon name={icon} />
        {/* `sr-only` rather than the reference's `hidden` when collapsed: visually gone, still in
            the accessibility tree, so a collapsed rail keeps a name for every link. The tooltip
            covers sighted mouse users on top of that. */}
        <span className="text-sm font-semibold group-data-[collapsible=icon]:sr-only">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupBlock({ group }: { group: NavGroup }) {
  const items = NAV_ITEMS.filter((item) => item.group === group);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {GROUP_LABELS[group]}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * The brand lives in the sidebar header (not the top bar) so that collapsing to the icon rail keeps
 * the logo in place and the top bar can hold nothing but the trigger — the arrangement the
 * reference app uses. `state` is read from context only for the wordmark, which has to stop
 * rendering rather than be visually hidden.
 */
function SidebarHeaderBrand() {
  const { state } = useSidebar();
  const { basePath } = useShell();
  const expanded = state === "expanded";

  return (
    <SidebarHeader>
      <div className="flex items-center gap-2 px-1 py-1">
        <Brand
          size={36}
          showWordmark={expanded}
          weight="normal"
          href={withBasePath("/dashboard", basePath)}
        />
      </div>
    </SidebarHeader>
  );
}

export function Sidebar() {
  const primaryGroups = NAV_GROUP_ORDER.filter((group) => group !== "bottom");

  return (
    <SidebarPrimitive collapsible="icon" side="left" variant="sidebar">
      <SidebarHeaderBrand />

      <SidebarContent>
        {primaryGroups.map((group) => (
          <NavGroupBlock key={group} group={group} />
        ))}
        <SidebarSeparator className="my-1" />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {NAV_ITEMS.filter((item) => item.group === "bottom").map((item) => (
            <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </SidebarMenu>
      </SidebarFooter>

      {/* Clicking the rail's right edge toggles it, as in the reference. */}
      <SidebarRail />
    </SidebarPrimitive>
  );
}
