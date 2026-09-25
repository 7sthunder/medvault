import { defineConfig } from "vitest/config";
import path from "node:path";

const aliases = {
  "@": path.resolve(__dirname, "./src"),
  "@shared": path.resolve(__dirname, "./src/shared"),
  "@server": path.resolve(__dirname, "./src/server"),
  "@features": path.resolve(__dirname, "./src/features"),
  "@components": path.resolve(__dirname, "./src/components"),
  "@lib": path.resolve(__dirname, "./src/lib"),
  "@db": path.resolve(__dirname, "./src/server/db"),
};

export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic" },
  },
  resolve: {
    alias: aliases,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Include calc + domain services + lib helpers
      include: [
        "src/shared/calc/**",
        "src/server/domain/**/*.ts",
        "src/lib/**/*.ts",
      ],
      // Exclude test files and type-only files
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "**/index.ts",
        "src/server/domain/**/schema.ts",
      ],
      reporter: ["text", "html", "json-summary"],
      // Phase 27 thresholds: calc ≥ 95%, domain services ≥ 80%
      thresholds: {
        "src/shared/calc/**": {
          statements: 95,
          branches: 80,
          functions: 95,
          lines: 95,
        },
        "src/server/domain/**": {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});