/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { pathname, router } = vi.hoisted(() => ({
  pathname: { current: "/dashboard" },
  router: { push: vi.fn(), refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => router,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: vi.fn().mockResolvedValue(undefined) },
}));

import { AppShell } from "@/components/layout/AppShell";

const user = {
  id: "u-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  timezone: "America/New_York",
  onboardingCompleted: true,
};

function renderShell() {
  return render(
    <AppShell user={user}>
      <p>Page body</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders the sidebar, top header and page content", () => {
    renderShell();

    expect(screen.getByText("Page body")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Medications" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Today's Schedule" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "History" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Notifications" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Help" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Bottom navigation" })).toBeTruthy();
  });

  it("marks the current page as active in the sidebar", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Medications" }).getAttribute("aria-current")).toBeNull();
  });

  it("re-activates the nav when the pathname changes", () => {
    const view = renderShell();
    pathname.current = "/schedule";
    view.rerender(
      <AppShell user={user}>
        <p>Page body</p>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Today's Schedule" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBeNull();
  });

  it("renders a breadcrumb trail for the current page", () => {
    pathname.current = "/settings/reminders";
    renderShell();
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(crumbs.textContent).toContain("Settings");
    expect(crumbs.textContent).toContain("Reminders");
    expect(crumbs.textContent).toContain("Home");
  });

  it("opens the More bottom sheet on the mobile More action", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Menu" })).toBeTruthy());
    expect(screen.getByText("Everything in your vault.")).toBeTruthy();
    expect(document.querySelector("[data-slot='drawer-content']")).toBeTruthy();
  });

  it("opens the profile menu with user details and sign out", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open profile menu" }));
    await waitFor(() => expect(screen.getByText("ada@example.com")).toBeTruthy());
    expect(screen.getByRole("menuitem", { name: /Settings/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: /Sign out/ }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });
});