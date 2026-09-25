"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { api } from "@/lib/trpc";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const unreadCountQuery = api.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const recentQuery = api.notifications.list.useQuery(
    { tab: "all", limit: 5, unreadOnly: false },
    { enabled: open },
  );

  const markAllReadMutation = api.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markReadMutation = api.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const count = unreadCountQuery.data?.count ?? 0;
  const recentNotifications = recentQuery.data?.notifications ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-muted hover:text-ink-700"
          />
        }
      >
        <Bell className="size-4.5" aria-hidden="true" />
        {count > 0 && (
          <span
            data-testid="notification-bell-badge"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold text-ink-900 dark:text-ink-100">
              Notifications
            </h3>
            {count > 0 && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                {count} new
              </Badge>
            )}
          </div>

          {count > 0 && (
            <Button
              variant="ghost"
              size="xs"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate({})}
              className="h-6 text-[11px] text-muted-foreground hover:text-ink-900"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 size-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Mini List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50 p-1">
          {recentQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center p-4 text-center">
              <Bell className="size-6 text-muted-foreground/60 mb-1.5" />
              <p className="text-xs font-medium text-ink-900 dark:text-ink-100">
                All caught up
              </p>
              <p className="text-[11px] text-muted-foreground">
                No new notifications right now.
              </p>
            </div>
          ) : (
            recentNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                isCompact
                onMarkRead={(id) => markReadMutation.mutate({ notificationId: id })}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/80 bg-muted/20 p-2 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg py-1.5 text-xs font-semibold text-primary hover:bg-primary-tint/30 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}