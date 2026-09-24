<div align="center">

# MedVault · MediTrack AI

**AI-assisted smart medication adherence & tracking**

*"What medicine do I need to take now?" · "How well am I following my schedule?"*

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Better Auth](https://img.shields.io/badge/Better%20Auth-1.7-000000)

</div>

---

MedVault is a medication adherence and tracking application. It answers two
questions immediately: **what medicine do I need to take now**, and **how well am
I following my medication schedule** — with dose reminders, snooze/missed/skip
tracking, adherence streaks, AI insights, caregiver alerts, and reports.

> **AI boundary:** MedVault AI is strictly *behavioral / adherence intelligence*.
> It surfaces patterns in missed doses, timing, trends and snooze behaviour. It
> **never** diagnoses, prescribes, or makes clinical decisions.

## ✨ Feature Status

| Area | Status |
|---|---|
| Landing page (`/`, ported from the Stitch design) | ✅ Done (Phase 04) |
| Design system (Stitch tokens → Tailwind theme + primitives) | ✅ Done (Phase 03) |
| Database foundation — 16-table Supabase schema + seed | ✅ Done (Phase 05) |
| Auth — login / register / onboarding / dashboard | 🚧 In progress (Phase 06) |
| Today's Schedule, medications CRUD, adherence, reports, AI insights, caregiver, demo mode | 📋 Planned (Phases 07–30) |

## 🧰 Tech Stack

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript (strict)
- **Styling:** Tailwind CSS v4 (CSS-first `@theme` tokens) · shadcn/ui (Base UI) · Lucide icons
- **Data:** PostgreSQL (Supabase) · Drizzle ORM · drizzle-kit migrations · `pg`
- **Auth:** Better Auth (email/password → Drizzle adapter)
- **API:** tRPC v11 + TanStack Query (planned)
- **Testing:** Vitest + React Testing Library (unit) · Playwright (E2E)
- **Tooling:** pnpm · ESLint · Prettier

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) 9+
- A [Supabase](https://supabase.com/) project (free tier is fine)
  - Your **Project Ref** (e.g. `abcd...`) and **database password**
  - Generate an auth secret: `openssl rand -base64 32`

### 1. Install

```bash
git clone https://github.com/7thunder/medvault.git
cd medvault
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the values in `.env`:

| Variable | Description | Where to find it |
|---|---|---|
| `DATABASE_URL` | Supabase **session pooler (IPv4)** connection string | Supabase Dashboard → Project Settings → Database → Connection string → *Session pooler* |
| `SUPABASE_URL` | Your Supabase project URL | Project Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key | Project Settings → API |
| `SUPABASE_SECRET_KEY` | Service role / secret key | Project Settings → API |
| `SUPABASE_JWKS_URL` | JWKS endpoint for verifying auth tokens | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `BETTER_AUTH_SECRET` | Auth signing secret | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App origin | `http://localhost:3000` in dev |
| `AI_GEMINI_API_KEY` | *(optional)* Gemini key for AI insights | Google AI Studio |
| `DEMO_CLOCK_OFFSET_MINUTES` | *(optional)* demo clock offset | `0` = real time |

> ⚠️ `.env` is git-ignored — never commit real secrets.

### 3. Set up the database

```bash
pnpm db:migrate   # apply the committed Drizzle migrations to Supabase
pnpm db:seed      # idempotent seed: 2 dev users + the §19 "Arun Kumar" demo workspace
```

The seed is safe to re-run any time (it rebuilds the demo workspace).

### 4. Run the app

```bash
pnpm dev   # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — you should see the MedVault
landing page. Sign up via `/register` (or log in with a seeded dev user /
`demo@medvault.demo`).

Other run modes:

```bash
pnpm build && pnpm start   # production build + serve
```

## 📜 Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm lint` / `pnpm lint:fix` | ESLint check / autofix |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:coverage` | Run Vitest with coverage |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm db:generate` | Generate a migration from the schema |
| `pnpm db:migrate` | Apply migrations to the database |
| `pnpm db:push` | Push the schema straight to the DB (dev) |
| `pnpm db:seed` | Seed the database (idempotent) |

## 🧪 Testing

```bash
pnpm test        # unit / component tests
pnpm test:e2e    # end-to-end (spins up the dev server on :3000 automatically)
pnpm test:coverage
```

The DB unit suite (`src/server/db/seed.test.ts`) automatically **skips** when no
`DATABASE_URL` is present, so CI without credentials stays green.

## 📁 Project Structure

```
medvault/
├─ Landingpage/                    # Stitch design reference (kept untouched)
├─ docs/stitch-analysis.md         # Phase 01 design/token analysis
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/              # "/" landing page + dev-only /design-system
│  │  ├─ (auth)/                   # login / register
│  │  └─ (app)/                    # authenticated shell (dashboard, onboarding, …)
│  ├─ components/                  # design-system primitives (ui/, brand/)
│  ├─ features/                    # feature components (landing, auth, …)
│  ├─ lib/                         # utils, trpc client, formatting
│  ├─ shared/                      # brand, enums, validations, pure calc helpers
│  │  └─ calc/                     # schedule / doseState / adherence / streaks
│  └─ server/
│     ├─ db/                       # Drizzle schema, client, migrate, seed
│     ├─ auth/                     # Better Auth server instance
│     └─ trpc/                     # tRPC context / routers
├─ drizzle/                        # generated SQL migrations
├─ e2e/                            # Playwright specs
├─ plan.md                         # implementation plan (30 phases)
└─ impl.md                         # implemented-work log
```

## 📚 Documentation

- [`plan.md`](plan.md) — the full 30-phase implementation plan (single source of truth)
- [`impl.md`](impl.md) — per-phase implemented work log
- [`docs/stitch-analysis.md`](docs/stitch-analysis.md) — design analysis of the original Stitch export

## 🔒 Security Notes

- No hardcoded secrets; everything comes from `.env`
- Passwords handled by Better Auth (hashed), sessions in DB with HTTP-only cookies
- `src/features/**` is lint-gated: no raw hex/rgba literals in feature code — all colors come from design tokens

## 📄 License

Private project. All rights reserved.