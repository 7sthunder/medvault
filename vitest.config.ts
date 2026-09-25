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
    // ...and pin the run to a single worker. `fileParallelism: false` alone still recycles
    // workers between files, and under v8 coverage a fresh worker can fail to answer within the
    // startup timeout — which Vitest reports as an unhandled error while *still* exiting 0,
    // silently dropping a whole test file. One worker for the run makes the file count
    // trustworthy. (Vitest 5 dropped `poolOptions`; `maxWorkers` is the supported lever.)
    maxWorkers: 1,
    // The default 5s budget is too tight for DB suites: the first query in a file pays the
    // connection handshake + plan compile, and `seedDemoWorkspace` re-seeds the whole fixture.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      // The pure decision cores. Everything here is where a wrong answer is a wrong dose state,
      // so it carries the strictest thresholds; React/server wiring is exercised by the E2E suite
      // and the DB-backed suites, which instrumentation would not make more meaningful.
      include: ["src/shared/calc/**", "src/shared/validations/**"],
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        "src/shared/calc/**": {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        "src/shared/validations/**": {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
