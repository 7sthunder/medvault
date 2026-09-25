"use client";

import { useRouter } from "next/navigation";

import { useAppHref } from "@/components/layout/shell-context";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { formatDateKey } from "@/lib/format";
import type { NotifDTO } from "@/shared/types";

import { NOTIFICATION_TYPE_UI, notificationHref } from "./notification-utils";

export function NotificationsList({ items }: { items: NotifDTO[] }) {
  const router = useRouter();
  const href = useAppHref();
  const utils = api.useUtils();
  const markRead = api.notifications.markRead.useMutation({
    onSuccess: () => {
      void utils.notifications.unreadCount.invalidate();
      void utils.notifications.list.invalidate();
    },
  });

  if (items.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        title="You're all caught up"
        description="Notifications about doses, care and insights will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((notif) => {
        const ui = NOTIFICATION_TYPE_UI[notif.type];
        const read = Boolean(notif.readAt);
        return (
          <li key={notif.id}>
            <ListRow
              icon={ui.icon}
              iconClass={ui.tile}
              className={read ? "opacity-70" : "bg-ink-100/40"}
              title={notif.title}
              subtitle={`${notif.body} · ${formatDateKey(new Date(notif.createdAt).toISOString().slice(0, 10))}`}
              right={
                !read ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    aria-label={`Mark "${notif.title}" as read`}
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead.mutate({ notificationId: notif.id });
                    }}
                  >
                    Mark read
                  </Button>
                ) : undefined
              }
              onClick={() => {
                if (!read) markRead.mutate({ notificationId: notif.id });
                router.push(href(notificationHref(notif.entityType, notif.entityId)));
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function NotificationsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export function NotificationsError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      className="mt-10"
      title="Couldn't load notifications"
      action={
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}
