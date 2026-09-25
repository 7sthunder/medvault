"use client";

import { useMemo, useState } from "react";
import {
  CheckCheck,
  CheckCircle2,
  Inbox,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/trpc";
import type { NotificationTab } from "@/shared/enums";
import type { NotifDTO } from "@/shared/types";
import { NotificationItem } from "./NotificationItem";
import { NotificationTabs } from "./NotificationTabs";
import type { DayGroupedNotifications } from "./types";

function getDayGroupLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return itemDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function groupNotificationsByDay(items: NotifDTO[]): DayGroupedNotifications[] {
  const groups: Map<string, NotifDTO[]> = new Map();

  for (const item of items) {
    const label = getDayGroupLabel(new Date(item.createdAt));
    const current = groups.get(label) ?? [];
    current.push(item);
    groups.set(label, current);
  }

  return Array.from(groups.entries()).map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));
}

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const utils = api.useUtils();

  const listQuery = api.notifications.list.useQuery({
    tab: activeTab,
    unreadOnly,
    limit: 40,
  });

  const unreadCountQuery = api.notifications.unreadCount.useQuery();
  const unreadCount = unreadCountQuery.data?.count ?? 0;

  const markReadMutation = api.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to mark notification as read.");
    },
  });

  const markAllReadMutation = api.notifications.markAllRead.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.count > 0
          ? `Marked ${data.count} notification${data.count === 1 ? "" : "s"} as read.`
          : "All notifications are already marked as read.",
      );
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to mark all notifications as read.");
    },
  });

  const rawNotifications = useMemo(
    () => listQuery.data?.notifications ?? [],
    [listQuery.data?.notifications],
  );
  const groupedNotifications = useMemo(
    () => groupNotificationsByDay(rawNotifications),
    [rawNotifications],
  );

  return (
    <div data-testid="notifications-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-ink-100">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs font-semibold">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Dose reminders, caregiver alerts, and AI insights delivered in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate({})}
            className="gap-1.5"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            <span>Mark all as read</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Switch */}
      <NotificationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadOnly={unreadOnly}
        onUnreadOnlyChange={setUnreadOnly}
      />

      {/* Content Feed */}
      {listQuery.isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading notifications...</p>
        </div>
      ) : rawNotifications.length === 0 ? (
        <div className="py-12">
          {unreadOnly ? (
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up!"
              description="There are no unread notifications matching your current filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnreadOnly(false)}
                >
                  View all notifications
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No notifications"
              description={
                activeTab === "all"
                  ? "You have no notifications yet. Dose reminders and alerts will appear here."
                  : `No notifications found under the ${activeTab} category.`
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <div className="space-y-1 rounded-2xl border border-border/80 bg-card/40 p-2 shadow-card-sm backdrop-blur-xs">
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={(id) => markReadMutation.mutate({ notificationId: id })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
