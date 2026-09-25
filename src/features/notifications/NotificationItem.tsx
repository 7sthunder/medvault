"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  Pill,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { NotifDTO } from "@/shared/types";

interface NotificationItemProps {
  notification: NotifDTO;
  onMarkRead?: (id: string) => void;
  isCompact?: boolean;
}

function getNotificationIcon(type: NotifDTO["type"]) {
  switch (type) {
    case "missed_dose":
      return {
        icon: AlertTriangle,
        bgClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      };
    case "due_dose":
    case "upcoming_dose":
      return {
        icon: Pill,
        bgClass: "bg-primary-tint text-primary-dark dark:text-primary",
      };
    case "caregiver_alert":
      return {
        icon: ShieldAlert,
        bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    case "insight":
      return {
        icon: Sparkles,
        bgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      };
    default:
      return {
        icon: Bell,
        bgClass: "bg-muted text-muted-foreground",
      };
  }
}

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getEntityLink(notification: NotifDTO): string | null {
  if (notification.entityType === "doseEvent") {
    return "/schedule";
  }
  if (notification.entityType === "caregiverAlert" && notification.entityId) {
    return `/caregiver/alerts/${notification.entityId}`;
  }
  if (notification.entityType === "insight") {
    return "/insights";
  }
  if (notification.entityType === "medication" && notification.entityId) {
    return `/medications/${notification.entityId}`;
  }
  return null;
}

export function NotificationItem({
  notification,
  onMarkRead,
  isCompact = false,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const { icon: Icon, bgClass } = getNotificationIcon(notification.type);
  const targetLink = getEntityLink(notification);

  return (
    <div
      data-testid={`notification-item-${notification.id}`}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-transparent transition-all",
        isCompact ? "p-2.5 hover:bg-muted/40" : "p-4 hover:border-border hover:bg-card/70 hover:shadow-card-sm",
        isUnread && (isCompact ? "bg-primary-tint/30" : "bg-card border-border/70"),
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          isCompact ? "size-8 rounded-lg" : "size-10",
          bgClass,
        )}
      >
        <Icon className={isCompact ? "size-4" : "size-5"} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-medium text-ink-900 dark:text-ink-100",
                isCompact ? "text-xs font-semibold" : "text-sm font-semibold",
              )}
            >
              {notification.title}
            </h4>
            {isUnread && (
              <span
                aria-label="Unread"
                className="size-2 shrink-0 rounded-full bg-primary"
              />
            )}
          </div>

          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p
          className={cn(
            "text-muted-foreground",
            isCompact ? "line-clamp-2 text-xs" : "text-xs leading-relaxed",
          )}
        >
          {notification.body}
        </p>

        {/* Action Link & Mark Read */}
        <div className="flex items-center gap-3 pt-1">
          {targetLink && (
            <Link
              href={targetLink}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
            >
              <span>View details</span>
              <ArrowRight className="size-3" />
            </Link>
          )}

          {isUnread && onMarkRead && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onMarkRead(notification.id)}
              className="h-6 text-[11px] text-muted-foreground hover:text-ink-900"
            >
              <Check className="mr-1 size-3" />
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
