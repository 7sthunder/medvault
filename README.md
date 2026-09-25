# MedVault

**AI-assisted medication adherence & tracking.** MedVault answers two questions: *"What medicine do I need to take now?"* and *"How well am I following my schedule?"*

- Next.js 15 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS v4 + Base UI (shadcn-style) · Lucide icons
- PostgreSQL (Supabase) · Drizzle ORM · Better Auth
- Vitest + React Testing Library · Playwright · pnpm

> **AI boundary:** MedVault AI only surfaces adherence patterns (missed doses, timing, trends). It never diagnoses, prescribes, or makes clinical decisions.

---

## Quick Start

```bash
pnpm install          # 1. install dependencies
cp .env.example .env  # 2. configure environment (see below)
pnpm db:migrate       # 3. apply database migrations
pnpm db:seed          # 4. seed dev users + demo workspace
pnpm dev              # 5. run at http://localhost:3000
```

> **Demo path (no sign-up needed):** Navigate to [http://localhost:3000/demo](http://localhost:3000/demo) to explore a fully seeded demo workspace with realistic medication and adherence data. Use the **Simulate Actions** buttons to generate dose events, and **Reset Demo** to start fresh.

---

### Environment Variables

All values go in `.env` (git-ignored, never commit secrets). See `.env.example` for the full template.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase session-pooler (IPv4) connection string |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | Supabase project keys |
| `SUPABASE_JWKS_URL` | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `BETTER_AUTH_SECRET` | Auth signing secret — `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App origin (`http://localhost:3000` in dev) |
| `AI_GEMINI_API_KEY` | **Optional** — Gemini key for AI insights (app works without it) |
| `DEMO_CLOCK_OFFSET_MINUTES` | **Optional** — demo clock offset (`0` = real time) |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | TypeScript strict check (0 errors) |
| `pnpm lint` / `pnpm lint:fix` | ESLint check / autofix |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm test` | Vitest unit tests (462 tests) |
| `pnpm test:coverage` | Vitest with coverage report |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm db:generate` / `db:migrate` / `db:push` / `db:seed` | Drizzle DB ops |

The DB unit suite (`src/server/db/seed.test.ts`) auto-skips when no `DATABASE_URL` is present, so CI without credentials stays green.

---

## Feature Status

All 30 phases are complete. The application is fully functional.

| Area | Status |
|---|---|
| Landing page + Stitch design system | ✅ Done |
| Database — 16-table schema, migrations, seed | ✅ Done |
| Auth — login / register / session | ✅ Done |
| Onboarding wizard (3-step) | ✅ Done |
| Global app shell — sidebar, top nav, bottom nav, skip link | ✅ Done |
| Medications CRUD — create, edit, archive, detail | ✅ Done |
| Today's Schedule — dose timeline, take/snooze/skip actions | ✅ Done |
| Dose event reconciliation — server-determined missed state | ✅ Done |
| Adherence analytics — streaks, bucket stats, trend charts | ✅ Done |
| Dose history — filterable timeline with edit | ✅ Done |
| AI Insights — Gemini-powered, fallback-safe, behavioral-only | ✅ Done |
| Caregiver management — invite, accept, alert monitoring | ✅ Done |
| Reports — date range, granularity, per-medication scope | ✅ Done |
| Notifications — in-app bell, reminder preferences | ✅ Done |
| Settings — profile, reminders, appearance, data, caregiver | ✅ Done |
| Demo mode — isolated workspace, simulate actions, resettable | ✅ Done |
| Global error boundaries, loading skeletons, not-found pages | ✅ Done |
| Accessibility — skip link, ARIA, reduced-motion, WCAG 2.1 AA | ✅ Done |
| Unit & component test suite (462 tests, ≥95% calc coverage) | ✅ Done |
| E2E Playwright suite (9 spec files) | ✅ Done |
| Consistency audit — propagation matrix, single-source checks | ✅ Done |

---

## Application Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Marketing landing page | Public |
| `/login` | Sign in | Public |
| `/register` | Create account | Public |
| `/demo` | Demo mode tour | Public |
| `/onboarding` | First-run wizard | Auth required |
| `/dashboard` | Overview & quick actions | Auth required |
| `/medications` | Medication list | Auth required |
| `/medications/new` | Add medication | Auth required |
| `/medications/[id]` | Medication detail | Auth required |
| `/medications/[id]/edit` | Edit medication | Auth required |
| `/schedule` | Today's dose timeline | Auth required |
| `/schedule/[doseId]` | Dose detail | Auth required |
| `/adherence` | Analytics & streaks | Auth required |
| `/history` | Dose event timeline | Auth required |
| `/insights` | AI-powered patterns | Auth required |
| `/caregiver` | Caregiver management | Auth required |
| `/caregiver/alerts/[id]` | Alert detail | Auth required |
| `/reports` | Adherence reports | Auth required |
| `/notifications` | Notification centre | Auth required |
| `/settings` | Profile settings | Auth required |
| `/settings/reminders` | Reminder preferences | Auth required |
| `/settings/appearance` | Theme & motion | Auth required |
| `/settings/data` | Data export & delete | Auth required |
| `/settings/caregiver` | Caregiver access | Auth required |
| `/help` | Help & FAQ | Auth required |

---

## Project Structure

```
src/
  app/                       # Next.js App Router routes
    (marketing)/             # Landing page + design system
    (auth)/                  # Login, register
    (onboarding)/            # Onboarding wizard
    (app)/                   # All authenticated app routes
    demo/                    # Demo mode (public)
  components/
    ui/                      # Primitive UI components
    layout/                  # AppShell, Sidebar, TopNav, BottomNav
    icons/                   # SVG icon components
  features/                  # Feature-level components & pages
  lib/                       # tRPC client, a11y helpers, token-doc
  shared/                    # Pure: brand, enums, validations, calc
  server/
    db/                      # Drizzle schema, client, migrate, seed
    auth/                    # Better Auth instance
    trpc/                    # tRPC context, routers, procedures
    domain/                  # Business logic services (adherence, medications, etc.)
drizzle/                     # Generated SQL migrations
e2e/                         # Playwright test specs
  helpers/                   # Shared auth helpers
docs/                        # Design analysis, consistency verification
```

---

## Architecture Decisions

- **Single adherence source:** All pages call `adherenceService.summary()` via the `adherence.getSummary` TRPC procedure. No duplicated aggregation.
- **Server-determined missed doses:** The reconciliation job marks doses as `missed` server-side based on schedule. No client-only timer state.
- **Demo isolation:** Demo users are identified by a separate `medvault-demo-user` cookie. Real user sessions are untouched.
- **AI fallback safety:** AI insight failure returns an empty array — it never crashes pages.
- **Reduced motion:** Both `prefers-reduced-motion` OS preference and user `reduceMotion` setting are honoured via CSS and a `data-reduce-motion` attribute.

---

## License

Private project. All rights reserved.