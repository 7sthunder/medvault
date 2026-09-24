# MedVault (MediTrack AI) — Implemented Work Log

> Companion to `plan.md`. This file records, phase by phase, **what was actually implemented**
> with respect to the plan: deviations, precise decisions, verification results, and the commit
> that delivered the phase.
>
> - `plan.md` is the **spec** (what to build). `docs/stitch-analysis.md` is the **Phase 01
>   evidence** (where the design facts came from).
> - `impl.md` is the **log** (what was built and why it matches — or deliberately sharpens — the plan).
> - Update this file at the end of **every** phase (before pushing). Keep statuses in the matrix
>   below consistent with the detailed sections.

## Status conventions

- `pending` — not started
- `in_progress` — actively being worked right now (only one at a time)
- `done` — implemented, verified, committed, and pushed
- `blocked` — waiting on a prerequisite / open decision (blocker logged in the detail section)

### New-phase logging checklist (append a section for the phase, then flip the matrix row)

1. Reference the exact plan sections (§) and phase objective.
2. List files created/modified with paths.
3. Record deviations vs. plan and the reason (precise > faithful).
4. Record verification: the exact commands that passed (typecheck/lint/test) and any manual checks.
5. Record the commit hash and push state.
6. Flag anything the next phase depends on that was discovered late.

---

## Phase status matrix

| Phase | Title | Status | Commit | Notes |
|---|---|---|---|---|
| 01 | Repository & Stitch analysis | `done` | `5dfeb44` | pushed to `origin/main` |
| 02 | Project foundation (Next.js + TS + Tailwind + tooling) | `done` | `6eabea5` | verified: typecheck/lint/test/build/e2e |
| 03 | Design system implementation (Stitch tokens → Tailwind theme + primitives) | `done` | `1721431` | verified: typecheck/lint/test/build/e2e |
| 04 | Landing page migration (`/` from Stitch) | `pending` | — | |
| 05 | Database foundation (Drizzle schema + client + migrate + seed) | `pending` | — | |
| 06 | Authentication & session plumbing (Better Auth) | `pending` | — | |
| 07 | Shared contracts & validation layer | `pending` | — | |
| 08 | Reusable component system completion | `pending` | — | |
| 09 | Global shell & navigation `(app)` | `pending` | — | |
| 10 | Onboarding | `pending` | — | |
| 11 | Medication domain service (server) | `pending` | — | |
| 12 | Medication schedule & dose-event generation (domain) | `pending` | — | |
| 13 | Dose state machine + reconcile (missed detection) (domain) | `pending` | — | |
| 14 | Today's Schedule page + dose UI | `pending` | — | |
| 15 | Medication CRUD UI (list / detail / new / edit) | `pending` | — | |
| 16 | Adherence engine (domain + aggregation service) | `pending` | — | |
| 17 | Adherence UI + medication performance | `pending` | — | |
| 18 | Dashboard | `pending` | — | |
| 19 | History | `pending` | — | |
| 20 | Reports | `pending` | — | |
| 21 | Caregiver system (domain + flows + UI) | `pending` | — | |
| 22 | Notifications (domain + bell + center + preferences) | `pending` | — | |
| 23 | AI insights (domain + service + UI) | `pending` | — | |
| 24 | Settings (profile/reminders/caregiver/appearance/data) | `pending` | — | |
| 25 | Demo mode (domain + seed reuse + UX) | `pending` | — | |
| 26 | Global states, accessibility & responsive refinement | `pending` | — | |
| 27 | Unit & component test completion | `pending` | — | |
| 28 | End-to-end test suite | `pending` | — | |
| 29 | Integration verification & final consistency pass | `pending` | — | |
| 30 | Deployment & handoff polish (optional but recommended) | `pending` | — | |

---

## Phase 01 — Repository & Stitch analysis (DONE)

**Plan reference:** `plan.md` §2, §5, §6, §16; Phase 01 spec (`plan.md:819`).
**Objective met:** verified inventory of the Stitch export, design tokens extracted into §5,
screen→route map confirmed (§6). No `Landingpage/` changes (per Phase 01 constraint).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `docs/stitch-analysis.md` | created | Phase 01 deliverable — 12 sections (method → open decisions) |
| `docs/` | created | new analysis directory |
| `plan.md` §2 | rewritten | two commits, corrected root paths, verified file roles, duplicate/unreferenced assets, ignored dirs, `App.jsx` section line-map |
| `plan.md` §5.2 | edited | H2 now documents the two verified size tiers instead of one clamp value |
| `plan.md` §5.8 | added | "Source verification" — findings that don't fit the token tables |
| `plan.md` §6 | rewritten | route table now carries source-anchor column; non-goal motifs mapped to no route |

