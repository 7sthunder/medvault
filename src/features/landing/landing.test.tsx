/* @vitest-environment jsdom */
import type { CSSProperties, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: (props: { href: string; children: ReactNode; className?: string; style?: CSSProperties }) => (
    <a href={props.href} className={props.className} style={props.style}>
      {props.children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const LazyHeroVisual = () => null;
    LazyHeroVisual.displayName = "LazyHeroVisual";
    return LazyHeroVisual;
  },
}));

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

import Hero from "@/features/landing/Hero";
import Nav from "@/features/landing/Nav";

describe("phase 04 marketing landing (/ — Nav + Hero smoke)", () => {
  it("renders nav with working auth routes", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create Vault" })).toHaveAttribute("href", "/register");
  });

  it("renders hero heading and primary/demo CTAs", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Your entire\s*medical life/i);
    expect(screen.getByRole("link", { name: /Create Your Health Vault/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /Watch Demo/i })).toHaveAttribute("href", "/demo");
  });
});