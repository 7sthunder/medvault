import { describe, expect, it } from "vitest";

import { medColorPrefix } from "@/shared/medColor";

const named: Readonly<[string, string][]> = [
  ["#10b981", "primary"],
  ["#ef4444", "red"],
  ["#3b82f6", "blue"],
  ["#06b6d4", "blue"],
  ["#8b5cf6", "violet"],
  ["#f59e0b", "amber"],
  ["#64748b", "slate"],
];

describe("medColorPrefix (phase 14)", () => {
  it("maps the brand default and editor swatches to semantic prefixes", () => {
    for (const [hex, prefix] of named) {
      expect(medColorPrefix(hex)).toBe(prefix);
    }
  });

  it("falls back to a channel heuristic then slate for unknown hexes", () => {
    expect(medColorPrefix("#F87171")).toBe("red");
    expect(medColorPrefix("#0f766e")).toBe("teal");
    expect(medColorPrefix("#123456")).toBe("slate");
    expect(medColorPrefix("garbage")).toBe("slate");
  });
});
