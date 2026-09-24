# AADHI — Core Medication Track (Phases 09–15)

> Your branch is **100% file-isolated** from `bala` and `hp`: no file you create or
> edit exists on their branches, and no file they create/edit exists on yours — by
> contract. Follow the TERRITORY / FROZEN / SEAMS sections below strictly. Tomorrow
> all three merge into `main` (order: aadhi → bala → hp); if everyone stayed in
> their territory, `git merge` succeeds with **zero conflicts**.

- Branch: `aadhi` · Base: `main` @ `3c427aa` (merged in) · Merge target: `main` (**first**)
- Phases: **09, 10, 11, 12, 13, 14, 15** — do them in this order.

---

## 1. YOUR TERRITORY (only you create/edit these)

| Kind | Paths |
|---|---|
| Router registration | `src/server/trpc/routers/aadhi.ts` — **the only file you register routers in** |
| tRPC routers | `src/server/trpc/routers/{onboarding,medication,schedule,dose}.ts` |
| Domain | `src/server/domain/medications/`, `medicationSchedules/`, `doseEvents/` (except `attachments.ts`, see SEAMS), `doseActions/` |
| Scheduler | `jobs/` (create `jobs/scheduler.ts` — **yours only**, see SEAMS/scheduler rule) |
| App shell | `src/app/(app)/layout.tsx` (rewrite the Phase 06 placeholder), placeholder pages `dashboard/page.tsx` + `onboarding/page.tsx` stay untouched |
| Shell components | `src/components/layout/{AppShell,Sidebar,TopNav,Breadcrumbs,ProfileMenu,BottomNav,MoreSheet}.tsx` |
| Features | `src/features/onboarding/`, `src/features/schedule/`, `src/features/dose/`, `src/features/medications/` |
| Domain calc | `src/shared/calc/schedule.ts`, `src/shared/calc/doseState.ts` (new files) |
| E2E | `e2e/shell.spec.ts`, `e2e/schedule.spec.ts`, `e2e/medication-crud.spec.ts` (new files, self-contained, no `e2e/helpers`) |
| This plan | `aadhi.md` (your work log lives here, not in `impl.md`) |

## 2. FROZEN — shared files you MUST NOT edit

- `src/server/trpc/root.ts` — composition only; registers `...aadhiRouters` via your `aadhi.ts` record.
- `src/lib/trpc.tsx` — the shared typed client: `import { api, TRPCProvider } from "@/lib/trpc"`. You MOUNT `<TRPCProvider>` in `(app)/layout.tsx` (your file); you never edit `trpc.tsx`.
- `src/server/domain/doseEvents/attachments.ts` — missed-dose registry. Your `reconcile.ts` **calls** `runMissedDoseHandlers(…)`; you never edit the file itself.
- `src/components/layout/NotificationBell.tsx` — pre-made stub on main; your `TopNav.tsx` **imports** it; you never edit it (hp re-implements live later).
- `src/shared/nav.ts`, `src/shared/enums.ts`, `src/shared/types.ts`, `src/shared/times.ts`, `src/shared/status.ts`, `src/shared/brand.ts`, `src/shared/constants.ts`, `src/shared/validations/*` — already complete for all tracks. Consume, don't modify.
- `src/server/db/schema.ts`, `src/server/db/*` — schema is done; your services read/write via the existing tables, **no schema changes**.
- `src/components/ui/**` + `src/components/brand/**` — Phase 08 catalog, frozen (Phase 26 does a11y refinements on `main` after merge).
- `src/lib/*`, `src/features/auth/*`, `src/features/landing/*`, `src/app/(marketing)/**`, `src/app/(auth)/**` (except onboarding page — see territory), `package.json`, `pnpm-lock.yaml`, `impl.md`, `playwright.config.ts`, `vitest.config.ts`.
- **No new dependencies on this branch** — `package.json`/lockfile are frozen; if you truly need one, note it in `aadhi.md` and add it at merge time.

