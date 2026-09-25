# MedVault

**AI-assisted medication adherence & tracking.** MedVault answers two questions: _"What medicine do I need to take now?"_ and _"How well am I following my schedule?"_

- Next.js 15 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Base UI) · Lucide icons
- PostgreSQL (Supabase) · Drizzle ORM · Better Auth
- Vitest + React Testing Library · Playwright · pnpm

> **AI boundary:** MedVault AI only surfaces adherence patterns (missed doses, timing, trends). It never diagnoses, prescribes, or makes clinical decisions.

---

## Quick Start

```bash
pnpm install        # 1. install dependencies
cp .env.example .env  # 2. configure environment (see below)
pnpm db:migrate     # 3. apply database migrations
pnpm db:seed        # 4. seed dev users + demo workspace
pnpm dev            # 5. run at http://localhost:3000
```

### Environment Variables

All values go in `.env` (git-ignored, never commit secrets). See `.env.example` for the full template with instructions.

| Variable                                                            | Purpose                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                      | Supabase session-pooler (IPv4) connection string — Project Settings → Database |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | Supabase project keys — Project Settings → API                                 |
| `SUPABASE_JWKS_URL`                                                 | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`                      |
| `BETTER_AUTH_SECRET`                                                | Auth signing secret — `openssl rand -base64 32`                                |
| `BETTER_AUTH_URL`                                                   | App origin (`http://localhost:3000` in dev)                                    |
| `AI_GEMINI_API_KEY`                                                 | Optional — Gemini key for AI insights                                          |
| `AI_GEMINI_MODEL`                                                   | Optional — insight text model (default `gemini-3.1-flash-lite`)                |
| `DEMO_CLOCK_OFFSET_MINUTES`                                         | Optional — demo clock offset (`0` = real time)                                 |

---

## Scripts

| Command                                                   | Description                 |
| --------------------------------------------------------- | --------------------------- |
| `pnpm dev`                                                | Dev server on :3000         |
| `pnpm build` / `pnpm start`                               | Production build / serve    |
| `pnpm typecheck`                                          | TypeScript check            |
| `pnpm lint` / `pnpm lint:fix`                             | ESLint check / autofix      |
| `pnpm format` / `pnpm format:check`                       | Prettier write / check      |
| `pnpm test` / `pnpm test:coverage`                        | Vitest unit tests           |
| `pnpm test:e2e`                                           | Playwright end-to-end tests |
| `pnpm db:generate` / `db:migrate` / `db:push` / `db:seed` | Database ops via Drizzle    |

The DB unit suite (`src/server/db/seed.test.ts`) auto-skips when no `DATABASE_URL` is present, so CI without credentials stays green.

### Testing

| Layer              | Scope                                                                  | Command              |
| ------------------ | ---------------------------------------------------------------------- | -------------------- |
| Unit / integration | `src/**/*.test.{ts,tsx}` (Vitest)                                      | `pnpm test`          |
| Coverage           | `src/shared/calc` + `src/shared/validations`, with enforced thresholds | `pnpm test:coverage` |
| End-to-end         | `e2e/*.spec.ts` (Playwright, Chromium)                                 | `pnpm test:e2e`      |

Unit tests run in a single forked process. The DB-backed suites share one demo user, so
`fileParallelism` is off and the pool is pinned to a single fork — otherwise a worker can time out
during startup and Vitest will drop a whole test file while still exiting 0.

E2E specs register real accounts and write rows. Point `E2E_DATABASE_URL` at a throwaway database
before running them; see `.env.example` and [`docs/verification.md`](docs/verification.md) for the
full pre-flight and the ordered release gate.

### Route Manifest

`NAV_ITEMS` in `src/shared/nav.ts` is the single source of truth for the sidebar, bottom nav and
route tests. `src/components/layout/nav-manifest.test.ts` fails if a nav href has no matching route
file — and, because the demo workspace renders the same screens under a `/demo/workspace` base path,
it also fails if a canonical href is missing its demo counterpart. Adding a screen therefore means
adding the route for both the real and the demo shell. `/caregiver/accept` is the one documented
exception: redeeming an invitation is session-only, so a demo subject can never complete it.

---

## Feature Status

| Area                                                                    | Status                 |
| ----------------------------------------------------------------------- | ---------------------- |
| Landing page + design system (Stitch tokens)                            | Done (Phases 03–04)    |
| Database — 16-table schema, migrations, seed                            | Done (Phase 05)        |
| Auth — login / register / onboarding / dashboard                        | In progress (Phase 06) |
| Schedule, medications, adherence, AI insights, caregiver, reports, demo | Planned (Phases 07–30) |

The full roadmap is specified in [`plan.md`](plan.md); per-phase progress is logged in [`impl.md`](impl.md). The design reference lives in [`docs/stitch-analysis.md`](docs/stitch-analysis.md).

---

## Project Structure

```
Landingpage/                 # Stitch design reference (kept untouched)
src/
  app/                       # routes: (marketing)/, (auth)/, (app)/
  components/                # ui/ primitives, brand/
  features/                  # feature components (landing, auth, ...)
  lib/                       # utils, trpc client
  shared/                    # brand, enums, validations, pure calc helpers
  server/
    db/                      # Drizzle schema, client, migrate, seed
    auth/                    # Better Auth instance
    trpc/                    # tRPC context / routers
drizzle/                     # generated SQL migrations
e2e/                         # Playwright specs
```

## License

Private project. All rights reserved.
