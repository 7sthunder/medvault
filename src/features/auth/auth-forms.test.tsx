/* @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  getSession: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signInEmail },
    signUp: { email: mocks.signUpEmail },
    getSession: mocks.getSession,
    signOut: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

import LoginForm from "@/features/auth/LoginForm";
import RegisterForm from "@/features/auth/RegisterForm";

describe("LoginForm (phase 06)", () => {
  it("shows client-side validation errors on an empty submit and does not call the API", async () => {
    const user = userEvent.setup();
    render(<LoginForm next={null} />);

    await user.click(screen.getByRole("button", { name: /Access Vault/i }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mocks.signInEmail).not.toHaveBeenCalled();
  });

  it("signs in, normalises the email and honours a valid next path", async () => {
    mocks.signInEmail.mockResolvedValue({ data: {}, error: null });
    mocks.getSession.mockResolvedValue({ data: { user: { name: "Alice" } }, error: null });
    const user = userEvent.setup();
    render(<LoginForm next="/medications" />);

    await user.type(screen.getByLabelText(/Email Address/i), "  Alice@Example.com ");
    await user.type(screen.getByPlaceholderText("••••••••"), "vaultPass9");
    await user.click(screen.getByRole("button", { name: /Access Vault/i }));

    await waitFor(() => {
      expect(mocks.signInEmail).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "vaultPass9",
        rememberMe: false,
      });
      expect(mocks.push).toHaveBeenCalledWith("/medications");
    });
  });

  it("maps invalid credentials to the §5 destructive Alert", async () => {
    mocks.signInEmail.mockResolvedValue({
      data: null,
      error: { code: "invalid_email_or_password" },
    });
    const user = userEvent.setup();
    render(<LoginForm next={null} />);

    await user.type(screen.getByLabelText(/Email Address/i), "alice@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrongPass1");
    await user.click(screen.getByRole("button", { name: /Access Vault/i }));

    expect(
      await screen.findByText("That email or password is incorrect. Try again."),
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("RegisterForm (phase 06)", () => {
  it("rejects a weak password client-side without calling the API", async () => {
    const user = userEvent.setup();
    render(<RegisterForm next={null} />);

    await user.type(screen.getByLabelText(/Full Name/i), "Alice");
    await user.type(screen.getByLabelText(/Email Address/i), "alice@example.com");
    await user.type(screen.getByPlaceholderText("At least 8 chars, letter + number"), "abc123");
    await user.click(screen.getByRole("button", { name: /Create Vault/i }));

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(mocks.signUpEmail).not.toHaveBeenCalled();
  });

  it("creates an account and routes a fresh user to /onboarding", async () => {
    mocks.signUpEmail.mockResolvedValue({ data: {}, error: null });
    mocks.getSession.mockResolvedValue({ data: { user: {} }, error: null });
    const user = userEvent.setup();
    render(<RegisterForm next={null} />);

    await user.type(screen.getByLabelText(/Full Name/i), "Sarah Jenkins");
    await user.type(screen.getByLabelText(/Email Address/i), "sarah@example.com");
    await user.type(screen.getByPlaceholderText("At least 8 chars, letter + number"), "vaultPass9");
    await user.click(screen.getByRole("button", { name: /Create Vault/i }));

    await waitFor(() => {
      expect(mocks.signUpEmail).toHaveBeenCalledWith({
        name: "Sarah Jenkins",
        email: "sarah@example.com",
        password: "vaultPass9",
      });
      expect(mocks.push).toHaveBeenCalledWith("/onboarding");
    });
  });
});