### Key verified facts that shaped the plan text

- `MedVaultAuthIllustration.jsx` and `MedVaultPhoneSection.jsx` live at `Landingpage/` **root**,
  not `src/` — §2 previously implied `src/`. Fixed.
- `MedVaultPhoneSection.jsx` and `src/components/FloatingCard.jsx` are imported by **nothing**
  (recipe/reference-only) — recorded so Phase 04 knows they are ported-by-knolwedge, not by import.
- MD5-confirmed duplicates: `Gemini_Generated_Image_jr77vyjr77vyjr77.png` ==
  `public/images/hero-final.png`; root `imagessss/` mirrors `public/imagessss/`.
- §5 tokens `--color-red-tint #fee2e2` and `--color-amber-tint #fef3c7` (needed for §12 status
  chips) are **NOT in the Stitch source** — flagged explicitly in §5.8 so no future phase asserts
  false provenance; the §3/§5 token test must special-case them.
- Glass radius has no single source value (16 / 18 / 22 px). Decision recorded: adopt **18 px**
  (`--radius-glass`), matching the phone motifs. This is a deliberate precision-vs-Stitch choice.
- Hero gradient exact string `linear-gradient(150deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)`
  pinned at `App.jsx:755`.
- Deviation (minor): plan target of "one H2 clamp" sharpened to two scale tiers +
  white CTA variant — matches source exactly instead of the plan's approximation.

### Verification

- Token extraction cross-checked against source bytes (hex/rgba/gradients/font families) —
  full tables with `file:line` anchors in `docs/stitch-analysis.md` §7.
- Asset reference vs existence verified via runtime usage grep + MD5 of duplicates.
- No build/test to run (Phase 01 is analysis only — no code produced).

### Commit / push

- `5dfeb44` `Finalize Phase 01: Stitch analysis and verified plan §2/§5/§6`
- pushed: `7d8e76e..5dfeb44 main -> main`; `git status` clean.

### Hand-off notes for later phases

- Phase 04 must consume port list `docs/stitch-analysis.md` §10 (exact `→ target` paths).
- Phase 03 token test should pull expectations from `docs/stitch-analysis.md` §7 tables and
  special-case the two extended tokens noted above.
- Open decisions for Phase 03/04 are tracked in `docs/stitch-analysis.md` §12.
- `Landingpage/` must stay untouched and un-referenced at runtime (plan §1).

---

## Phase 02 — Project foundation (DONE)

**Plan reference:** `plan.md` §4.1, §16 (breakpoints), §18 (testing); Phase 02 spec (`plan.md:839`).
**Objective met:** working Next.js App Router app at repo root with pnpm, strict TS, Tailwind v4,
shadcn/ui scaffold, ESLint/Prettier, Vitest, Playwright, drizzle config, env scaffolding.

### Files created

