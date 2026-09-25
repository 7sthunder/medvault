import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as notificationsService from "@/server/domain/notifications/service";
import { appRouter } from "../root";

vi.mock("@/server/domain/notifications/service");

describe("Phase 22 — Notifications tRPC Router", () => {
  const dummyDb = {} as never;

  const user = {
    id: "user-123",
    email: "user@medvault.test",
    name: "Primary User",
    timezone: "UTC",
    emailVerified: true,
    image: null,
    onboardingCompleted: true,
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const session = {
    id: "sess-1",
    userId: user.id,
    expiresAt: new Date(Date.now() + 86400000),
    token: "token",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated calls with UNAUTHORIZED", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    await expect(unauthedCaller.notifications.list({ tab: "all", limit: 10, unreadOnly: false })).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.notifications.unreadCount()).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.notifications.markAllRead()).rejects.toThrow(TRPCError);
    await expect(
      unauthedCaller.notifications.markRead({ notificationId: "11111111-1111-4111-8111-111111111111" }),
    ).rejects.toThrow(TRPCError);
  });

  it("lists notifications for authenticated user", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockResponse = {
      notifications: [
        {
          id: "n-1",
          type: "missed_dose" as const,
          title: "Missed Dose",
          body: "Missed dose details",
          entityType: "doseEvent" as const,
          entityId: "e-1",
          readAt: null,
          createdAt: new Date(),
        },
      ],
      nextCursor: null,
    };

    vi.mocked(notificationsService.listNotifications).mockResolvedValue(mockResponse);

    const res = await authedCaller.notifications.list({
      tab: "dose",
      unreadOnly: true,
      limit: 10,
    });

    expect(notificationsService.listNotifications).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      expect.objectContaining({ tab: "dose", unreadOnly: true, limit: 10 }),
    );
    expect(res).toEqual(mockResponse);
  });

  it("returns unread count", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    vi.mocked(notificationsService.getUnreadCount).mockResolvedValue(5);

    const res = await authedCaller.notifications.unreadCount();

    expect(notificationsService.getUnreadCount).toHaveBeenCalledWith(dummyDb, user.id);
    expect(res).toEqual({ count: 5 });
  });

  it("marks a notification as read", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockNotif = {
      id: "11111111-1111-4111-8111-111111111111",
      type: "missed_dose" as const,
      title: "Missed Dose",
      body: "Details",
      entityType: "doseEvent" as const,
      entityId: "e-1",
      readAt: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(notificationsService.markRead).mockResolvedValue(mockNotif);

    const res = await authedCaller.notifications.markRead({
      notificationId: "11111111-1111-4111-8111-111111111111",
    });

    expect(notificationsService.markRead).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      "11111111-1111-4111-8111-111111111111",
    );
    expect(res).toEqual(mockNotif);
  });

  it("marks all notifications as read", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    vi.mocked(notificationsService.markAllRead).mockResolvedValue({ count: 3 });

    const res = await authedCaller.notifications.markAllRead();

    expect(notificationsService.markAllRead).toHaveBeenCalledWith(dummyDb, user.id);
    expect(res).toEqual({ count: 3 });
  });
});
