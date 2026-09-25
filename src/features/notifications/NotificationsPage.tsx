"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/trpc";
import { NOTIFICATION_TABS } from "@/shared/enums";
import type { NotificationTab } from "@/shared/enums";

import {
  NotificationsError,
  NotificationsList,
  NotificationsListSkeleton,
} from "./NotificationsList";

const TAB_LABELS: Record<NotificationTab, string> = {
  all: "All",
  dose: "Dose",
  caregiver: "Caregiver",
  ai: "AI",
  system: "System",
};

/**
 * §11.13 `/notifications` — notification center with tabs (All/Dose/Caregiver/AI/System),
 * unread count, mark-all-read, cursor pagination. Rows navigate by entity type and can be
 * marked read inline.
 */
export function NotificationsPage() {
  const [tab, setTab] = useState<NotificationTab>("all");
  const [cursor, setCursor] = useState<string | null>(null);

  const list = api.notifications.list.useQuery(
    { tab, cursor: cursor ?? undefined },
    { staleTime: 15_000 },
  );
  const unread = api.notifications.unreadCount.useQuery(undefined, { staleTime: 15_000 });
  const utils = api.useUtils();

  const markAll = api.notifications.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notifications.unreadCount.invalidate();
      void utils.notifications.list.invalidate();
    },
  });

  const items = list.data?.items ?? [];
  const nextCursor = list.data?.nextCursor ?? null;
  const hasUnread = (unread.data?.count ?? 0) > 0;

  return (
    <main className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread.data?.count ? `${unread.data.count} unread` : "You're all caught up"}.
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as NotificationTab);
          setCursor(null);
        }}
        className="mt-6"
      >
        <TabsList className="w-full" variant="default">
          {NOTIFICATION_TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="h-8 px-3">
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {list.isLoading ? (
            <NotificationsListSkeleton />
          ) : list.isError ? (
            <NotificationsError onRetry={() => void list.refetch()} />
          ) : (
            <NotificationsList items={items} />
          )}

          {nextCursor && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => setCursor(nextCursor)}>
                Load older
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
