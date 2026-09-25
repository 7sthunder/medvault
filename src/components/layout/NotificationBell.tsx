"use client";

import { useEffect } from "react";
import { Bell, BellRing, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAppHref } from "@/components/layout/shell-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";

import {
  NOTIFICATION_TYPE_UI,
  notificationHref,
} from "@/features/notifications/notification-utils";

/**
 * §11.13 live notification bell (Phase 16 replacement of the Phase 09 stub): unread
 * count badge + dropdown of the 5 most recent notifications, each linking by entity
 * type to the relevant route; "View all" → `/notifications`. Refetches the count on
 * focus so a missed-dose created elsewhere is visible.
 */
export function NotificationBell() {
  const router = useRouter();
  const href = useAppHref();
  const utils = api.useUtils();
  const unread = api.notifications.unreadCount.useQuery(undefined, { staleTime: 10_000 });
  const recent = api.notifications.list.useQuery({ limit: 5 }, { staleTime: 10_000 });
  const markRead = api.notifications.markRead.useMutation({
    onSuccess: () => {
      void utils.notifications.unreadCount.invalidate();
      void utils.notifications.list.invalidate();
    },
  });

  useEffect(() => {
    const onFocus = () => void unread.refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [unread]);

  const count = unread.data?.count ?? 0;
  const items = recent.data?.items ?? [];

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-ink-500 outline-none hover:bg-muted hover:text-ink-700 focus-visible:ring-4 focus-visible:ring-primary-ring"
      >
        {count > 0 ? (
          <BellRing className="size-5" aria-hidden="true" />
        ) : (
          <Bell className="size-5" aria-hidden="true" />
        )}
        {count > 0 && (
          <Badge
            className="absolute -top-0.5 -right-1 h-4 min-w-4 px-1 text-[10px] tabular-nums"
            aria-hidden="true"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(20rem,calc(100vw-2rem))]">
        <PopoverHeader className="flex-row items-center justify-between">
          <PopoverTitle className="text-sm font-semibold text-ink-900">Notifications</PopoverTitle>
          {count > 0 && <span className="text-xs text-muted-foreground">{count} unread</span>}
        </PopoverHeader>

        <div className="flex flex-col gap-1">
          {recent.isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((notif) => {
              const ui = NOTIFICATION_TYPE_UI[notif.type];
              const read = Boolean(notif.readAt);
              return (
                <ListRow
                  key={notif.id}
                  icon={ui.icon}
                  iconClass={ui.tile}
                  className={read ? "opacity-70" : undefined}
                  title={notif.title}
                  subtitle={notif.body}
                  onClick={() => {
                    if (!read) markRead.mutate({ notificationId: notif.id });
                    router.push(href(notificationHref(notif.entityType, notif.entityId)));
                  }}
                />
              );
            })
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full"
          onClick={() => router.push(href("/notifications"))}
        >
          View all
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
