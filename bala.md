# BALA — Insights & Reporting Track (Phases 16–20, 24, 26)

> Your branch is **100% file-isolated** from `aadhi` and `hp`: no file you create or
> edit exists on their branches, and no file they create/edit exists on yours — by
> contract. Follow the TERRITORY / FROZEN / SEAMS sections below strictly. Tomorrow
> all three merge into `main` (order: aadhi → bala → hp); if everyone stayed in
> their territory, `git merge` succeeds with **zero conflicts**.

- Branch: `bala` · Base: `main` @ `3c427aa` (merged in) · Merge target: `main` (**second**)
- Phases: **16, 17, 18, 19, 20, 24, 26** — in this order. 26 runs on `main` after everyone merges.

---

## 1. YOUR TERRITORY (only you create/edit these)

| Kind | Paths |
|---|---|
| Router registration | `src/server/trpc/routers/bala.ts` — **the only file you register routers in** |
| tRPC routers | `src/server/trpc/routers/{adherence,dashboard,history,reports,settings}.ts` |
| Domain | `src/server/domain/adherence/`, `dashboard/`, `history/`, `reports/`, `settings/` |
| App routes | `src/app/(app)/dashboard/page.tsx` (replace Phase 06 placeholder), `src/app/(app)/adherence/`, `src/app/(app)/history/`, `src/app/(app)/reports/`, `src/app/(app)/settings/` (all **new** dirs, incl. `settings/layout.tsx`) |
| Features | `src/features/dashboard/`, `src/features/adherence/`, `src/features/history/`, `src/features/reports/`, `src/features/settings/` |
| Domain calc | `src/shared/calc/adherence.ts`, `src/shared/calc/streaks.ts`, `src/shared/calc/performance.ts` (new files) |
| A11y helpers | `src/lib/a11y.ts` (Phase 26) — the only new `src/lib/*` file allowed |
| E2E | `e2e/adherence.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/reports.spec.ts`, `e2e/history.spec.ts` (new files, self-contained, no `e2e/helpers`) |
| This plan | `bala.md` (your work log lives here, not in `impl.md`) |

## 2. FROZEN — shared files you MUST NOT edit

