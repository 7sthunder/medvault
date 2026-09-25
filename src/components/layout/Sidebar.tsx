"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_ITEMS, NAV_GROUP_ORDER, type NavGroup, type NavItem } from "@/shared/nav";
import { NavIcon } from "@/components/ui/nav-icon";
import { Brand } from "@/components/brand/Brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, type ProfileMenuUser } from "@/components/layout/ProfileMenu";
import { cn } from "@/lib/utils";

const GROUP_TITLES: Record<NavGroup, string> = {
  overview: "Overview",
  management: "Management",
  intelligence: "Intelligence",
  care: "Care",
  bottom: "System",
};

export interface SidebarProps {
  user?: ProfileMenuUser | null;
  className?: string;
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  // Group items
  const itemsByGroup = NAV_GROUP_ORDER.reduce<Record<NavGroup, NavItem[]>>((acc, group) => {
    acc[group] = NAV_ITEMS.filter((item) => item.group === group);
    return acc;
  }, {} as Record<NavGroup, NavItem[]>);

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "group/sidebar fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border",
        "w-16 hover:w-64 transition-all duration-300 ease-in-out overflow-x-hidden",
        "bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-sm hover:shadow-xl",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-3.5 border-b border-border/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="MedVault home"
        >
          <div className="shrink-0">
            <Brand size={36} showWordmark={false} href={null} />
          </div>
          <span className="font-heading font-extrabold text-lg text-ink-900 dark:text-ink-100 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Med<span className="text-primary">Vault</span>
          </span>
        </Link>
      </div>

      {/* Nav Link Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5" aria-label="Main menu">
        {NAV_GROUP_ORDER.map((group) => {
          const items = itemsByGroup[group];
          if (!items || items.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              <div
                className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 pointer-events-none truncate"
                aria-hidden="true"
              >
                {GROUP_TITLES[group]}
              </div>

              {items.map((item) => {
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-200 group/link",
                      active
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-tint font-bold shadow-xs border border-primary/25"
                        : "text-ink-600 dark:text-ink-300 hover:bg-muted/70 hover:text-ink-900 dark:hover:text-ink-100 border border-transparent",
                    )}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                        aria-hidden="true"
                      />
                    )}
                    <div className="shrink-0 flex items-center justify-center size-5">
                      <NavIcon
                        name={item.icon}
                        className={cn(
                          "size-5 transition-colors",
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover/link:text-ink-900 dark:group-hover/link:text-ink-100",
                        )}
                      />
                    </div>
                    <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="shrink-0 border-t border-border/60 p-2.5">
        <Link
          href="/settings/profile"
          className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-muted/80 transition-colors group/user focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`View profile for ${displayName}`}
        >
          <Avatar size="default" className="size-8 shrink-0 border border-border/70">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 truncate">
            <p className="text-xs font-semibold text-ink-900 dark:text-ink-100 truncate">
              {displayName}
            </p>
            {displayEmail && (
              <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
            )}
          </div>
          <Settings className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