| Path | Purpose |
|---|---|
| `package.json` (`meditrack-ai`) | scripts: `dev/build/start/typecheck/lint/lint:fix/format/format:check/test/test:watch/test:coverage/test:e2e/db:generate/db:migrate/db:push/db:seed` |
| `pnpm-lock.yaml` | lockfile |
| `pnpm-workspace.yaml` | `allowBuilds` (esbuild, unrs-resolver) |
| `next.config.ts` | `reactStrictMode: true` |
| `tsconfig.json` | strict + `noUncheckedIndexedAccess`, bundler resolution, path maps `@/* @shared/* @server/* @features/* @components/* @lib/* @db/*` |
| `next-env.d.ts` | Next generated-types reference |
| `eslint.config.mjs` | FlatCompat → `next/core-web-vitals` + `next/typescript`, ignores `Landingpage/**` |
| `postcss.config.mjs` | `@tailwindcss/postcss` |
| `drizzle.config.ts` | postgresql dialect, schema `src/server/db/schema.ts`, out `./drizzle` |
| `vitest.config.ts` | jsdom per-file via pragma, aliases, oxc JSX runtime, coverage on `src/shared/calc` |
| `vitest.setup.ts` | `@testing-library/jest-dom/vitest` |
| `playwright.config.ts` | chromium project, `testDir ./e2e`, `webServer pnpm dev :3000` |
| `.env.example` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AI_GEMINI_API_KEY`, `DEMO_CLOCK_OFFSET_MINUTES` |
| `.gitignore` | `node_modules .next out build .env* e2e-report playwright-report test-results coverage` |
| `.prettierrc.json` | 100-print-width, semicolons, double quotes |
| `components.json` | shadcn v4 "base-nova" style, RSC, `css: src/app/globals.css`, lucide icons |
| `src/app/layout.tsx` | **Plus Jakarta Sans** via `next/font/google` (`--font-jakarta`), metadata (MedVault · MediTrack AI) |
| `src/app/globals.css` | Tailwind v4 + shadcn neutral theme tokens + `@import "shadcn/tailwind.css"` + `tw-animate-css` + font mapping + `.dark` block |
| `src/app/page.tsx` | placeholder `/` (brand tile §5.1 + Button); replaced by landing in Phase 04 |
| `src/lib/utils.ts` | `export { cn } from "cn"` (shadcn v4) |
| `src/shared/breakpoints.ts` | breakpoint constants doc (plan §16) incl. Stitch-specific 900/820/580 |
| `src/components/ui/button.tsx` | shadcn scaffold (Base UI Button, cva variants default/outline/secondary/ghost/destructive/link, sizes) |
| `src/components/ui/input.tsx` | shadcn scaffold |
| `src/components/ui/button.test.tsx` | example component test (jsdom) |
| `e2e/home.spec.ts` | example e2e hitting `/` (heading MedVault + "Get started" button) |

### Pinned versions (deliberate, deviations from plan wording)

| Package | Version | Why |
|---|---|---|
| `next` | 15.5.26 | plan: Next 15; latest 15.x |
| `react` / `react-dom` | 19.2.0 | plan: React 19; 19.3.0 not supported by Next 15 peer range |
| `lucide-react` | 0.453.0 | plan + Stitch export parity (latest is 1.x — incompatible icon API) |
| `typescript` | 5.9.3 | 7.x (native tsgo) not supported by eslint-config-next Next 15 |
| `eslint` | 9.39.5 | 10.x outside eslint-config-next 15 peer range |
| `tailwindcss` / `@tailwindcss/postcss` | 4.3.3 | Tailwind v4 (Stack §4) |
| `vitest` | 5.0.1 | — |
| `@playwright/test` | 1.63.0 | — |
| `drizzle-kit` | 0.31.11 | — |
| shadcn stack (via CLI) | `shadcn@4.21.0`, `@base-ui/react`, `cva`, `cn`, `tw-animate-css` | new shadcn v4 |

### Deviations & decisions (precise > faithful)

- **shadcn v4 uses Base UI (`@base-ui/react`) instead of Radix** for primitives. Plan §4/§18
  pre-supposed "Radix primitives"; the 2026 shadcn registry ("base-nova" style) generates Base UI
  components. Behavior/a11y intent is unchanged — Phase 03 restyles visuals to Stitch tokens.
  Recorded so Phase 03/08 lists are checked against what the registry actually emits.
- `cn` util: plan asked for clsx+tailwind-merge in `src/lib/utils.ts`. shadcn v4 instead ships a
  `cn` package; `src/lib/utils.ts` re-exports it so `@/lib/utils` stays the import surface.
- **shadcn CLI misfires caught and reverted:**
  1. `init` globbed the Vite template CSS and wrote the theme into `Landingpage/src/index.css`
     (violating Phase 01's untouched rule) — reverted via `git checkout`, theme relocated to
     `src/app/globals.css`, `components.json` css path fixed to `src/app/globals.css`.
  2. `init` injected a `Geist` font + rewrote the root layout — reverted; layout keeps
     **Plus Jakarta Sans** only (plan requirement). `--font-sans` maps to `--font-jakarta`.
- Status bar: `pnpm dev`/builds on Windows show a benign vitest "configLoader native" ESM-in-CJS
  warning — cosmetic, suppressed by nothing; leave as-is (or rename to `.mjs` later).
- pnpm 11.8: build-script approval now lives in `pnpm-workspace.yaml` under **`allowBuilds`**
  (legacy `onlyBuiltDependencies` in package.json is ignored) — required to run esbuild postinstall.
- Vitest 5 uses the **oxc** transform (Vite 8): `vitest.config.ts` sets
  `oxc.jsx = { runtime: "automatic" }` (tsconfig `jsx: preserve` otherwise breaks test parsing).

### Verification (all green)

- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors/0 warnings after naming the postcss config export)
- `pnpm test` — 1 file, 2 tests passed (jsdom RTL on Button scaffold)
- `pnpm build` — `next build` compiled, types/lint pass, 4 static pages generated
- `pnpm test:e2e` — 1 chromium test passed (dev-server smoke via Playwright webServer)

### Commit / push

- `6eabea5` `Phase 02: Next.js + TS + Tailwind + tooling foundation`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for Phase 03

- Phase 03 replaces the neutral shadcn tokens in `src/app/globals.css` with the **Stitch
  `@theme`** tokens — source tables in `docs/stitch-analysis.md` §7; two extended tokens caveat
  (`#fee2e2`/`#fef3c7`) from Phase 01 stands.
