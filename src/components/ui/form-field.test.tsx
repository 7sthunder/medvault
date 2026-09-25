/* @vitest-environment jsdom */
/**
 * Phase 27 — Component tests for FormField.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormField } from "./form-field";

afterEach(() => {
  cleanup();
});

describe("FormField", () => {
  it("renders label text", () => {
    render(
      <FormField label="Email Address">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText("Email Address")).toBeDefined();
  });

  it("associates label with input via htmlFor/id", () => {
    render(
      <FormField label="Username">
        <input type="text" />
      </FormField>,
    );
    const label = screen.getByText("Username");
    const labelFor = label.getAttribute("for");
    // Input should have the same id
    const input = document.getElementById(labelFor!);
    expect(input).not.toBeNull();
    expect(input?.tagName).toBe("INPUT");
  });

  it("shows required star when required=true", () => {
    const { container } = render(
      <FormField label="Password" required>
        <input type="password" />
      </FormField>,
    );
    // The * is aria-hidden
    const star = container.querySelector('[aria-hidden="true"]');
    expect(star?.textContent).toBe("*");
  });

  it("does not show star when not required", () => {
    const { container } = render(
      <FormField label="Optional">
        <input type="text" />
      </FormField>,
    );
    const hiddenSpans = container.querySelectorAll('[aria-hidden="true"]');
    expect([...hiddenSpans].some((s) => s.textContent === "*")).toBe(false);
  });

  it("renders error message with role=alert", () => {
    render(
      <FormField label="Email" error="Invalid email address">
        <input type="email" />
      </FormField>,
    );
    const errorAlert = screen.getByRole("alert");
    expect(errorAlert.textContent).toContain("Invalid email address");
  });

  it("sets aria-invalid on input when error is present", () => {
    render(
      <FormField label="Email" error="Required">
        <input type="email" />
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders hint text when no error", () => {
    render(
      <FormField label="Email" hint="Enter your work email">
        <input type="email" />
      </FormField>,
    );
    expect(screen.getByText("Enter your work email")).toBeDefined();
  });

  it("hides hint when error is shown (error takes precedence)", () => {
    render(
      <FormField label="Email" error="Invalid" hint="Use work email">
        <input type="email" />
      </FormField>,
    );
    // Hint should not render when error is active
    expect(screen.queryByText("Use work email")).toBeNull();
  });

  it("preserves explicit id if provided on child", () => {
    render(
      <FormField label="Phone">
        <input type="tel" id="my-phone" />
      </FormField>,
    );
    const input = document.getElementById("my-phone");
    expect(input).not.toBeNull();
  });
});
