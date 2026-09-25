/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { api } from "@/lib/trpc";
import type { NotifDTO } from "@/shared/types";
import { NotificationItem } from "./NotificationItem";
import { NotificationsPage } from "./NotificationsPage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockNotifications: NotifDTO[] = [
  {
    id: "notif-1",
    type: "missed_dose",
    title: "Missed dose: Metformin",
    body: "You missed your scheduled dose of Metformin (500 mg).",
    entityType: "doseEvent",
    entityId: "dose-101",
    readAt: null,
    createdAt: new Date(),
  },
  {
    id: "notif-2",
    type: "caregiver_alert",
    title: "Caregiver Alert: Arun Kumar",
    body: "Arun missed their afternoon dose.",
    entityType: "caregiverAlert",
    entityId: "alert-202",
    readAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: "notif-3",
    type: "insight",
    title: "New Adherence Insight",
    body: "Your weekend adherence improved by 15%.",
    entityType: "insight",
    entityId: "ins-303",
    readAt: null,
    createdAt: new Date(),
  },
];

vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: vi.fn(() => ({
      notifications: {
        list: { invalidate: vi.fn() },
        unreadCount: { invalidate: vi.fn() },
      },
    })),
    notifications: {
      list: {
        useQuery: vi.fn(),
      },
      unreadCount: {
        useQuery: vi.fn(),
      },
      markRead: {
        useMutation: vi.fn(),
      },
      markAllRead: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe("Phase 22 — Notifications UI Components", () => {
  const mockMarkRead = vi.fn();
  const mockMarkAllRead = vi.fn();

  beforeEach(() => {
    vi.mocked(api.notifications.list.useQuery).mockReturnValue({
      data: { notifications: mockNotifications, nextCursor: null },
      isLoading: false,
    } as never);

    vi.mocked(api.notifications.unreadCount.useQuery).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as never);

    vi.mocked(api.notifications.markRead.useMutation).mockReturnValue({
      mutate: mockMarkRead,
      isPending: false,
    } as never);

    vi.mocked(api.notifications.markAllRead.useMutation).mockReturnValue({
      mutate: mockMarkAllRead,
      isPending: false,
    } as never);
  });

  describe("NotificationsPage", () => {
    it("renders page header with unread badge count", () => {
      render(<NotificationsPage />);

      expect(screen.getByRole("heading", { name: "Notification Center" })).toBeInTheDocument();
      expect(screen.getByText("2 unread")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Mark all as read/i })).toBeInTheDocument();
    });

    it("renders day grouped notification cards", () => {
      render(<NotificationsPage />);

      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("Missed dose: Metformin")).toBeInTheDocument();
      expect(screen.getByText("Caregiver Alert: Arun Kumar")).toBeInTheDocument();
      expect(screen.getByText("New Adherence Insight")).toBeInTheDocument();
    });

    it("switches tabs to filter notification categories", () => {
      render(<NotificationsPage />);

      const doseTab = screen.getByRole("tab", { name: "Doses" });
      fireEvent.click(doseTab);

      expect(doseTab).toHaveAttribute("aria-selected", "true");
    });

    it("calls markAllRead when clicking Mark all as read button", () => {
      render(<NotificationsPage />);

      const markAllBtn = screen.getByRole("button", { name: /Mark all as read/i });
      fireEvent.click(markAllBtn);

      expect(mockMarkAllRead).toHaveBeenCalledWith({});
    });

    it("renders empty state when no notifications are returned", () => {
      vi.mocked(api.notifications.list.useQuery).mockReturnValue({
        data: { notifications: [], nextCursor: null },
        isLoading: false,
      } as never);

      render(<NotificationsPage />);

      expect(screen.getByText("No notifications")).toBeInTheDocument();
    });
  });

  describe("NotificationItem", () => {
    it("renders unread notification with unread dot and action button", () => {
      const onMark = vi.fn();
      render(<NotificationItem notification={mockNotifications[0]!} onMarkRead={onMark} />);

      expect(screen.getByText("Missed dose: Metformin")).toBeInTheDocument();
      expect(screen.getByLabelText("Unread")).toBeInTheDocument();

      const markBtn = screen.getByRole("button", { name: /Mark as read/i });
      fireEvent.click(markBtn);

      expect(onMark).toHaveBeenCalledWith("notif-1");
    });

    it("renders entity navigation link", () => {
      render(<NotificationItem notification={mockNotifications[0]!} />);

      const link = screen.getByRole("link", { name: /View details/i });
      expect(link).toHaveAttribute("href", "/schedule");
    });
  });

  describe("NotificationBell", () => {
    it("renders bell button with unread count badge", () => {
      render(<NotificationBell />);

      const bell = screen.getByLabelText("2 unread notifications");
      expect(bell).toBeInTheDocument();
      expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("2");
    });
  });
});
