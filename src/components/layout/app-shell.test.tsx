/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/layout/AppShell";
import { getBreadcrumbSegments } from "@/components/layout/Breadcrumbs";
import { getInitials } from "@/components/layout/ProfileMenu";

let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: () => ({
      notifications: {
        unreadCount: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    }),
    notifications: {
      unreadCount: {
        useQuery: () => ({ data: { count: 0 }, isLoading: false }),
      },
      list: {
        useQuery: () => ({ data: { notifications: [] }, isLoading: false }),
      },
      markAllRead: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      markRead: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));

function stubMatchMedia(small: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: small ? true : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Breadcrumbs logic", () => {
  it("resolves root and dashboard correctly", () => {
    expect(getBreadcrumbSegments("/dashboard")).toEqual([
      { label: "Dashboard", isCurrent: true },
    ]);
  });

  it("resolves nested routes into breadcrumb trail", () => {
    expect(getBreadcrumbSegments("/medications/new")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Medications", href: "/medications" },
      { label: "New", isCurrent: true, href: undefined },
    ]);
  });

  it("handles IDs nicely as Details", () => {
    const segments = getBreadcrumbSegments("/medications/019318b8-20d8-795a-939e-b816a7f0175b");
    expect(segments).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Medications", href: "/medications" },
      { label: "Details", isCurrent: true, href: undefined },
    ]);
  });
});

describe("ProfileMenu helper", () => {
  it("computes initials correctly", () => {
    expect(getInitials("Arun Kumar", "arun@example.com")).toBe("AK");
    expect(getInitials("Alice", "alice@example.com")).toBe("AL");
    expect(getInitials(null, "bob@example.com")).toBe("BO");
    expect(getInitials(null, null)).toBe("MV");
  });
});

describe("AppShell component", () => {
  beforeEach(() => {
    mockPathname = "/dashboard";
    stubMatchMedia(false);
  });

  it("renders desktop sidebar, topnav, and children", () => {
    render(
      <AppShell user={{ name: "Arun Kumar", email: "arun@example.com" }}>
        <div data-testid="test-content">Dashboard Content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    const sidebar = screen.getByLabelText("Sidebar navigation");
    expect(sidebar).toBeInTheDocument();
    expect(within(sidebar).getByText("Medications")).toBeInTheDocument();
    expect(within(sidebar).getByText("Today's Schedule")).toBeInTheDocument();
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("renders mobile bottom navigation with 5 items", () => {
    render(
      <AppShell user={{ name: "Arun Kumar", email: "arun@example.com" }}>
        <div>Mobile Content</div>
      </AppShell>,
    );

    const bottomNav = screen.getByLabelText("Mobile navigation");
    expect(bottomNav).toBeInTheDocument();

    expect(within(bottomNav).getByRole("link", { name: /Schedule/i })).toBeInTheDocument();
    expect(within(bottomNav).getByRole("link", { name: /Medications/i })).toBeInTheDocument();
    expect(within(bottomNav).getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(within(bottomNav).getByRole("link", { name: /Adherence/i })).toBeInTheDocument();
    expect(within(bottomNav).getByRole("button", { name: /More/i })).toBeInTheDocument();
  });

  it("clicking More in bottom nav opens the MoreSheet drawer", async () => {
    const user = userEvent.setup();
    render(
      <AppShell user={{ name: "Arun Kumar", email: "arun@example.com" }}>
        <div>Main Area</div>
      </AppShell>,
    );

    const moreBtn = screen.getByRole("button", { name: /More/i });
    await user.click(moreBtn);

    expect(screen.getByText("More Options")).toBeInTheDocument();
    expect(screen.getByText("Past dose events and log")).toBeInTheDocument();
    expect(screen.getByText("Family & clinician access")).toBeInTheDocument();
    expect(screen.getByText("Help & Support")).toBeInTheDocument();
  });
});
