# MedVault

**AI-assisted medication adherence & tracking.** MedVault answers two questions: *"What medicine do I need to take now?"* and *"How well am I following my schedule?"*

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

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase session-pooler (IPv4) connection string — Project Settings → Database |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | Supabase project keys — Project Settings → API |
| `SUPABASE_JWKS_URL` | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `BETTER_AUTH_SECRET` | Auth signing secret — `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App origin (`http://localhost:3000` in dev) |
| `AI_GEMINI_API_KEY` | Optional — Gemini key for AI insights |
| `DEMO_CLOCK_OFFSET_MINUTES` | Optional — demo clock offset (`0` = real time) |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` / `pnpm lint:fix` | ESLint check / autofix |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm test` / `pnpm test:coverage` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm db:generate` / `db:migrate` / `db:push` / `db:seed` | Database ops via Drizzle |

The DB unit suite (`src/server/db/seed.test.ts`) auto-skips when no `DATABASE_URL` is present, so CI without credentials stays green.

---

## Feature Status

| Area | Status |
|---|---|
| Landing page + design system (Stitch tokens) | Done (Phases 03–04) |
| Database — 16-table schema, migrations, seed | Done (Phase 05) |
| Auth — login / register / onboarding / dashboard | In progress (Phase 06) |
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