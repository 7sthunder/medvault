/* @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button (ui scaffold)", () => {
  it("renders a labeled button element", () => {
    render(<Button>Get started</Button>);
    expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
  });

  it("renders the outline variant with the data-slot marker", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const rendered = container.querySelector('button[data-slot="button"]');
    expect(rendered).toBeInTheDocument();
    expect(rendered).toHaveTextContent("Outline");
  });
});