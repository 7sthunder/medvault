# HP — Ecosystem & Delivery Track (Phases 21–23, 25, 27–30)

> Your branch is **100% file-isolated** from `aadhi` and `bala`: no file you create or
> edit exists on their branches, and no file they create/edit exists on yours — by
> contract. Follow the TERRITORY / FROZEN / SEAMS sections below strictly. Tomorrow
> all three merge into `main` (order: aadhi → bala → hp). Phases 27–30 run on the
> **fully merged** `main` (you merge last). If everyone stayed in their territory,
> `git merge` succeeds with **zero conflicts**.

- Branch: `hp` · Base: `main` @ `3c427aa` (merged in) · Merge target: `main` (**last**)
- Phases: **21, 22, 23, 25** now · **27, 28, 29, 30** post-merge on `main`

---

## 1. YOUR TERRITORY (only you create/edit these)

| Kind | Paths |
|---|---|
| Router registration | `src/server/trpc/routers/hp.ts` — **the only file you register routers in** |
| tRPC routers | `src/server/trpc/routers/{caregiver,notifications,insights,demo}.ts` |
| Domain | `src/server/domain/caregiver/`, `notifications/`, `insights/`, `demo/` |
| Auth context (yours, Phase 25) | `src/server/trpc/context.ts` — the ONLY shared file you own; nobody else edits it |
| App routes | `src/app/(app)/notifications/`, `(app)/insights/`, `(app)/caregiver/` (+ `caregiver/accept`, `caregiver/alerts/[id]`), `src/app/demo/` — **new** dirs only |
| Features | `src/features/caregiver/`, `src/features/notifications/`, `src/features/insights/`, `src/features/demo/` |
| Bell (yours) | `src/components/layout/NotificationBell.tsx` — frozen stub on `main`; you re-implement it live in Phase 22 as a post-merge edit on `main` (aadhi never edits it) |
| E2E | `e2e/{register,onboarding,caregiver,notifications,insights,demo,missed-dose,dose-actions,auth-guard,medication-lifecycle,adherence-consistency}.spec.ts` + `e2e/helpers/{demo-login,seed}.ts` — all new files |
| This plan | `hp.md` (your work log lives here, not in `impl.md`) |

## 2. FROZEN — shared files you MUST NOT edit