- The `/design-system` dev page (plan Phase 03) will mount under `src/app/(marketing)/` — that
  route group does not exist yet.
- Base UI components differ from the Radix-era shadcn docs; check `@base-ui/react` API when
  restyling `button.tsx`/`input.tsx` and when adding primitives in Phase 08.
- `components.json` `css` and `aliases` point at the real locations now; keep them in sync when repo structure changes.

---

## Phase 03 — Design system implementation (Stitch tokens → Tailwind theme + primitives)

**Plan reference:** `plan.md` §5, §12, §5.5 (input/button recipes), §1/§2 (medication card +
list-row stories); Phase 03 spec (`plan.md:859`). Token facts: `docs/stitch-analysis.md` §7.
**Objective met:** every §5.3/§5.4 colour/shadow is a declared Tailwind v4 token in
`src/app/globals.css` (machine-checked by `src/lib/token-doc.test.ts`); brand assets, the full
`ui/` catalog, custom primitives, and a dev-only `/design-system` catalogue with the two Stitch
stories (medication card stack + list rows) are in place. Features are lint-forbidden from
hardcoding brand hex.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/app/globals.css` | rewritten | static `@theme` (Stitch palette §5.3 + shadows §5.4 + radius 0.875rem), `@theme inline` semantic surfaces flipping in `.dark` (§5.7), glass utilities, hero-gradient var, scrollbar/selection/focus-visible base |
| `src/lib/token-doc.ts` | created | machine-readable §5 map (colour + shadow tokens, `provenance: stitch/extended`, radius/gradient constants) |
| `src/lib/token-doc.test.ts` | created | asserts globals.css carries exactly the token `cssVar:value` pairs (§3/§5 drift check), extended-token caveat, light+dark surface overrides, label uniqueness |
| `src/shared/status.ts` | created | §12 DoseStatus union + `DOSE_STATUS_META` (label/tone/aria/icon/tint-classes/raw hex) |
| `src/shared/brand.ts` | created | §5.1 brand constants (`BRAND`, `LOGO`, AI brand) |
| `src/components/brand/{Logo,Wordmark,Brand}.tsx` | created | §5.1 tile (36–44px radius 10–12 gradient + leaf shadow), wordmark (Med+Vault), lockup + `AiBrandLockup` |
| `src/components/ui/status-{indicator,badge}.tsx` | created | §12 compact + pill chips, never colour-only (icon + text + aria-label, ping ring for due-now) |
| `src/components/ui/{chip,section-label,stat-card,list-row,empty-state,error-state,form-field,time-picker,date-picker}.tsx` | created | §5.5/§2 custom primitives |
| `src/components/ui/{drawer,confirmation-dialog}.tsx` | created | bottom-sheet (Base UI Drawer) + confirm dialog wrappers |
| `src/components/ui/button.tsx` | modified | §5.5 restyle: default adds `shadow-primary-btn` + `hover:bg-primary-dark`; **secondary variant now neutral white+border** (see deviation) |
| `src/components/ui/input.tsx` | modified | §5.5 restyle: h-9, stronger border `border-strong`, 4px `primary-ring` focus, white bg |
| `src/app/page.tsx` | modified | placeholder now uses `Brand` lockup + tokens (per Phase 03 spec) |
| `src/app/(marketing)/design-system/page.tsx` | created | dev-only catalogue: tokens, type §5.2, buttons, forms, §12 status grid, med-card/list-row stories, overlays, feedback |
| `eslint.config.mjs` | modified | `src/features/**` hex/rgba literal ban + `next-env.d.ts` triple-slash exemption |
| `vitest.setup.ts` | modified | added RTL `cleanup()` `afterEach` (tests share a jsdom document otherwise) |
| `src/components/ui/primitives.test.tsx`, `status-indicator.test.tsx` | created | primitive smoke + §12 a11y tests (36 total) |
| `e2e/design-system.spec.ts` | created | dev-server checks: Stitch stories + 8 status chips + token swatch presence |

20-registry-primitive batch (textarea/select/checkbox/radio-group/switch/label/badge/card/separator/
avatar/tooltip/dialog/dropdown-menu/popover/tabs/sonner/alert/skeleton/pagination) came from
`pnpm dlx shadcn@latest add ...` and adds `@base-ui/react@^1.8` + `sonner@^2.0.8`.

### Deviations & decisions (precise > faithful)

- **`--color-secondary` name collision (plan decides):** the Stitch token is `#06b6d4` and keeps the
  `secondary` name (Stitch's "secondary" *is* cyan). shadcn's *semantic* secondary (grey) is
  repurposed: Button's `secondary` variant now renders white bg + border + ink text (§5.5
  "secondary/neutral" button). Cyan surfaces stay reachable via `bg-secondary`.
- **Status chips:** `paused` uses `bg-border` (#e2e8f0) and `canceled` an outline chip
  (`bg-background` + border + ink-400) instead of solid `#f8fafc` — solid near-white on a white card
  reads as "no chip". `due-now` keeps Stitch's pulsing primary ring.
- **Violet has no tint in Stitch** (§7.1 verified). Violet chips use default-palette
  `violet-100`/`violet-600`; chip *text* uses contrast-adjusted default shades
  (cyan-800/pink-600/blue-600/amber-600) because the §12 tint+full-colour pairing fails AA on small
  text — Stitch's own chips used the darker shades.
- **Semantic surfaces:** dark-aware tokens (background/foreground/card/popover/muted/accent/border/
  input/sidebar) are `@theme inline` + `:root`/`.dark`; brand palette stays a static `@theme` so
  `bg-primary`/`text-ink-600`/`shadow-card` emit as utilities AND CSS vars (the token test reads the
  emitted vars).
- **Focus tokens:** §5.3 focus mask kept as `primary-ring` (`rgba(16,185,129,0.12)`), distinct from
  the `ring` focus-visible outline colour `#10b981`.
- **Drawer:** `@base-ui/react@1.8` ships a native `drawer` (bottom-sheet, swipe, snap, trap-focus);
  wrapped instead of hand-rolling a sheet.
- **`/design-system` gating:** rendered only when `NODE_ENV === "development"`, else
  `redirect("/")` at module top — satisfies "dev-only"; production build verified static.
- **ESLint hex ban** targets `src/features/**` (not created yet) — documented now so Phase 07+
  features are token-clean from day one (DoD Phase 03 #4).
- `next-env.d.ts` triple-slash path reference (typed routes) trips `@typescript-eslint/
  triple-slash-reference`; Next regenerates the file — exempted via override.

### Verification (all green)

- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — 4 files, **36 tests passed** (token-doc 8, status/§12 18, primitives 8, button 2)
- `pnpm build` — compiled; `/`, `/_not-found`, `/design-system` all static (3 routes)
- `pnpm test:e2e` — 3 chromium tests passed (home smoke + design-system stories + token swatches)

### Commit / push

- `1721431` `Phase 03: Stitch token system + design-system catalogue + primitives`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Phase 04 consumes `docs/stitch-analysis.md` §10 port list; `(marketing)` currently only carries
  `/design-system`, Phase 04 adds `(marketing)/layout.tsx` + the landing `/`.
- Phase 05+ must render through the token set — the `src/features/**` hex lint gate is active.
- Dark theme flips surfaces only (§5.7); status chips/glass stay light-first — per plan dark polish
  lands with Phase 26 (`appearance` toggling); `@custom-variant dark` is already wired.
- Component tests depend on RTL `cleanup()` now in `vitest.setup.ts` — keep it for Phase 27 suites.