- `src/server/trpc/root.ts` — composition only; registers `...balaRouters` via your `bala.ts` record.
- `src/lib/trpc.tsx` — the shared typed client: `import { api, TRPCProvider } from "@/lib/trpc"`. Use it, never edit it.
- `src/shared/nav.ts`, `src/shared/enums.ts`, `src/shared/types.ts`, `src/shared/times.ts`, `src/shared/status.ts`, `src/shared/brand.ts`, `src/shared/constants.ts`, `src/shared/validations/*` — all track contracts are already here (incl. `reportsSchemaFor`, `adherence` DTOs, `RangePresets`). Consume, don't modify.
- `src/server/db/schema.ts`, `src/server/db/*` — schema is done; **no schema changes**.
- `src/server/domain/doseEvents/` and `doseActions/` (aadhi's) — you READ their tables (`dose_events`, `dose_actions`, `medications`) read-only. **Never** import or edit aadhi service files.
- `src/components/ui/**`, `src/components/brand/**`, `src/components/layout/**` — Phase 08 + aadhi's shell, frozen until **Phase 26**, which you run on `main` after merges. Do not touch any of these on your branch.
- `src/app/(app)/layout.tsx` (aadhi's shell), `src/features/auth/*`, `(marketing)/**`, `(auth)/**`, `src/lib/*` (except your new `a11y.ts`), `src/server/trpc/routers/{aadhi,bala,hp}.ts` shells except your own, `package.json`, `pnpm-lock.yaml`, `impl.md`, `jobs/`, `e2e/{shell,schedule,medication-crud,home,design-system,auth}.spec.ts`.
- **No new dependencies on this branch** — `package.json`/lockfile are frozen (CSV export uses Node built-ins).

## 3. SEAMS & integration by contract (no shared-file edits)

- **Adherence must be computed lazily + idempotently.** aadhi's dose services do NOT call into your `materialize` (that would cross file boundaries). Instead `adherence.summary(…)` recomputes the bounded window on read and updates `adherence_daily` itself. Same numbers everywhere, zero coupling.
- **Register routers** by building `adherenceRouter`, then in `routers/bala.ts`:
  `import { adherenceRouter } …; export const balaRouters = { adherence: adherenceRouter, … }`. No `root.ts` edits.
- **Stubs you ship (filled by hp on `main` after you merge):** in `features/dashboard/InsightWidget.tsx` and `CaregiverStatus.tsx` keep the props/DTO seams — hp fills these later. In `settings/caregiver/page.tsx` ship a neutral placeholder linking to `/caregiver` — hp replaces it as a post-merge step on `main`. You and hp never edit the same file in parallel.
- **Dashboard composition calls your own routers + aadhi's** (`api.schedule.*`, `api.dose.*`) — fine at the API level (types resolve per-branch); your branch only owns *calls*, never aadhi's files.
- **demoNow()**: drive charts/`rangeByPreset` from `@shared/times` + session timezone; do not write time logic.

## 4. Phase objectives (detail in `plan.md` §21)

- **16 Adherence engine:** `shared/calc/{adherence,streaks,performance}.ts` (pure §10.5), `domain/adherence/{service,summary,materialize}.ts`, `routers/adherence.ts`. **The §19 test must pass: seeded data ⇒ exactly 84/76/5/3, 90.5% (1dp), 7-day streak.** Missing-data days = gaps, not zeros.
- **17 Adherence UI:** `features/adherence/*` on `/adherence` + `/adherence/medications`, all values from one `AdherenceSummaryDTO`, reuse Phase 08 `TrendChart`/`DataTable`.
- **18 Dashboard:** `domain/dashboard/service.ts`, `routers/dashboard.ts` (single `dashboard.get`), `features/dashboard/*` incl. the two stubs above, `dashboard/page.tsx`. `NextDoseHero`/`TodayFeed` consume the reconciled day from `api.schedule.*`.
- **19 History:** `domain/doseActions/history.ts` (reads aadhi's audit tables read-only), `routers/history.ts`, `features/history/*`.
- **20 Reports:** `domain/reports/service.ts`, `routers/reports.ts`, `src/app/api/reports/export/route.ts`, `features/reports/*`. **On the server boundary call `reportsSchemaFor(serverToday)`** (never the loose client schema).
- **24 Settings:** `routers/settings.ts`, `domain/settings/service.ts`, `features/settings/*`, `(app)/settings/layout.tsx` + 5 pages. Appearance toggles the `dark` class only.
- **26 A11y/responsive (run on `main` AFTER merges):** fixes across `src/app/**/{error,loading,not-found}` + `src/components/ui/**` are fine **on main only** — that's your post-merge pass, not a parallel-branch edit.

## 5. Verify before you commit

- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` — all green on your branch.
- Unit/component tests for routers/services/features (jsdom, RTL); wrap components with `TRPCProvider` or mock `api`. Your e2e specs target routes that render inside aadhi's shell — that shell does not exist on your branch, so **defer running your 4 e2e specs until aadhi merges** (they stay committed, run green on `main`). Router/service unit tests cover you now.
- Keep your work log in `bala.md`. Do not touch `impl.md`.

## 6. What you can assume about aadhi/hp

- aadhi — Phases 09–15: the `(app)` shell, `TRPCProvider` (yours to mount? No — aadhi mounts it; your pages render inside), `api.schedule.*` / `api.dose.*`, `dose_actions` audit rows. It never creates/edits any of your files.
- hp — Phases 21–23, 25: fills your dashboard stubs + `settings/caregiver` ONLY as a post-merge step on `main`; never on branches in parallel.