- `src/server/trpc/root.ts` — composition only; registers `...hpRouters` via your `hp.ts` record.
- `src/lib/trpc.tsx` — use `api`/`TRPCProvider`, never edit.
- `src/server/domain/doseEvents/attachments.ts` — missed-dose registry. You **register** handlers into it; you never edit the file. (aadhi calls it; you call `registerMissedDoseHandlers`.)
- `src/shared/nav.ts`, `enums.ts`, `types.ts`, `times.ts`, `status.ts`, `brand.ts`, `constants.ts`, `validations/*` — all your enums/DTOs/schemas are already here (caregiver, notification types, insight categories, demo scenarios, `DEMO_SCENARIOS`). Consume, don't modify. Use the existing `@shared/times` `now()/setNowImpl()` seam — don't touch `times.ts`.
- `src/server/db/schema.ts`, `src/server/db/*` — schema done; **no schema changes**.
- `src/server/domain/doseEvents/`, `doseActions/`, `src/server/domain/doseEvents/` (aadhi's): read their output (audit, `reconcile`) read-only, drive via the `attachments.ts` registration — never import service internals from aadhi files.
- `src/server/trpc/context.ts` — read-only for you until **Phase 25** (then it's yours).
- `src/components/ui/**`, `src/components/brand/**`, `src/components/layout/*` (except `NotificationBell`), `src/app/(app)/layout.tsx`, `src/features/{auth,landing}`, `src/lib/*`, `package.json`, `pnpm-lock.yaml`, `impl.md`, `jobs/`, existing `e2e/*.spec.ts`.
- **No new dependencies on this branch** — `package.json`/lockfile frozen. AI provider = server-side `fetch` to the Gemini API (env `AI_GEMINI_API_KEY`); no new SDK. If you truly need a dep, note it in `hp.md` and add it at merge time.

## 3. SEAMS & integration by contract (no shared-file edits)

- **Register routers:** build `caregiverRouter`, then in `routers/hp.ts`:
  `import { caregiverRouter } …; export const hpRouters = { caregiver: caregiverRouter, … }`. No `root.ts` edits.
- **Attach notifications + caregiver alerts to aadhi's auto-miss:** in your OWN bootstrap module under `src/server/domain/notifications/` (or `caregiver/`) call `registerMissedDoseHandlers(…)` from the frozen `attachments.ts`. Because your `routers/hp.ts` imports that bootstrap, registration happens at module load. You never edit aadhi's `reconcile.ts`.
- **Scheduler rule:** `jobs/scheduler.ts` is aadhi's. Your due-reminder/demo producers run via **on-read catchUp + your own registration**, never edits to `jobs/`.
- **Insight snapshot:** build it from `api.adherence.*` DTOs (bala's) by contract — call, don't import bala's internals.
- **Fill bala's stubs on `main` (post-merge, never in parallel):** after bala merges, replace the bodies of `src/features/dashboard/InsightWidget.tsx`, `CaregiverStatus.tsx`, and `src/app/(app)/settings/caregiver/page.tsx` with live data. Those files are neutral placeholders so you and bala never edit the same file on branches.
- **Bell (Phase 22):** re-implement `src/components/layout/NotificationBell.tsx` on `main` after aadhi merges — aadhi only imports the frozen stub and never edits it.

## 4. Phase objectives (detail in `plan.md` §21)

- **21 Caregiver:** `domain/caregiver/service.ts` (invite/accept/revoke/permissions/alerts, **once-per-dose-relationship dedupe**), **separate patient-scope vs caregiver-scope routers** + `requireCaregiverAccess(patientId)`, `features/caregiver/*`. Strongest authz boundary; read-only enforcement server-side.
- **22 Notifications:** `domain/notifications/service.ts` (+ `channels.ts` in-app/console), `routers/notifications.ts`, `features/notifications/*`, real bell. Producers: missed (via `attachments.ts`), insight ready, caregiver alert, due reminder (on-read). **No scattered `INSERT notifications` in features.**
- **23 AI insights:** `domain/insights/service.ts` (snapshot → AI → zod-validate → fallback → persist/prune), `routers/insights.ts`, `features/insights/*`; never-mutate boundary; server-side only.
- **25 Demo mode:** `domain/demo/service.ts`, `routers/demo.ts`, `src/app/demo/` layout + dock, `features/demo/*`; demo cookie in `context.ts` (yours); uses `seedDemoWorkspace` + `demo_state`. Isolation test: real account data unchanged after demo.
- **27 Tests / 28 E2E / 29 Integration / 30 Deploy:** on `main` after merges. 28 includes `adherence-consistency.spec` (validates §20 propagation). 29 writes `docs/consistency-verification.md`. 30 updates `README.md` runbook.

## 5. Verify before you commit

- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` — all green on your branch.
- Unit/component tests for routers/services/features (jsdom, RTL). Your e2e specs (incl. caregiver loop, demo tour) depend on aadhi's shell + bala's pages — they render correctly only on merged `main`; keep them committed, run them as part of Phase 28 **post-merge**.
- Phase 25 `context.ts` edit is a single branch-time edit — keep it additive (demo cookie) and owner-scoped so merging it never touches aadhi/bala diffs.
- Keep your work log in `hp.md`. Do not touch `impl.md`.

## 6. What you can assume about aadhi/bala

- aadhi — Phases 09–15: `(app)` shell + `TRPCProvider`, `api.schedule.*`/`api.dose.*`, missed-dose hook calls the frozen registry (you register). Never creates/edits your files.
- bala — Phases 16–20, 24, 26: `api.adherence.*`/`api.dashboard.*` DTOs (your insight snapshot source), dashboard stubs + `settings/caregiver` placeholder left for you to fill on `main`. Never creates/edits your files.