"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Palette, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ProfileMenuUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0]! + parts[1][0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "MV";
}

export function ProfileMenu({ user }: { user?: ProfileMenuUser | null }) {
  const router = useRouter();
  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
            router.refresh();
          },
        },
      });
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="profile-menu-trigger"
        aria-label={`User menu for ${displayName}`}
        className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Avatar size="default" className="size-8 cursor-pointer border border-border/80">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 p-1.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-lg"
      >
        <DropdownMenuLabel className="font-normal px-2.5 py-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">
              {displayName}
            </p>
            {displayEmail && (
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 -mx-1.5 bg-border/60" />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/settings/profile" />} className="cursor-pointer gap-2 px-2.5 py-2 rounded-lg text-ink-700 dark:text-ink-300 hover:text-ink-900 focus:bg-muted">
            <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>Profile settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem render={<Link href="/settings/appearance" />} className="cursor-pointer gap-2 px-2.5 py-2 rounded-lg text-ink-700 dark:text-ink-300 hover:text-ink-900 focus:bg-muted">
            <Palette className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>Appearance</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 -mx-1.5 bg-border/60" />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          className="cursor-pointer gap-2 px-2.5 py-2 rounded-lg text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
