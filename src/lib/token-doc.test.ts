import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ALL_TOKENS,
  COLOR_TOKENS,
  DESIGN_CONSTANTS,
  SHADOW_TOKENS,
  TOKEN_MAP,
} from "@/lib/token-doc";

const GLOBALS_CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** globals.css + token-doc strings must match whitespace-insensitively. */
function normalize(cssBlock: string): string {
  return cssBlock.replace(/\s+/g, "");
}

const CSS_NORMALIZED = normalize(GLOBALS_CSS);

describe("design tokens (§5)", () => {
  it("token-doc table is internally valid", () => {
    expect(ALL_TOKENS.length).toBeGreaterThan(0);
    expect(new Map(ALL_TOKENS.map((t) => [t.label, t])).size).toBe(ALL_TOKENS.length);
    expect(TOKEN_MAP.size).toBe(ALL_TOKENS.length);
  });

  it("every colour token in token-doc is defined in globals.css", () => {
    for (const t of COLOR_TOKENS) {
      expect(CSS_NORMALIZED, `${t.cssVar} → ${t.value}`).toContain(
        normalize(`${t.cssVar}:${t.value}`),
      );
    }
  });

  it("every shadow token in token-doc is defined in globals.css", () => {
    for (const t of SHADOW_TOKENS) {
      expect(CSS_NORMALIZED, `${t.cssVar} → ${t.value}`).toContain(
        normalize(`${t.cssVar}:${t.value}`),
      );
    }
  });

  it("design constants (radius, gradients) exist in globals.css", () => {
    expect(CSS_NORMALIZED).toContain(
      normalize(`--radius:${DESIGN_CONSTANTS.radiusBase}`),
    );
    expect(CSS_NORMALIZED).toContain(DESIGN_CONSTANTS.heroGradientVar);
    expect(CSS_NORMALIZED).toContain(DESIGN_CONSTANTS.logoGradientVar);
  });

  it("semantic surface tokens are wired in @theme inline", () => {
    for (const varName of [
      "--background",
      "--foreground",
      "--card",
      "--popover",
      "--muted",
      "--accent",
      "--border",
      "--input",
      "--sidebar",
    ]) {
      expect(CSS_NORMALIZED, `${varName} inline mapping`).toContain(
        normalize(`--color${varName.replace("--", "-")}:var(${varName})`),
      );
    }
  });

  it("extended tokens (§12 tints) are explicitly marked, not silent drift", () => {
    const extended = ALL_TOKENS.filter((t) => t.provenance === "extended");
    expect(extended.map((t) => t.label).sort()).toEqual(["amber-tint", "red-tint"]);
  });

  it("dark theme overrides the light surfaces (§5.7)", () => {
    expect(CSS_NORMALIZED).toContain(normalize("--background:#0f172a"));
    expect(CSS_NORMALIZED).toContain(normalize("--card:#1e293b"));
    expect(CSS_NORMALIZED).toContain(normalize("--border:#334155"));
  });

  it("no §5.3 token value drifts from the §7-verified hexes", () => {
    const verified: Record<string, string> = {
      primary: "#10b981",
      "primary-dark": "#059669",
      secondary: "#06b6d4",
      magenta: "#f472b6",
      violet: "#8b5cf6",
      blue: "#3b82f6",
      "blue-tint": "#dbeafe",
      amber: "#f59e0b",
      "ink-900": "#0f172a",
      "ink-500": "#64748b",
      "bg-soft": "#f1f5f9",
      border: "#e2e8f0",
    };
    for (const [label, hex] of Object.entries(verified)) {
      const entry = TOKEN_MAP.get(label);
      expect(entry, `token-doc entry for ${label}`).toBeDefined();
      expect(entry!.value.toLowerCase()).toBe(hex.toLowerCase());
    }
  });
});