## 3. SEAMS & single-owner shared files

- **`src/server/trpc/root.ts` is a frozen composition already wired to spread your `aadhiRouters`.** To expose a router: build `scheduleRouter`, then in `routers/aadhi.ts`: `import { scheduleRouter } …; export const aadhiRouters = { schedule: scheduleRouter, … }`. Done — no other file changes.
- **Missed-dose hook:** in your `doseEvents/reconcile.ts`, after auto-missing a dose, call
  `await runMissedDoseHandlers({ userId, medicationId, doseEventId, scheduledFor })`
  (import from `./attachments`, the frozen registry). hp attaches notifications/caregiver alerts there without touching your files.
- **Scheduler rule:** `jobs/scheduler.ts` is yours. hp's Phase 22 producers must NOT edit it — its due-reminder/demo producers run via on-read `catchUp` + attachments, not your job. Keep the job to aadhi reconcile only.
- **`(app)/layout.tsx` + `TRPCProvider`:** mount `<TRPCProvider>` inside your shell once (layout level). bala/hp pages render as children of your layout on merge — your layout must wrap `{children}` only and stay provider-agnostic.

## 4. Phase objectives (detail lives in `plan.md` §21)

- **09 Shell:** `requireUser()` + `<TRPCProvider>` + `AppShell` (sidebar/topbar/breadcrumb/bottom-nav/more-sheet), group `loading/error/not-found`. `TopNav` imports the frozen `NotificationBell`. Nav model from `src/shared/nav.ts` — already complete, do not extend.
- **10 Onboarding:** replace `onboarding/page.tsx`; wizard (profile → reminders → finish); upsert `user_preferences`, set `onboardingCompleted` via the Phase 06 mutation; optional "Add Metformin 500mg 2×/day" via your Phase 11 `medicationService.create`.
- **11 Medication service:** `server/domain/medications/{service,repo,mapper}.ts`; procedures list/get/create/update/setStatus/archive, owner-checked, duplicate-name guard, archived excluded. Leave a thin `ensureDoseEvents` stub for 12.
- **12 Schedule + dose-event generation:** `shared/calc/schedule.ts` (pure), `medicationSchedules/service.ts`, `doseEvents/service.ts` (`ensureDoseEvents`/`voidFuture`/`extendHorizon`, idempotent on `(medicationId, scheduledFor)`, tz via `@shared/times`, deterministic).
- **13 Dose state machine + reconcile:** `shared/calc/doseState.ts` (pure), `doseEvents/reconcile.ts` (+ the missed-dose hook above), `doseActions/service.ts` (take/snooze/skip/restore + audit). §10.3/§10.4 rules.
- **14 Today's Schedule + dose UI:** `routers/schedule.ts` (reconciled day DTO), `routers/dose.ts` (take/snooze/skip), `features/schedule/*`, `features/dose/*`. Optimistic react-query via `api.*`; respect `demoNow()` seam.
- **15 Medication CRUD UI:** `features/medications/*` wired to 11/12.

## 5. Verify before you commit

- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` — all green.
- Unit/component tests for your features (jsdom, RTL); wrap components with `TRPCProvider` or mock `api` as needed.
- E2E: your shell/schedule/medication specs run against your own shell — they should pass on your branch since the shell is yours.
- Keep your work log in `aadhi.md`. Do **not** touch `impl.md`.

## 6. What you can assume about bala/hp (they will NOT create/edit any of your files)

- bala — Phases 16–20, 24, 26 (adherence engine/UI, dashboard, history, reports, settings). Reads your `dose_events`/`dose_actions` rows read-only; registers only in `routers/bala.ts`.
- hp — Phases 21–23, 25, 27–30 (caregiver, notifications, AI, demo, tests, deploys). Attaches to your missed-dose hook via frozen `attachments.ts`; replaces the frozen `NotificationBell` on `main` after you merge.