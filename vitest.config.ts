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
    // DB-backed suites (seed, dose events, adherence) share the live Supabase demo user;
    // serialize files so concurrent `seedDemoWorkspace` runs can't clobber one another.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/shared/calc/**"],
      reporter: ["text", "html"],
    },
  },
});