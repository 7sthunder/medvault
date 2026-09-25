"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerHandle,
} from "@/components/ui/drawer";
import { NavIcon } from "@/components/ui/nav-icon";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { NavIconName } from "@/shared/nav";

interface MoreSheetItem {
  label: string;
  href: string;
  icon: NavIconName;
  description?: string;
}

const MORE_NAV_ITEMS: readonly MoreSheetItem[] = [
  { label: "History", href: "/history", icon: "history", description: "Past dose events and log" },
  { label: "AI Insights", href: "/insights", icon: "insights", description: "Trends and clinical patterns" },
  { label: "Reports", href: "/reports", icon: "reports", description: "Physician-ready PDF & CSV export" },
  { label: "Caregiver", href: "/caregiver", icon: "caregiver", description: "Family & clinician access" },
  { label: "Notifications", href: "/notifications", icon: "notifications", description: "Activity and reminders" },
  { label: "Settings", href: "/settings/profile", icon: "settings", description: "Preferences, appearance & reminders" },
  { label: "Help & Support", href: "/help", icon: "help", description: "FAQs, guides, and emergency help" },
];

export interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    onOpenChange(false);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] p-0 rounded-t-3xl border-t border-border bg-background">
        <DrawerHandle className="mt-3" />
        
        <DrawerHeader className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-border/60">
          <DrawerTitle className="text-base font-bold text-ink-900 dark:text-ink-100">
            More Options
          </DrawerTitle>
          <DrawerClose className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-3 space-y-1.5 max-h-[60vh]">
          {MORE_NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3.5 p-3 rounded-2xl transition-all",
                  active
                    ? "bg-primary-tint text-primary font-semibold"
                    : "text-ink-700 dark:text-ink-300 hover:bg-muted/80",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl shrink-0 transition-colors",
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "bg-muted text-ink-600 dark:text-ink-300",
                  )}
                >
                  <NavIcon name={item.icon} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  )}
                </div>
              </Link>
            );
          })}

          <div className="pt-2 pb-1 border-t border-border/60 mt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3.5 p-3 rounded-2xl text-destructive hover:bg-destructive/10 transition-colors font-semibold text-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
                <LogOut className="size-5 text-destructive" aria-hidden="true" />
              </div>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
