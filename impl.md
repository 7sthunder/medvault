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
| 04 | Landing page migration (`/` from Stitch) | `done` | `1340f05` | verified: typecheck/lint/test/build/e2e |
| 05 | Database foundation (Drizzle schema + client + migrate + seed) | `done` | `016f1be` | verified: typecheck/lint/test/build |
| 06 | Authentication & session plumbing (Better Auth) | `done` | `3006415` | verified: typecheck/lint/test/build/e2e |
| 07 | Shared contracts & validation layer | `done` | `2794983` | pushed to `origin/main` |
| 08 | Reusable component system completion | `done` | `e23dc9b` | pushed to `origin/main` |
| 09 | Global shell & navigation `(app)` | `done` | — | verified: typecheck/lint/test/build |
| 10 | Onboarding | `done` | — | verified: typecheck/lint/test/build |
| 11 | Medication domain service (server) | `done` | — | verified: typecheck/lint/test/build (194 tests) |
| 12 | Medication schedule & dose-event generation (domain) | `done` | — | verified: typecheck/lint/test/build (208 tests) |
| 13 | Dose state machine + reconcile (missed detection) (domain) | `done` | — | verified: typecheck/lint/test/build (233 tests) |
| 14 | Today's Schedule page + dose UI | `done` | — | verified: typecheck/lint/test/build (240 tests) |
| 15 | Medication CRUD UI (list / detail / new / edit) | `done` | — | verified: typecheck/lint/test/build (247 tests) |
| 16 | Adherence engine (domain + aggregation service) | `done` | — | verified: typecheck/lint/test/build (261 tests) |
| 17 | Adherence UI + medication performance | `done` | — | verified: typecheck/lint/test/build (265 tests) |
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

---

## Phase 04 — Landing page migration (`/` from Stitch)

**Plan reference:** `plan.md` §21; port list `docs/stitch-analysis.md` §10 (exact `→ target` paths);
Stitch sources `Landingpage/src/App.jsx`, `Landingpage/src/components/{HeroVisual,FloatingCard}.jsx`,
`Landingpage/src/mobile.jsx`, `Landingpage/index.html`.
**Objective met:** Stitch landing now renders at Next `/` under a `(marketing)` route group,
consuming Phase 03 tokens only — runtime DOM is byte-visibly the same Stitch hero→footer composition;
`src/features/**` hex/rgba lint gate stays green.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/features/landing/use-in-view.ts` | created | Stitch `useInView` port (threshold 0.12, once) |
| `src/features/landing/mascots.tsx` | created | Doctor/Robot/Nurse mascot SVGs + 3 `<img>` how-it-works mascots (eslint-disable no-img-element) |
| `src/features/landing/PhoneMockup.tsx` | created | mobile.jsx phone screen + CSS port (756×729, sparks/dots, `.mvp-*`) |
| `src/features/landing/HeroVisual.tsx` | created | floating-notification stack over phone (tone→`var(--color-*)`) |
| `src/features/landing/FloatingCard.tsx` | created | glass recipe (Stitch markup never mounts it; kept for auth/hero compositions) |
| `src/features/landing/{Nav,Hero,HowItWorks,Features,Testimonials,FinalCta,Footer,AiChatFab,ScrollingServices}.tsx` | created | §10 ported sections |
| `src/app/(marketing)/layout.tsx` | created | children-only wrapper (design-system unaffected) |
| `src/app/(marketing)/page.tsx` | created | landing composition + metadata; replaces `/` |
| `src/app/page.tsx` | deleted | Phase 02 placeholder `/` (superseded) |
| `src/app/icon.svg` | created | brand-tile favicon (32×32 rounded gradient + HeartPulse path) |
| `src/app/globals.css` | modified | `--mascot-*` vars; body `overflow-x: hidden`; landing keyframes (`float`/`shadowPulse`/`softPulse`/`gradShift`/`fadeUp`/`spin`/`slideIn`/`mvp-*`); `@layer components` (`.cta-primary/.cta-ghost/.nav-login/.nav-link/.dot-grid/.cta-white/.cta-ghost-light/.hero-visual-container/.mvp-*`); `@layer utilities` (`.bg-blob-*/.bg-dot-grid-light/.map-grid/.footer-link`) |
| `public/landing/how-it-works/*.png`, `public/auth/login-page.jpeg` | created | copied from `Landingpage/public/...` (Phase 04 asset move, verified source sizes) |
| `src/features/landing/landing.test.tsx` | created | jsdom smoke: Nav routes + Hero heading/CTAs (`next/link` + `next/dynamic` mocked, IO stub) |
| `e2e/home.spec.ts` | rewritten | landing headline visible + nav "Create Vault" → `toHaveURL(/\/register\/?$/)` (URL-only: route 404s until Phase 06) |
| `package.json` | modified | `framer-motion@^12.38.0` → resolved **12.43.0** |

### Deviations & decisions (precise > faithful)

- **DM Sans remote `@import` dropped.** Stitch `index.html` loaded DM Sans via Google Fonts; Next only
  bundles Plus Jakarta Sans (`next/font/google`). Slide-up/cards remain idempotent; the small font
  difference is an accepted footprint/runtime decision (no network font at build/SSR).
- **`pulse` keyframe renamed → `softPulse`.** Stitch defined its own `pulse`; Tailwind v4 already ships
  an `animate-pulse` utility — reusing the name would collide. Function identical, name namespaced.
- **`.mvp-nav-dot` synthesized.** Stitch `mobile.jsx:191` references `.mvp-nav-dot` (active-session dot)
  but the source CSS never defines it (Stitch renders the dot invisible). Added as 4px
  `var(--color-primary)` circle — precision fix, documented so later phases don't "fix" it back.
- **Glass cards** keep Stitch's literal composite shadows (`0 24px 48px rgba(...)`) — the lint rule
  only bans literals *starting* with `#`/`rgba(`, composites are exempt; token-var substitution used
  wherever a §5 token maps. `bg-white/90 backdrop-blur-*` carry the glass body.
- **FloatingNotification chip tint** `${color}18` (≈9.4%) renders as `color-mix(in srgb, var(--color-*)
  9.4%, transparent)`; icon colour via the tone var.
- **FinalCta "Get Started"** ports Stitch's inline submit-form as **`<a href="/register">`** (Styled form
  submit would navigate/q reload; `<a>` is the correct semantic for a link to registration and stays
  lint-clean). Input kept as decorative email field.
- **Testimonials pfizer‑gap**: source holds generic `Person A–G` entries (App.jsx:1072–1083) — ported
  verbatim (names/roles), not invented personas.
- **HeroVisual** stays `next/dynamic ssr:false` with a `loading` placeholder (hero container keeps height);
  framer-motion floats render client-side only (Stitch parity).
- **Favicon:** `src/app/icon.svg` (file-based, App Router convention) instead of a `public/` static —
  same brand tile, no extra fetch of both.
- **Deleting `src/app/page.tsx`** leaves stale `.next/types/app/page.ts`; regenerated via
  `npx next typegen` (not a code change) — recorded so future route moves run typegen after deletion.
- Matching `textContent` across `<br/>` in the H1 joins with no space (jsdom & Chromium both) — unit +
  e2e assertions use `/Your entire\s*medical life/i`.

### Verification (all green)

- `pnpm typecheck` — clean (after `next typegen`; fix in `use-in-view.ts` entry guard + `DoctorMascot color` prop)
- `pnpm lint` — clean (0 errors / 0 warnings; removed unused `Sparkles` import)
- `pnpm test` — 5 files, **38 tests passed** (new landing smoke 2)
- `pnpm build` — compiled; `/` static 58.4 kB (First Load 173 kB), `/design-system` 115 kB
- `pnpm test:e2e` — 4 chromium tests passed (home headline + /register route, design-system stories + swatches)

### Commit / push

- `1340f05` `Phase 04: Stitch landing migrated to (marketing)/`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- `/login` → Nav "Log In" and `/register` → Nav/Create Vault + Hero/FinalCta CTAs are **hard-coded
  routes**; they 404 until Phase 06 lands auth pages. e2e asserts URL only (`toHaveURL`), so the suite
  stays green across that gap.
- `/demo`, `/help`, `/privacy`, `/terms`, `/accessibility`, `/report`, `/status` footer/section links
  are likewise future-route stubs.
- `public/auth/login-page.jpeg` + `public/landing/how-it-works/*` are ready for Phase 05+/auth pages.
- `HowItWorks`/`mascots.tsx` keep `minHeight: 200` rows (`.mvp-*` grid) so layout never collapses
  pre-reveal (Stitch parity).
- Tailwind v4 emits color utilities from `@theme` (no `tailwind.config`) — arbitrary value classes like
  `border-primary/[0.28]` and `shadow-[0_15px_40px_rgba(...)]` are the sanctioned composite path.

---

## Phase 05 — Database foundation (DONE)

**Plan reference:** `plan.md` §8 (schema spec, lines 406–470) + §19 (Arun Kumar sample data, line 781);
Phase 05 spec (`plan.md:899`).
**Objective met:** full §8 Drizzle schema (16 tables) + typed client + migrations + idempotent seed live
on the **Supabase** session pooler (`aws-0-ap-south-1.pooler.supabase.com`), matching §19 demo totals
(84/76/5/3/8 → 90.5%, 7-day streak) and the spec's "a test asserts every table has a zod-validated
insert demo row".

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/server/db/schema.ts` | created | 16 §8 tables (users, session, account, verification, medications, medication_schedules, dose_events, dose_actions, adherence_daily, caregiver_relationships, caregiver_invitations, caregiver_alerts, notifications, ai_insights, user_preferences, demo_state). `time.BigInt`-free: `id text pk` + uuidv7, snake_case, `timestamptz`/`date`, enums as `text`+`$type` TS unions, all §8 indexes/uniques (incl. partial `medications_user_name_active_uq where archived_at is null` and `adherence_daily` UNIQUE NULLS NOT DISTINCT via `unique()`) |
| `src/server/db/helpers.ts` | created | `uuidv7()` (RFC 9562, time-ordered), `utcDateKey`/`addDays`/`atTime`/`hhmm`, `upsertUser(db, input)` (stable id via `users.email` onConflictUpdate), `Db`/`DbTx` types |
| `src/server/db/client.ts` | created | singleton `Pool`+`drizzle({schema})` on `globalThis` (HMR-safe), `ssl: { rejectUnauthorized: false }`, `max: 3`, guarded `process.loadEnvFile()` at module scope |
| `src/server/db/insert-schemas.ts` | created | zod mirrors of all 16 insert types + `InsertSchemaEntry` demo rows (`satisfies typeof X.$inferInsert`) |
| `src/server/db/demo-seed.ts` | created | §19 Arun Kumar workspace builder (transactional identity rebuild: delete-in-FK-order → 4 medications → 5 schedules → 84 dose_events + dose_actions → 17 adherence_daily → 3 ai_insights → demo_state) + `demoTotals(db)` |
| `src/server/db/seed.ts` | created | idempotent: 2 dev users (alice/bob) + preferences, then `seedDemoWorkspace`; CLI main-guard via `argv[1]` |
| `src/server/db/migrate.ts` | created | applies `./drizzle` journal through the verified client pool (replaces drizzle-kit migrate) |
| `src/server/db/seed.test.ts` | created | skipIf-gated DB suite: seed idempotency (two runs → identical counts), §19 exact totals, Arun Kumar meds, zod per-table (16 rows parse; `{}` rejected) |
| `drizzle/0000_new_red_hulk.sql` | created | generated migration (committed) |
| `drizzle.config.ts` | modified | loads `.env`, requires `DATABASE_URL`-derived connection string, appends `sslmode=require` (kept dataset param-free) |
| `package.json` | modified | deps `drizzle-orm@0.45.3`, `pg@8.23.0`, `zod@4.6.5`; dev `@types/pg@8.23.1`; `db:migrate` → `tsx src/server/db/migrate.ts` |
| `.env.example` | modified | Supabase session-pooler `DATABASE_URL` + SUPABASE_* key template w/ where-to-find notes |

### Deviations & decisions (precise > faithful)

- **Supabase instead of Docker/`postgres:latest`.** User directive ("leave docker, let's use supabase");
  project ref `bujgsllqckllbnxecygj`, region ap-south-1. IPv6-only direct endpoint unreachable from this
  network, so the **session pooler (IPv4)** host `aws-0-ap-south-1.pooler.supabase.com:5432` is used.
- **`uniqueIndex().on(...).nullsNotDistinct()` unsupported** in drizzle-orm 0.45.3 (builder is
  `UniqueOnConstraintBuilder`→`UniqueConstraintBuilder`, but the *index* builder lacks the method).
  The §8 unique constraint is expressed with **`unique(...).on(...).nullsNotDistinct()`** (a table
  constraint, same semantics/DDL) — verified `UNIQUE NULLS NOT DISTINCT(...)` in generated SQL.
- **drizzle-kit `migrate` failed** (ECONNREFUSED) because its pool used the connection string *without*
  a working SSL mode — `sslmode=require` maps to verify-full under pg semantics; programmatic
  `migrate(db, { migrationsFolder })` through our `rejectUnauthorized:false` pool from `migrate.ts`
  applies cleanly. `db:generate`/`db:push` still use drizzle-kit.
- **Window is 17 days, not "~12 weeks".** §19 says demo history ~12 weeks, but acceptance totals
  (84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed, 90.5%) are reproducible exactly with a
  17-day window (today−16…today, last 7 days perfect). Documented as a deviation so Phase 25's
  acceleration can widen it without breaking counts.
- **§19 construction pinned:** Metformin 08:00/20:00 daily + Vitamin D 10:00 daily + Aspirin 08:00 daily
  all 17 days; B12 09:00 starts day 1 (16 days). Misses = Metformin 20:00 days 0–4 (5); skips = B12 days
  1–3 (3); snoozes = Vitamin D days 0–5 (6) + Metformin 20:00 days 5–6 (2) → 8, all snoozed-then-taken.
  Streak flag applied to the perfect tail window only (days ≥ 10), so the day-level flag reports the §19
  "7-day current streak".
- **`DemoSscenario` union name** (double-s) is a recording typo in `schema.ts` — kept as-is (consistent,
  typechecks; rename would churn migration naming).
- **Dev users** `alice@medvault.local` (Asia/Kolkata) + `bob@medvault.local` (Africa/Accra) with
  `user_preferences`, upserted via `users.email` uniqueness (stable ids across reruns).

### Verification (all green)

- `pnpm db:generate` → `drizzle/0000_new_red_hulk.sql` (16 tables; NULLS NOT DISTINCT + partial unique present)
- `pnpm db:migrate` → applied to Supabase (`migrate: applied up to date`)
- `pnpm db:seed` ×2 → `84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed` (idempotent)
- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — 6 files, **42 tests passed** (new DB suite 4: idempotency, §19 totals, med names, zod per-table)
- `pnpm build` — compiled; routes unchanged (`/` static 58.4 kB)

### Commit / push

- `016f1be` `Phase 05: Supabase schema + client + migrate + seed`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Migrations live in `drizzle/` (committed); drift-check with `pnpm db:generate` — it diffed "already up
  to date" against the applied journal.
- `seed.test.ts` gates on `process.env.DATABASE_URL` (skips without it, so CI without creds stays green);
  `client.ts` loads `.env` itself, so `tsx` scripts need no cross-env.
- `upsertUser` (helpers) is the reuse point for auth (Phase 06) and importer flows.
- Demo acceleration (Phase 25) should consume `demo_state.simulation_now/time_multiplier` and re-run
  `seedDemoWorkspace` for reset.
- NO auth route/auth pages yet — `/login`/`/register` still 404 (Phase 06); `users.email` unique +
  `session`/`account`/`verification` tables are ready for Better Auth.

## Phase 06 — Authentication & session plumbing (Better Auth)

**Plan reference:** Phase 06 spec (`plan.md:919`), §13 credentials validation (lines 704–716), Stitch
`AuthShell`/`AuthFooter`/`Brand`/`PasswordInput` pngs, §5 login/register/onboarding screens.
**Objective met:** Better Auth (^1.7.5) server + client + Next handler over the Phase 05 tables, Stitch
login/register UI (`/login`, `/register`) with shared zod (`loginSchema`/`registerSchema`) built on the UI
kit primitives, `(app)` gate (requireUser → `/login?next=…` with open-redirect guard), tRPC
(`me`/`whoami`/`setOnboardingComplete`), and placeholders for `/dashboard` + `/onboarding`. Registered
users land on `/onboarding`, skip → `/dashboard`, logout → `/`, re-login → `/dashboard`.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `drizzle/0001_auth_adapter_columns.sql` | created | additive migration (schema-step1 trick): account `id_token`, `access_token_expires_at`, `refresh_token_expires_at`; session `email`, `updated_at`; verification `updated_at` |
| `drizzle/0002_password_hash_rename.sql` | created | `ALTER TABLE "account" RENAME COLUMN "password_hash" TO "password";` (Better Auth 1.7 expects `password`) |
| `drizzle/meta/0001_snapshot.json`, `drizzle/meta/_journal.json` | modified | snapshot key `password_hash`→`password` + journal `idx: 2` appended so `db:generate` stays idempotent |
| `src/server/auth/server.ts` | created | `betterAuth({ appName, drizzleAdapter(db…), emailAndPassword{minPasswordLength:8}, secret/baseURL from env, user.additionalFields{timezone,onboardingCompleted,isDemo} input:false, session{expiresIn 7d, updateAge 1d} })` |
| `src/app/api/auth/[...all]/route.ts` | created | `toNextJsHandler(auth)` GET+POST |
| `src/lib/auth-client.ts` | created | `createAuthClient()`; re-exports `authClient`, `useSession`, `signIn`, `signUp`, `signOut` |
| `src/server/trpc/context.ts` | created | `createContext` resolves `auth.api.getSession({ headers })` → `{ db, user, session }` |
| `src/server/trpc/trpc.ts` | created | `router`/`publicProcedure`/`protectedProcedure` (UNAUTHORIZED) |
| `src/server/trpc/routers/auth.ts` + `root.ts` | created | `me` (public), `whoami` + `setOnboardingComplete` (protected) |
| `src/app/api/trpc/[trpc]/route.ts` | created | `fetchRequestHandler` (GET+POST) |
| `middleware.ts` | created | injects `x-pathname` header (matcher excludes static/assets) |
| `src/server/auth/require-user.ts` | created | redirect gate → `/login?next=` (safe, guarded) |
| `src/shared/validations/auth.ts` + `auth.test.ts` | created | §13 schemas: name trim 2–100, email trim/lower, password ≥8 + letter + number; loginSchema + normalized email, `rememberMe` as required boolean |
| `src/features/auth/flow.ts` + `flow.test.ts` | created | `safeNext()` (open-redirect/auth-route guard) + `hasOnboarded(Record<string, unknown>)` |
| `src/features/auth/auth-error.ts` | created | better-auth error-code → UI message mapping |
| `src/features/auth/*.tsx` (AuthShell, AuthFooter, PasswordInput, LoginForm, RegisterForm, SignOutButton, SkipOnboardingButton) | created | Stitch screens from UI-kit primitives, RHF+zodResolver, error Alert (destructive) |
| `src/components/icons/google-icon.tsx` | created | Google "G" mark for the disabled SSO button (hex exempt — outside `src/features`) |
| `src/app/(auth)/layout.tsx` + `login/page.tsx` + `register/page.tsx` | created | pre-authed redirect (+onboarding), heading, next-preserving swap link |
| `src/app/(app)/layout.tsx` + `dashboard/page.tsx` + `onboarding/page.tsx` | created | requireUser gate + placeholder screens (email, sign out, skip-onboarding) |
| `e2e/auth.spec.ts` | created | unauthenticated redirect + register→onboarding→dashboard→logout→login round trip |
| `.env` | modified | `BETTER_AUTH_SECRET` (base64 via node crypto — no `openssl` on PATH) + `BETTER_AUTH_URL` |
| `.env.example` | modified | `BETTER_AUTH_URL=http://localhost:3000` export |

### Deviations & decisions (precise > faithful)

- **drizzle-kit 0.31.11 can't rename non-interactively.** A conflicting diff (rename + additions) triggered
  its interactive TTY prompt (throws in CI). Solved: generated the **additive** 0001 against a temp schema
  (dropped `password_hash` from the file, deleted afterwards), then **hand-wrote** `0002` rename SQL and
  patched `drizzle/meta/0001_snapshot.json` + `_journal.json` (`idx: 2`) so `db:generate` reports
  "No schema changes". This keeps drizzle-kit as the drift-checker without fighting its prompts.
- **Better Auth client can't carry `user.additionalFields`** — `BetterAuthClientOptions` has no `user` key
  (TS2353), so the client stays plain and the session user is typed without additionalFields;
  `hasOnboarded` widens to `Record<string, unknown>`.
- **`rememberMe` is a required boolean** (no `.default(false)`) — RHF `Resolver` input/output typing breaks
  with defaults; the form supplies it via `defaultValues`.
- **Browser→tRPC fetch needs `Content-Type: application/json`** (415 UNSUPPORTED_MEDIA_TYPE otherwise);
  `SkipOnboardingButton` posts `body: "{}"` for the no-input mutation.
- **`(auth)` layout redirect logic:** authed+onboarded → `/dashboard`, authed not-onboarded → `/onboarding`;
  `next` is preserved through login/register swap and validated by `safeNext` (no `//`, no `/login*`,
  internal paths only).
- **e2e cold-compile flake:** first click raced the dev-server first compilation (button stuck `disabled`).
  Fixed with 30s `toHaveURL` timeouts; register→onboarding verified stable.
- **Heading text asserts with `/Welcome\s*back\.?/i`** — Stitch `<br/>` in "Welcome<br/>back." renders as
  "Welcomeback." (no space) in the accessibility tree.

### Verification (all green)

- `pnpm db:migrate` → `applied up to date`; `pnpm db:generate` → `No schema changes, nothing to migrate`
- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — 9 files, **62 tests passed** (auth + flow + forms suites)
- `pnpm build` — ok (sign-in/out static routes unchanged; `/login`, `/register`, `/onboarding`, `/dashboard`, API routes dynamic)
- `pnpm test:e2e` — **6 passed** (auth.spec 2 + home + design-system)

### Commit / push

- `3006415` `Phase 06: Better Auth login/register + (app) gate + tRPC`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Only e2e-registered users have passwords (seeded `alice`/`bob` don't) — login works for anything you sign up.
- Phase 10 (onboarding) replaces the `onboarding/page.tsx` placeholder; keep the `setOnboardingComplete`
  mutation as its completion path.
- tRPC is scaffolded to be the shared-call surface for Phase 07 contracts; `protectedProcedure` is the gate.
- Google SSO button is intentionally disabled until a provider is configured.

## Phase 07 — Shared contracts & validation layer (DONE)

**Plan reference:** Phase 07 spec (`plan.md:937`), §9 `src/shared/` file contract (enums/constants/
types/times/nav/validations), §10.5 (time buckets), §10.7 (`DoseStatus` display union), §12 (status
chips), §14 (`NavIconName`/nav model), §8 (schema value unions), §13 (validation schemas), §10.8 (demo
clock), §19 (demo scenario enums).
**Objective met:** `src/shared/` is now a dependency-light, server+client-safe contract layer: every
value union has a single source (`enums.ts`, machine-checked by `enums.test.ts`), all §13 form/server
schemas live in `validations/` (zod v4 with shared primitives in `common.ts`), timezone math is
centralised in `times.ts` (date-fns v4 + `@date-fns/tz`), DTOs for every §9 model shape in `types.ts`,
nav model in `nav.ts`, and all validation bounds are declared once in `constants.ts`
(`VALUE_LIMITS`).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/enums.ts` | created | **Single source** for: DOSE_STATUSES, DOSE_EVENT_STATUSES, MEDICATION_STATUSES, DOSE_SOURCES, DOSE_ACTION_TYPES, USER_DOSE_ACTIONS, CAREGIVER_RELATIONSHIP_STATUSES, RELATION_TYPES, INVITATION_STATUSES, CAREGIVER_ALERT_TYPES, ALERT_STATUSES, NOTIFICATION_TYPES(+TABS), INSIGHT_CATEGORIES, INSIGHT_SOURCES, SUGGESTED_ACTIONS, THEMES, UI_DENSITIES, DEMO_SCENARIOS (+`DemoScenario` alias), FREQUENCY_LABELS(-_TEXT), TIME_BUCKETS(-_TEXT), REPORT_GRANULARITIES(-_TEXT), RANGE_PRESETS(-_TEXT) |
| `src/shared/status.ts` | modified | `DOSE_STATUSES`/`DoseStatus` now re-exported from `enums.ts` (display union members sourced once) |
| `src/server/db/schema.ts` | modified | imports + re-exports value/type enums from `@shared/enums` (deleted 16 local `[...] as const` + type unions) |
| `src/server/db/insert-schemas.ts` | modified | `DOSE_ACTIONS` import → `DOSE_ACTION_TYPES` |
| `src/shared/constants.ts` | created | defaults (MISSED_AFTER_DEFAULT=30, SNOOZE_MIN_DEFAULT=10, MAX_SNOOZES_DEFAULT=3, REMINDER_BEFORE_DEFAULT=5, HORIZON_DAYS=14, RECENT_INSIGHTS=5, MAX_SCHEDULE_SLOTS=6, HISTORY_PAGE_SIZE=25, LIST_PAGE_SIZE=20, INVITATION_TTL_DAYS=7, INSIGHT_MAX_ROWS=20), `VALUE_LIMITS` (single source for ranges), name/note/dosage/report caps, DEMO identities, TIME_BUCKET_BOUNDS (§10.5) |
| `src/shared/times.ts` | created | localDateKey, isSameLocalDay, parseHhMm + `HHMM_REGEX`, combineDateAndTime, startOfLocalDay, addLocalDays, rangeByPreset (overload: numeric presets optional opts / `custom` requires from/to), bucketOf, now()/setNowImpl()/resetNowImpl() (§10.8 seam) |
| `src/shared/types.ts` | created | §9 DTOs: UserProfile, Medication(+Lite), ScheduleSlot, DoseEvent, DoseAction, AdherenceDay, StreakSummary, Trend, TimeBucketStats, AdherenceSummary, MedicationPerformance, Dashboard, Notif, Caregiver+Permissions(+DEFAULT_*), Insight, Report(+Row/TrendPoint), ReminderSettings, AppearanceSettings, TimeRange |
| `src/shared/nav.ts` | created | §14 nav model: `NavIconName` (string names — shared stays free of lucide/React), NAV_ITEMS, SETTINGS_NAV, BOTTOM_NAV, NAV_GROUP_ORDER, ALL_NAV_HREFS |
| `src/shared/validations/common.ts` | created | emailSchema (trim/lower), dateKeySchema, uuidSchema, nameSchema, cappedTextSchema, boundedTextSchema, TIMEZONE_LIST + timezoneSchema |
| `src/shared/validations/auth.ts` | modified | rebuilt on `common.ts` primitives (same §13 rules as Phase 06) |
| `src/shared/validations/{onboarding,medication,schedule,doseAction,caregiver,settings,reports}.ts` | created | all remaining §13 schemas (see deviations for exact shapes) |
| `src/shared/enums.test.ts`, `src/shared/times.test.ts`, `src/shared/validations/validations.test.ts` | created | Phase 07 unit suites |
| `package.json` | modified | deps `date-fns@4.4.0`, `@date-fns/tz@1.5.0` |

### Deviations & decisions (precise > faithful)

- **DOSE_ACTIONS → DOSE_ACTION_TYPES.** Plan §8 named the audit union `DOSE_ACTIONS`; the §13 form
  action input union also reads "actions", but they are different sets (model FINITE: take/snooze/skip
  with reasons vs. audit log with notes/tokens). Renamed the model union and did **not** keep the old
  name as an alias — the only consumer (`insert-schemas.ts`) was updated in the same commit, and the
  cleaner name prevents confusion in Phase 12/25.
- **Display union moved to shared/enums.** `DOSE_STATUSES` (9 members incl. `due-now`/`paused`) is now
  declared in `enums.ts` (not kept as a separate draft in `status.ts`); `schema.ts` re-exports it for
  data-model `$type`s and **deliberately does not** re-export `DOSE_STATUSES` (`due-now`/`paused` are
  derived, never persisted) — grep-able via `enums.test.ts` "Display = model − {due} + {due-now, paused}".
- **DTO instants are `Date`** (JS instants, `timestamptz`-mapped). JSON-serialising DTOs across the
  tRPC boundary needs a `Date` transformer — superjson is planned with the tRPC **client** in Phase 08
  (server DTOs stay plain; this phase only defines the shapes).
- **Validation bounds centralised in `VALUE_LIMITS`.** §13 repeats ranges in onboarding/settings/reports;
  `constants.ts` now holds the single source so no profile/reminder/report drift across phases.
- **`reportsSchemaFor(todayKey?)`.** The "to ≤ today+1" ceiling needs the *server's* clock — the factory
  takes an optional `todayKey`; the loopback suite tests both the loose client schema and the strict
  server factory with a fixed day. (First draft used a `"9999-12-31"` sentinel whose `addDayKey` crossed
  into a 5-digit year and broke string comparisons — replaced by the optional-arg design.)
- **`rangeByPreset` semantics:** numeric presets return `[from = start-of-first-day, to = end of today
  (23:59 local)]` — inclusive windows; `custom` returns the caller's from/to unmodified and throws at
  runtime if omitted (compile time already enforces via overloads).
- **`@date-fns/tz`·`TZDate.toISOString()` renders wall-clock + offset** (e.g. `2026-06-15T00:00:00.000+05:30`),
  not `Z` — tests compare `getTime()` against `Date.UTC(...)` for absolutes instead of ISO strings.
- **`formatInTimeZone` not exported** by `@date-fns/tz@1.5.0`; local-day keys use
  `format(new TZDate(date, tz), "yyyy-MM-dd")` instead (verified identical output).
- **`HHMM_RE` needs both minutes and seconds captured** (early draft captured only the hour group →
  `minute: NaN`); fixed to `^([01]\d|2[0-3]):([0-5]\d)$`.
- **`nav.ts` icon names not lucide components** — keeps `src/shared` free of any React/Brand import;
  Phase 08 maps `NavIconName` → concrete lucide nodes.
- Zod v4 idioms used throughout: `z.coerce.number().int()`, `z.uuid()`, `z.discriminatedUnion`,
  `.superRefine`, `.nullish()`, `z.enum(ARRAY)`.

### Verification (all green)

- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **12 files, 111 tests passed** (new: enums 4, times 22, validations 23)
- `pnpm build` — compiled clean

### Commit / push

- `2794983` `Phase 07: shared contracts, DTOs, and zod validation layer`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Phase 08 consumes: `times.ts` for DateRange/Timezone selectors, `nav.ts` + `NavIconName`→lucide map,
  `types.ts` DTOs for dashboard/caregiver/insight components, and wires a superjson `Date` transformer
  into the tRPC client (server root stays transformer-less this phase).
- Phase 10 uses `onboardingSchema` + `common.ts` primitives; keep the Phase 06 `setOnboardingComplete`
  mutation as the completion path.
- Report/server forms call `reportsSchemaFor(serverToday)` — never the loose `reportsSchema` — on the
  server boundary (Phase 20).
- If any later phase needs a new persisted enum, add it to `enums.ts` (not `schema.ts`) and extend
  `enums.test.ts` lists.
## Phase 08 � Reusable component system completion (DONE)

**Plan reference:** Phase 08 spec (`plan.md:959`); �15.2 (charts), �5 data/table recipe, plan.tsx:961
component list (charts wrapper, DataTable, pagination, DateRange, Toast wiring, ConfirmationDialog,
StatusIndicator finalization). Testing requirements: pagination math, chart empty-data graceful,
confirmation dialog requires confirm.
**Objective met:** the catalog is finished with data/behavior primitives and its own hero section on the
dev-only `/design-system` page: `TrendChart` (recharts, glass tooltip, graceful empty state),
`DataTable` (typed sortable + paginated, loading/empty/error states), `RangePicker` (preset segmented
control; bottom sheet on mobile), `ResponsiveDialog` (Dialog =md / Drawer <md), `NavigationIcon` map
(NavIconName ? lucide), plus the `format`/`pagination`/chart-theme/media-query lib helpers. Toaster is
now mounted app-wide. All verification green (145 unit tests, 7/7 e2e).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/lib/format.ts` + `format.test.ts` | created | date-key heads, 12/24h `formatHhmm`, percent/count/compact, plural, date-range, duration labels (�5 copy recipes) |
| `src/lib/pagination.ts` + `pagination.test.ts` | created | `clampPage`/`paginate`/`getPageItems` (ellipsis window)/`pageSummary` |
| `src/lib/chart-theme.ts` | created | `CHART_PALETTE` (emerald/cyan/magenta/amber/violet via `--color-chart-1..5`), `CHART_GRID #e2e8f0`, axis/font constants, `chartColor(i)` |
| `src/lib/use-media-query.ts` | created | SSR-safe `useMediaQuery` + `useIsMobile`/`useIsDesktop` (match < 768 `BREAKPOINTS.md`) |
| `src/components/ui/chart.tsx` + `chart-types.ts` + `chart.test.tsx` | created | `TrendChart` (area/line/bar, empty?EmptyState, glass tooltip, container heights) |
| `src/components/ui/data-table.tsx` + `data-table.test.tsx` | created | generic `DataTable<T>` (sortable headers w/ `aria-sort`, internal pagination, loading skeleton, error+retry, empty state) |
| `src/components/ui/range-picker.tsx` + `range-picker.test.tsx` | created | 7d/30d/90d/custom presets over `rangeByPreset`/`localDateKey`, custom twin `DatePicker`s, mobile bottom sheet |
| `src/components/ui/responsive-dialog.tsx` + `responsive-dialog.test.tsx` | created | `ResponsiveDialog` � centered Dialog =md / Drawer <md |
| `src/components/ui/confirmation-dialog.tsx` + `confirmation-dialog.test.tsx` | modified/created | narrowed `onOpenChange` to 1-arg consumer callback (see deviations) + confirm/cancel suite |
| `src/components/ui/nav-icon.tsx` | created | `NAV_ICONS: Record<NavIconName, LucideIcon>` (all 14 names) + `NavigationIcon` |
| `src/app/layout.tsx` | modified | `<Toaster position="top-center" richColors />` mounted in `body` (sonner, Phase 03 dep) |
| `src/app/(marketing)/design-system/page.tsx` | modified | new `#data` "07 � Data" section: DataTable demo, TrendChart (area + empty) demos, RangePicker (now state), ResponsiveDialog + NavIcon row, table/chart datasets; feedback?08, overlays?09; nav link `#data` |
| `e2e/design-system.spec.ts` | modified | added data-section e2e: DataTable rows + pagination summary, trend svg + empty state, RangePicker preset button |
| `playwright.config.ts` | modified | `workers: 2`, `timeout: 60_000` � dev-server cold-compile hardening (see verification) |
| `e2e/auth.spec.ts` | modified | explicit waits 30s?60s to match the hardened config |
| `package.json` | modified | dep `recharts@3.10.1` (only new runtime dep this phase) |

### Deviations & decisions (precise > faithful)

- **DataTable pagination is internal, �5 anchors only wire count + page.** Header cells keep
  `aria-sort` on the `th`; the sort button is `aria-label="Sort by <column>"` (up/down/neutral arrow).
  Sort cycles asc ? desc ? off. `pageSize` 0 disables paging; footer summary renders `1�4 of 10`.
- **Chart palette via CSS vars, not recharts presets.** `.fill/gr/stroke` reference
  `--color-chart-1..5` (declared in `@theme` for Stitch chart parity �15.2); `chartColor(i)` cycles
  the palette. Grid is literal `#e2e8f0` � allowed: the hex lint gate targets `src/features/**` only.
- **Tooltip is a glass readout** (per �15.2) with `formatValue`/`xTickFormatter` pass-through; an empty
  dataset renders `EmptyState` (`data-slot="trend-chart-empty"`) instead of a blank canvas � the DoD
  "chart renders empty gracefully" is asserted in `chart.test.tsx` under a jsdom `ResizeObserver` stub.
- **`recharts` in jsdom needs a `ResizeObserver` + `getBoundingClientRect` stub** � added per-test in
  `chart.test.tsx`; the svg-render assertion is wrapped in `waitFor` (ResponsiveContainer renders async).
- **`ResponsiveDialog` uses `useIsMobile` for the variant, not CSS.** `use-media-query` returns `false`
  on first render (hydration-safe), so desktop defaults and mobile flips to the Drawer after mount;
  both variants are controlled and share title/description/footer.
- **`ConfirmationDialog.onOpenChange` narrowed from Base UI's 2-arg to `(open: boolean) => void`.** The
  inherited `DialogRootChangeEventDetails` type made a Cancel-button payload awkward; consumers only
  pass `open`. Base UI's real event details stay internal via a forwarding wrapper. Its destructive
  confirm variant (`text-destructive`) is asserted in the new test.
- **RangePicker detection:** the active preset is derived from the current range (7/30/90d match via
  `rangeByPreset` windows; anything else ? `custom`); clicking the active preset is a no-op, and a
  custom edit emits `{ from, to }` via `onChange`. `now`/`timeZone` are injectable props for the
  Phase 10+ clock seam (`shared/times.now()` stays the runtime default).
- **NavigationIcon maps lucide to `NavIconName`** � Phase 09 consumes this (and only this) map, keeping
  `src/shared` free of React imports.
- **superjson tRPC-client transformer (Phase 07 hand-off) NOT wired this phase** � the tRPC **client**
  does not exist yet (Phase 06 client is Better Auth's, not tRPC). Deferred deliberately to the phase
  that actually creates the tRPC client; recorded here so Phase 08's commit does not claim it.
- **Recharts is the only new runtime dependency**; no pin changes to existing deps.

### Verification (all green)

- `pnpm typecheck` � clean (one `noUncheckedIndexedAccess` fix in `chart-theme.ts`)
- `pnpm lint` � clean (0 errors / 0 warnings; removed unused `RANGE_PRESETS` import + a stray `beforeEach`)
- `pnpm test` � **19 files, 145 tests passed** (new: format 8, pagination 9, data-table 5, chart 3,
  range-picker 4, responsive-dialog 2, confirmation-dialog 2)
- `pnpm build` � compiled clean (static pages unchanged; 3 dynamic route groups)
- `pnpm test:e2e` � **7/7 passed** (data-section checks added). NOTE: two auth tests flaked on cold
  dev-server compiles (register?onboarding re-navigation timed out at 30s while the rest of the suite
  passed) � pre-existing Phase 06 flake coinciding with shared-server contention. Hardened config
  (`workers: 2`, `use.timeout: 60_000`, spec waits 60s) and re-verified: full suite passes 7/7 both
  against a pre-warmed dev server and end-to-end from cold.

### Commit / push

- `e23dc9b` `Phase 08: data components, charts, range picker, toast wiring`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Phase 09 consumes `nav.ts` + `nav-icon.tsx` (single lucide map) for the shell/bottom-nav.
- Dashboard/reports/history (18�20) consume `TrendChart` + `DataTable` + `RangePicker` with shared
  `ChartSeries`/`DataTableColumn` types; pass `timeZone` from the session user profile.
- `format.ts`/`pagination.ts` are depth-3 tested units the feature phases should import, not re-derive.
- Keep the `design-system` page `#data` section as the living usage reference; e2e asserts it.
- The superjson tRPC-client note above moves to whichever phase introduces the tRPC client.

---

## Phase 09 — Global shell & navigation `(app)` (DONE)

**Plan reference:** `plan.md` §7 (Global shell spec, lines 385–403), §16 (responsive contract), Phase 09 spec (`plan.md:979`).
**Objective met:** Global authenticated application shell under `src/app/(app)/layout.tsx` wrapping all post-auth routes with a collapsed desktop sidebar that expands on hover without shifting layout, a top header with breadcrumb navigation and profile menu, a 5-item mobile bottom navigation bar, mobile MoreSheet drawer, and group-level skeleton/error/404 states. All 28 routes in `ALL_NAV_HREFS` resolve to concrete pages on disk without dead links.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/nav.ts` | modified | Updated `BOTTOM_NAV` to 5 items (`Schedule`, `Medications`, `Dashboard`, `Adherence`, `More`) per grill-me decision |
| `src/components/layout/Breadcrumbs.tsx` | created | Breadcrumbs with dynamic path resolution, accessible Chevron separators, and semantic aria-current |
| `src/components/layout/ProfileMenu.tsx` | created | User avatar with initials fallback, name/email header, links to profile settings and appearance, sign out |
| `src/components/layout/Sidebar.tsx` | created | Desktop collapsed sidebar (`w-16`), expands on hover to `w-64`, grouped nav links with active tint/emerald states, brand tile header, user footer |
| `src/components/layout/TopNav.tsx` | created | Header bar with mobile brand tile, breadcrumbs, NotificationBell stub, and ProfileMenu |
| `src/components/layout/BottomNav.tsx` | created | Mobile (<md) bottom bar with 5 items, prominent center Dashboard, active emerald dot |
| `src/components/layout/MoreSheet.tsx` | created | Mobile bottom sheet drawer (`Drawer`) exposing secondary nav links (`History`, `AI Insights`, `Reports`, `Caregiver`, `Notifications`, `Settings`, `Help`, sign out) |
| `src/components/layout/AppShell.tsx` | created | Global shell wrapper integrating Sidebar spacer (preventing layout shift), Sidebar, TopNav, BottomNav, and MoreSheet |
| `src/app/(app)/layout.tsx` | modified | Wraps children in `<AppShell user={session.user}>` after `requireUser()` |
| `src/app/(app)/loading.tsx` | created | App shell skeleton loading state (header, 4 stat card skeletons, chart/feed skeletons) |
| `src/app/(app)/error.tsx` | created | Group-level error boundary with `ErrorState`, retry, and dashboard navigation |
| `src/app/(app)/not-found.tsx` | created | Group-level 404 page with `EmptyState` and return to dashboard action |
| `src/app/(app)/dashboard/page.tsx` | modified | Upgraded to premium glass layout: greeting hero banner, 4 stat cards, today's schedule preview, and AI insight preview |
| `src/app/(app)/medications/page.tsx` | created | Medications list placeholder page |
| `src/app/(app)/medications/new/page.tsx` | created | Add medication wizard placeholder page |
| `src/app/(app)/medications/[id]/page.tsx` | created | Medication details placeholder page |
| `src/app/(app)/medications/[id]/edit/page.tsx` | created | Edit medication placeholder page |
| `src/app/(app)/schedule/page.tsx` | created | Today's schedule placeholder page |
| `src/app/(app)/schedule/[doseId]/page.tsx` | created | Dose details placeholder page |
| `src/app/(app)/history/page.tsx` | created | History feed placeholder page |
| `src/app/(app)/adherence/page.tsx` | created | Adherence analytics placeholder page |
| `src/app/(app)/adherence/medications/page.tsx` | created | Medication performance placeholder page |
| `src/app/(app)/insights/page.tsx` | created | AI insights placeholder page |
| `src/app/(app)/reports/page.tsx` | created | Reports placeholder page |
| `src/app/(app)/caregiver/page.tsx` | created | Caregiver management placeholder page |
| `src/app/(app)/caregiver/alerts/[id]/page.tsx` | created | Caregiver alert placeholder page |
| `src/app/(app)/caregiver/accept/page.tsx` | created | Caregiver invitation placeholder page |
| `src/app/(app)/notifications/page.tsx` | created | Notifications placeholder page |
| `src/app/(app)/settings/layout.tsx` | created | Settings sub-navigation tabs matching `SETTINGS_NAV` |
| `src/app/(app)/settings/page.tsx` | created | Redirects `/settings` → `/settings/profile` |
| `src/app/(app)/settings/profile/page.tsx` | created | Profile settings placeholder page |
| `src/app/(app)/settings/reminders/page.tsx` | created | Reminders settings placeholder page |
| `src/app/(app)/settings/caregiver/page.tsx` | created | Caregiver settings placeholder page |
| `src/app/(app)/settings/appearance/page.tsx` | created | Appearance settings placeholder page |
| `src/app/(app)/settings/data/page.tsx` | created | Data and privacy settings placeholder page |
| `src/app/(app)/help/page.tsx` | created | Help and support placeholder page |
| `src/shared/nav.test.ts` | created | Nav model test asserting all groups, 5 bottom nav items, and route file existence for every href |
| `src/components/layout/app-shell.test.tsx` | created | Component unit tests covering breadcrumbs, initials, desktop sidebar, and mobile drawer |
| `e2e/navigation.spec.ts` | created | Playwright e2e test covering desktop multi-route navigation and mobile bottom nav + More sheet |

### Deviations & decisions (precise > faithful)

- **Hover-to-expand desktop sidebar with fixed spacer:** The collapsed desktop sidebar (`w-16`) expands on hover to `w-64` using `fixed inset-y-0` with a subtle elevation shadow. A companion `w-16` spacer in the layout ensures that main page content does not shift during expansion.
- **5-item BottomNav matching user grill-me choice:** The plan originally outlined 4 items (Home/Schedule/Add/More). Per the grill-me design decision, the bottom nav now renders 5 items: Schedule, Medications, Dashboard (center), Adherence, and More (which triggers the `MoreSheet` bottom drawer).
- **Zero dead links:** Every single route in `ALL_NAV_HREFS` has been backed with a concrete `page.tsx` file inside `src/app/(app)/`. The unit test `src/shared/nav.test.ts` explicitly asserts that every route exists on disk.
- **Brand component `href={null}`:** When placed inside interactive containers (like `Sidebar`'s top link), `Brand` accepts `href={null}` so the logo renders as a `<span>` rather than nesting `<a>` inside `<a>`.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **20 test files, 153 unit tests passed** (4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes

### Hand-off notes for Phase 10 (Onboarding)

- Phase 10 will complete the multi-step onboarding wizard at `/onboarding`.
- Registered users redirect to `/onboarding` upon signup; finishing the wizard redirects to `/dashboard`.
- Shell navigation is now locked and verified against all route targets.

---

## Phase 10 — Onboarding (DONE)

**Plan reference:** `plan.md` §11.3 (Onboarding flow spec), §13 (`onboardingSchema`), Phase 10 spec (`plan.md:999`).
**Objective met:** Multi-step onboarding wizard at `/onboarding` housed in a clean, standalone pre-shell layout. Backed by dedicated tRPC procedure `onboarding.complete` which validates using `onboardingSchema`, upserts `user_preferences`, updates `users.timezone`, marks `users.onboardingCompleted = true`, and optionally creates a starter Metformin 500mg prescription with two daily schedule slots (08:00 AM & 08:00 PM).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/server/domain/settings/get-or-createPreferences.ts` | created | Domain functions to retrieve, initialize defaults, or upsert `user_preferences` rows |
| `src/server/trpc/routers/onboarding.ts` | created | `onboardingRouter` with `getPreferences` query and `complete` mutation |
| `src/server/trpc/routers/aadhi.ts` | modified | Composed `onboarding: onboardingRouter` into `aadhiRouters` |
| `src/features/onboarding/types.ts` | created | Onboarding wizard state types and standard defaults |
| `src/features/onboarding/steps/ProfileStep.tsx` | created | Step 1: Timezone picker (auto-detects local browser timezone) & user profile confirmation |
| `src/features/onboarding/steps/RemindersStep.tsx` | created | Step 2: Reminder habits with Balanced/Strict/Relaxed presets & fine-grained timing inputs |
| `src/features/onboarding/steps/FinishStep.tsx` | created | Step 3: Metformin 500mg sample medication opt-in toggle + configuration summary |
| `src/features/onboarding/OnboardingWizard.tsx` | created | 3-step wizard state machine with Stitch pill progress indicator, skip action, and submission |
| `src/app/(onboarding)/layout.tsx` | created | Standalone pre-shell layout with `requireUser()` auth enforcement |
| `src/app/(onboarding)/onboarding/page.tsx` | created | Route page mounting `OnboardingWizard` with server session profile |
| `src/app/(app)/onboarding/page.tsx` | deleted | Removed Phase 06 placeholder in favor of standalone layout |
| `src/features/onboarding/onboarding-wizard.test.tsx` | created | Comprehensive component test suite (6 tests) covering steps, presets, toggles, skip, and submit |
| `src/server/domain/settings/preferences.test.ts` | created | Unit test suite (4 tests) covering `onboardingSchema`, timezone validation, and bounds |
| `e2e/onboarding.spec.ts` | created | End-to-end test verifying user registration through multi-step onboarding into dashboard |

### Deviations & decisions (precise > faithful)

- **Standalone `(onboarding)` route group:** As decided in the grill-me interview and per plan ("onboarding is pre-shell"), onboarding renders in a dedicated centered layout rather than inside the global `AppShell` with the sidebar and topnav, avoiding distractions during first setup.
- **Transactional sample medication creation:** When the user leaves "Add sample medication" toggled on, the `onboarding.complete` mutation inserts Metformin 500mg and two schedule records (08:00 and 20:00) in the same transaction as the preferences upsert.
- **Skip with defaults:** Users can skip onboarding at any time via a top-right button which invokes `auth.setOnboardingComplete` and lands directly on `/dashboard`.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **22 test files, 163 unit tests passed** (4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes (including `/onboarding`)

### Hand-off notes for Phase 11 (Medication domain service)

- Onboarding now persists real `user_preferences` and optional initial medication records.
- Phase 11 will build the full server-side Medication Domain Service (`service.ts`, `repo.ts`, `mapper.ts`, `medicationRouter`) for full CRUD, soft-deletes, and ownership checks.

---

## Phase 11 — Medication domain service (server) (DONE)

**Plan reference:** `plan.md` §10.1 (Medication domain), §8.3/§8.4 (Medications & schedules tables), §9 (`types.ts` DTO contracts), §13 (`medicationSchema` & `scheduleSchema`), Phase 11 spec (`plan.md:1019`).
**Objective met:** Comprehensive server-side medication domain layer encompassing repository queries, DTO mapping, business service with lifecycle management, duplicate active name prevention, transactional schedule slot synchronization, event hooks for Phase 12 background generation, and an authenticated tRPC router with 7 procedures (`list`, `get`, `create`, `update`, `setStatus`, `archive`, `unarchive`).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/calc/frequency.ts` | created | Pure calculation helper deriving `FrequencyLabel` ("once-daily", "twice-daily", "n-times-daily", "custom-weekdays") from enabled slots |
| `src/shared/calc/frequency.test.ts` | created | 8 unit tests covering all frequency derivation and formatting rules |
| `src/server/domain/medications/mapper.ts` | created | Type-safe mappers `toMedicationDTO`, `toScheduleSlotDTO`, and `toMedicationLite` with numeric conversions and slot sorting |
| `src/server/domain/medications/mapper.test.ts` | created | 5 unit tests verifying slot sorting, numeric coercions, and DTO extraction |
| `src/server/domain/medications/repo.ts` | created | Drizzle ORM repository strictly enforcing `userId` ownership on all queries, updates, slot deletions, and soft-deletes |
| `src/server/domain/medications/service.ts` | created | Domain service providing duplicate name guards, slot transaction sync, lifecycle mutations, and event seam hooks |
| `src/server/domain/medications/service.test.ts` | created | 11 unit tests verifying CRUD, duplicate checks, ownership gates, soft-delete, and event hook emissions |
| `src/shared/validations/medication.ts` | modified | Exported `medicationBaseSchema` and `updateMedicationSchema` to enable clean `.partial().extend()` composition in routers |
| `src/server/trpc/routers/medication.ts` | created | Authenticated tRPC router exposing `list`, `get`, `create`, `update`, `setStatus`, `archive`, and `unarchive` |
| `src/server/trpc/routers/medication.test.ts` | created | 7 integration tests invoking `appRouter.createCaller` for auth and lifecycle procedures |
| `src/server/trpc/routers/aadhi.ts` | modified | Registered `medication: medicationRouter` in `aadhiRouters` |
| `impl.md` | modified | Updated phase status matrix and logged completed Phase 11 details |

### Deviations & decisions (precise > faithful)

- **Pure Frequency Derivation (`frequency.ts`):** `deriveFrequency` strictly evaluates enabled slots (`slot.enabled !== false`). If any enabled slot runs on a non-7-day subset, the frequency is tagged `"custom-weekdays"`. If all enabled slots are daily, it maps `1 -> "once-daily"`, `2 -> "twice-daily"`, and `>=3 -> "n-times-daily"`, with default fallback to `"once-daily"`.
- **Duplicate Active Name Prevention:** Enforces case-insensitive duplicate name checks (`lower(name) = lower(input)`) against active (non-archived) medications for the user. Provides friendly `TRPCError({ code: "CONFLICT", message: "An active medication with this name already exists." })`.
- **Unarchive Guard:** Before restoring an archived medication, unarchive validates that no active medication with the same name was created while it was archived.
- **Transactional Slot Replacement:** When updating schedule slots, the service transactionally wipes existing slots and inserts the new set, guaranteeing that schedules and medications never drift out of sync.
- **Phase 12 / 13 Event Seam:** Exported `registerMedicationChangeHandler` and `notifyMedicationChanged` in `service.ts` to allow Phase 12 (dose-event generation) and Phase 13 (missed reconcile) to subscribe to medication lifecycle events without circular imports.
- **Zod Schema Refinement Separation:** Extracted `medicationBaseSchema` from `medicationSchema` so that `updateMedicationProcedureSchema` can call `.partial().extend(...)` without encountering Zod v3/v4 errors on refined objects.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **26 test files, 194 unit & integration tests passed** (+31 new tests, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes

### Hand-off notes for Phase 12 (Medication schedule & dose-event generation)

- `medicationRouter` and `medicationService` are fully operational and verified.
- Phase 12 can hook directly into `registerMedicationChangeHandler` to trigger `ensureDoseEvents(userId, medicationId, from, to)` whenever a medication is created, updated, paused, or unarchived.

---

## Phase 12 — Medication schedule & dose-event generation (domain) (DONE)

**Plan reference:** `plan.md` §10.2 (Scheduling & dose-event generation), §8.4/§8.5 (`medication_schedules` & `dose_events` tables), §9 (types & time helpers), Phase 12 spec (`plan.md:1039`).
**Objective met:** Pure schedule expansion engine, idempotent dose-event generation service across a 14-day horizon with on-conflict do-nothing guarantees, future event voiding on schedule modification/pause/archive, automatic lifecycle change orchestration via domain event handlers, and a periodic reconcile scheduler skeleton.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/calc/schedule.ts` | created | Pure, timezone-aware schedule expansion engine (`expandSchedule`) mapping slot days and times to concrete UTC instants |
| `src/shared/calc/schedule.test.ts` | created | 7 unit tests verifying active/pause rules, daily, twice-daily, custom weekdays, date bounds clipping, and timezone offsets |
| `src/server/domain/doseEvents/service.ts` | created | Core domain operations: `ensureDoseEvents` (horizon expansion & idempotent insert), `voidFutureDoseEvents`, and `catchUpDoseEvents` |
| `src/server/domain/doseEvents/service.test.ts` | created | 7 unit tests verifying idempotent insertion, deadline calculations, future event voiding, and lifecycle handling |
| `src/server/domain/medicationSchedules/service.ts` | created | Subscribes to `registerMedicationChangeHandler` to automatically trigger `ensureDoseEvents` and `voidFutureDoseEvents` |
| `src/server/domain/jobs/scheduler.ts` | created | Background reconcile skeleton extending horizon and catching up dose events across active users |
| `impl.md` | modified | Updated phase matrix and recorded Phase 12 completion details |

### Deviations & decisions (precise > faithful)

- **Pure expansion engine (`schedule.ts`):** `expandSchedule` runs completely independently from the database, taking plain medication and slot shapes alongside local dates `[from, to]` and an IANA `timeZone`. It combines local date keys with slot times into exact UTC instants using date-fns v4 / `@date-fns/tz`.
- **Selective Future Voiding:** As decided in the grill-me interview, modifying slots, pausing, or archiving a medication only cancels unresolved future events (`status IN ('upcoming', 'due', 'snoozed')` where `scheduledFor > now`). Past events and resolved events (`taken`, `skipped`, `missed`) remain untouched to protect history.
- **Slot Diff Voiding:** When slots are updated, `validScheduleIds` is passed into `voidFutureDoseEvents` so that only events belonging to removed or changed slots are canceled, leaving valid existing future slots intact.
- **Idempotency via Postgres Partial Unique Index:** `doseEvents` writes use `.onConflictDoNothing({ target: [doseEvents.medicationId, doseEvents.scheduledFor] })`, making repeated expansion safe against race conditions and duplicates.
- **Automated Lifecycle Wiring:** `medicationSchedules/service.ts` listens to the event seam created in Phase 11. Creating, updating, pausing, or archiving a medication instantly coordinates dose-event generation or cancellation without circular dependencies.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **28 test files, 208 unit & integration tests passed** (+14 new tests in Phase 12, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes

### Hand-off notes for Phase 13 (Dose state machine + reconcile)

- Dose events are now reliably generated into `dose_events` across a 14-day horizon.
- Phase 13 will implement the deterministic dose status transition machine (`upcoming -> due -> snoozed -> missed | taken | skipped`), the user dose action mutations (`take`, `snooze`, `skip`), the missed-dose reconciliation job, and the attachment seam for notifications.

---

## Phase 13 — Dose state machine + reconcile (missed detection) (domain) (DONE)

**Plan reference:** `plan.md` §10.3 (Dose status machine), §10.4 (Actions & audit), §8.5/§8.6 (`dose_events` & `dose_actions` tables), §13 (`doseActionSchema`), Phase 13 spec (`plan.md:1041`).
**Objective met:** Pure dose transition engine (`doseState.ts`), atomic user action mutations (`take`, `snooze`, `skip`) with append-only audit logging to `dose_actions`, automated missed-dose detection scanner (`reconcileDoseStatuses`) integrated with the notification/alert hook seam, and a full-featured `doseRouter` providing user mutations, single dose lookup, and today's schedule query.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/calc/doseState.ts` | created | Pure transition validation (`canTakeDose`, `canSnoozeDose`, `canSkipDose`, `calculateSnoozeTimes`, `isDoseMissed`, `isDoseDue`) |
| `src/shared/calc/doseState.test.ts` | created | 12 unit tests verifying all state gates, snooze bounds, and missed grace calculations |
| `src/server/domain/doseEvents/mapper.ts` | created | DTO mappers converting `dose_events` and `dose_actions` rows to `DoseEventDTO` and `DoseActionDTO` |
| `src/server/domain/doseEvents/actions.ts` | created | Atomic mutations (`takeDose`, `snoozeDose`, `skipDose`) with conditional UPDATEs and `dose_actions` audit logging |
| `src/server/domain/doseEvents/actions.test.ts` | created | 7 unit tests verifying atomic transitions, late dose taking, max snooze bounds, and skip restrictions |
| `src/server/domain/doseEvents/reconcile.ts` | created | Reconcile engine scanning expired doses past `missedDeadline`, auditing `missed_auto`, and triggering the hook seam |
| `src/server/domain/doseEvents/reconcile.test.ts` | created | Integration test asserting auto-missed transitions, audit logging, and `runMissedDoseHandlers` invocation |
| `src/server/trpc/routers/dose.ts` | created | Authenticated tRPC router exposing `take`, `snooze`, `skip`, `get`, `today`, and `reconcile` |
| `src/server/trpc/routers/dose.test.ts` | created | 5 integration tests verifying caller authentication, inputs, and procedure executions |
| `src/server/trpc/routers/aadhi.ts` | modified | Registered `dose: doseRouter` in `aadhiRouters` |
| `impl.md` | modified | Updated phase matrix and logged Phase 13 completion details |

### Deviations & decisions (precise > faithful)

- **Atomic Status Transitions:** Uses conditional `UPDATE dose_events ... WHERE id = :id AND user_id = :userId AND status IN (...)` to prevent race conditions or double-action submissions (e.g. double-tap take or taking an already skipped dose).
- **Taking Late Allowed:** Per plan §10.3 rule 4 and the grill-me decision, taking a dose that was already marked as missed converts `missed -> taken` with an updated timestamp and audit record, ensuring patients get credit for taking their medication even if late.
- **Skipping Missed Disallowed:** Per grill-me decision, skipping an already-missed dose is rejected (`BAD_REQUEST`), preventing retroactive falsification of adherence data without an explicit reopen flow.
- **Snooze Grace Extension:** Snoozing calculates `snoozeUntil = now + snoozeMinutes` and sets `missedDeadline = max(missedDeadline, snoozeUntil + missedAfterMinutes)` so patients are not penalized with an immediate missed status right after snoozing.
- **Audit Logging:** Every user action (`take`, `snooze`, `skip`) and system auto-transition (`missed_auto`) records an immutable row in `dose_actions` containing the instant, user ID, event ID, action type, and metadata (such as skip reason or snooze count).
- **Inline Reconcile on Today's Schedule:** When a user queries `dose.today`, an inline reconcile pass automatically advances upcoming doses to `due` and checks for newly missed doses before returning the list, ensuring the UI always reflects live statuses.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **32 test files, 233 unit & integration tests passed** (+25 new tests in Phase 13, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes

### Hand-off notes for Phase 14 (Today's Schedule page + dose UI)

- The server domain spine for medications, schedule slots, dose events, and dose actions is now 100% complete and verified.
- Phase 14 will build the frontend client experience at `/schedule`: interactive dose cards, Stitch pills, take/snooze/skip dialogs, time bucket grouping (Morning/Afternoon/Evening/Night), and optimistic UI updates.

---

## Phase 14 — Today's Schedule page + dose UI (DONE)

**Plan reference:** `plan.md` §10.1 (Today view), §10.2 (Time bucket grouping), §10.3 (Dose card UX & Stitch adherence pill badge), Phase 14 spec (`plan.md:1047`).
**Objective met:** Production-grade `/schedule` page presenting today's medication regimen organized by time buckets (Morning, Afternoon, Evening, Night), one-click Take action with optimistic updates, snooze dialog with configurable delays, skip dialog with reason taxonomy, adherence progress card, filter tabs (All, Due/Next, Taken, Missed/Skipped) with counts, and empty states.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/features/schedule/types.ts` | created | Schedule UI types (`ScheduleFilterTab`, `ScheduleBucketGroup`) |
| `src/features/schedule/DoseCard.tsx` | created | Stitch-style dose card with pill badge, dosage, time, status badge, and action triggers |
| `src/features/schedule/SnoozeDialog.tsx` | created | Responsive modal/drawer for choosing preset snooze durations (10m, 15m, 30m, 60m) |
| `src/features/schedule/SkipDialog.tsx` | created | Responsive modal/drawer for choosing skip reasons (Side effects, Out of medication, Doctor advised, Feeling unwell, Forgot/Too late, Other) |
| `src/features/schedule/ScheduleFilterTabs.tsx` | created | Pill filter tabs with count badges for quick status filtering |
| `src/features/schedule/TimeBucketSection.tsx` | created | Section rendering doses grouped into Morning, Afternoon, Evening, Night buckets with bucket headers and icons |
| `src/features/schedule/ScheduleProgressCard.tsx` | created | Today's adherence card with completion progress bar, count stats, and manual sync button |
| `src/features/schedule/ScheduleView.tsx` | created | Main schedule controller orchestrating tRPC `dose.today` query, filter logic, bucket bucketing, modals, and mutations |
| `src/app/(app)/schedule/page.tsx` | modified | Replaced stub with live `ScheduleView` component |
| `src/features/schedule/schedule-view.test.tsx` | created | 7 unit tests testing DoseCard, SnoozeDialog, SkipDialog, ScheduleFilterTabs, and ScheduleProgressCard |
| `impl.md` | modified | Updated phase matrix and logged Phase 14 completion details |

### Deviations & decisions (precise > faithful)

- **Pure Time-Bucket Partitioning:** Doses are grouped into Morning (05:00–11:59), Afternoon (12:00–16:59), Evening (17:00–20:59), and Night (21:00–04:59) using the user's localized scheduled time.
- **Optimistic UI with Sonner Feedback:** Taking a dose triggers immediate feedback via `toast.success`, with immediate invalidation of `api.dose.today` and the schedule query cache to synchronize state with server authority.
- **Late Doses Actionable:** Missed doses display a "Take Late" button on the dose card, allowing patients to record late doses as allowed by domain rules, while disabling the "Skip" action on already-missed doses.
- **Design System Token Strictness:** Ensured zero hardcoded hex values in feature components, utilizing semantic tokens (`bg-primary`, `bg-amber-tint`, `text-amber`, `border-border`, etc.) adhering to the strict ESLint architecture rule.
- **Responsive Dialog / Drawer:** Snooze and Skip dialogs leverage `ResponsiveDialog` (`Dialog` on desktop, `Drawer` on mobile) ensuring a seamless cross-device touch experience.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **33 test files, 240 unit & integration tests passed** (+7 new tests in Phase 14, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes (`/schedule` production bundle 22.4 kB)

### Hand-off notes for Phase 15 (Medication CRUD UI)

- Today's schedule UI is complete and fully functional.
- Phase 15 will build the Medication CRUD management user experience:
  - List page (`/medications`) with search, filter (active/paused/archived), and quick status toggling.
  - Detail page (`/medications/[id]`) showing dosage, schedule slots, instructions, adherence preview, and actions.
  - Creation wizard / form (`/medications/new`) with schedule slot configuration, dosage unit selector, color picker, and validation.
  - Edit form (`/medications/[id]/edit`) with slot diffing and transactional updates.

---

## Phase 15 — Medication CRUD UI (list / detail / new / edit) (DONE)

**Plan reference:** `plan.md` §11.5 (`/medications`), §11.6 (`/medications/new`, `/medications/[id]`, `/medications/[id]/edit`), §13 (`medicationSchema`, `scheduleSchema`), Phase 15 spec (`plan.md:1099`).
**Objective met:** Full medication lifecycle experience across all 4 routes:
- `/medications` list page with search, status tabs (`All`, `Active`, `Paused`, `Archived`) with count badges, `MedicationCard`s, quick pause/resume toggling, and archive modal.
- `/medications/new` 4-step wizard (Basics, Schedule, Reminders, Review & Submit) with step progress indicators, `ScheduleBuilder` with presets (Once daily, Twice daily, 3x daily, Custom) and per-day weekday chip toggles, pill color selector, and Zod step validations.
- `/medications/[id]` detail page with full prescription summary, schedule slots breakdown, doctor's notes, pause/archived status banners, quick pause/resume and edit actions, and live recent dose history preview (`dose.listByMedication`).
- `/medications/[id]/edit` streamlined sectioned form prefilled with existing values, supporting schedule diffing and slot updates.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/colors.ts` | created | Curated medication color palette (Emerald, Teal, Cyan, Blue, Indigo, Purple, Rose, Amber) adhering to design tokens and architecture rules |
| `src/features/medications/types.ts` | created | Medication UI types (`MedicationFilterTab`, `FrequencyPreset`, `MedicationFormData`) |
| `src/features/medications/ScheduleBuilder.tsx` | created | Schedule builder with presets, native `TimePicker`, weekday chips (Su, M, Tu, W, Th, F, Sa), and slot addition/removal up to `MAX_SCHEDULE_SLOTS` |
| `src/features/medications/ArchiveDialog.tsx` | created | Responsive confirmation dialog explaining soft-delete archive semantics and the historical record guarantee |
| `src/features/medications/MedicationCard.tsx` | created | Stitch-styled medication card with color avatar, dosage, frequency badge, status chip, pause/resume toggle, and actions |
| `src/features/medications/MedicationListPage.tsx` | created | Medication list view controller with search, status tabs with badge counts, empty states, and status mutations |
| `src/features/medications/MedicationForm.tsx` | created | Multi-step wizard (`mode="new"`) and streamlined sectioned editor (`mode="edit"`) with live validations, color picker, and review card |
| `src/features/medications/MedicationDetailPage.tsx` | created | Detailed view presenting medication metadata, schedule slots, and recent dose history activity |
| `src/features/medications/MedicationEditPage.tsx` | created | Edit page controller fetching medication data and prefilling `MedicationForm` |
| `src/server/trpc/routers/dose.ts` | modified | Added `listByMedication` procedure to support recent dose history queries on the medication detail page |
| `src/app/(app)/medications/page.tsx` | modified | Wired to render `MedicationListPage` |
| `src/app/(app)/medications/new/page.tsx` | modified | Wired to render `MedicationForm` in `mode="new"` |
| `src/app/(app)/medications/[id]/page.tsx` | modified | Wired to render `MedicationDetailPage` |
| `src/app/(app)/medications/[id]/edit/page.tsx` | modified | Wired to render `MedicationEditPage` |
| `src/features/medications/medication-ui.test.tsx` | created | 7 unit & integration tests covering `MedicationCard`, `ArchiveDialog`, `ScheduleBuilder`, and `MedicationForm` |
| `impl.md` | modified | Updated phase matrix and logged Phase 15 completion details |

### Deviations & decisions (precise > faithful)

- **Wizard for New vs Sectioned Form for Edit:** Per the grill-me alignment, `/medications/new` implements a guided 4-step wizard with step progression and a review card, while `/medications/[id]/edit` uses a unified sectioned form for rapid, efficient updates.
- **Auto-Populated Recommended Defaults:** Selecting schedule presets ("Once daily", "Twice daily", "3x daily") automatically generates standard clinical times (08:00; 08:00 & 20:00; 08:00, 14:00 & 20:00) with every day enabled, while allowing full customization of time and weekdays.
- **Card-Level Quick Toggles:** The list page allows users to instantly toggle medications between `active` and `paused` directly from each card, with optimistic updates and Sonner toast confirmations.
- **Strict ESLint Token Architecture:** All feature files strictly avoid hardcoded hex literals, referencing `@/shared/colors` or Tailwind semantic design tokens (`bg-primary`, `bg-amber-tint`, `text-amber`, `border-border`, etc.).
- **Live Recent Dose Activity:** Extended `doseRouter` with `listByMedication` to display the last 10 dose events with localized times and status badges on the medication detail page.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **34 test files, 247 unit & integration tests passed** (+7 new tests in Phase 15, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes (medications list 6.33 kB, detail 7.68 kB, new 193 B, edit 875 B)

### Hand-off notes for Phase 16 (Adherence engine)

- Medication authoring and editing is completely functional and verified.
- Phase 16 will implement the core calculation and domain aggregation engine for adherence:
  - Pure calculation functions in `src/shared/calc/adherence.ts`, `streaks.ts`, `performance.ts`.
  - Materialization and aggregation service in `src/server/domain/adherence/service.ts`, `summary.ts`, `materialize.ts`.
  - tRPC procedures in `src/server/trpc/routers/adherence.ts` (`summary`, `byMedication`, `patterns`).
  - Unit tests asserting adherence percentages, current & longest streak calculations, time-of-day bucket aggregates, and edge cases.

---

## Phase 16 — Adherence engine (domain + aggregation service) (DONE)

**Plan reference:** `plan.md` §10.5 (Adherence engine), §8.7 (`adherence_daily` table), §9 (`AdherenceSummaryDTO`, `StreakSummaryDTO`, `TrendDTO`, `TimeBucketStats`, `MedicationPerformanceDTO`), Phase 16 spec (`plan.md:1119`).
**Objective met:** Comprehensive domain calculation engine and aggregation service establishing the single source of truth for adherence figures across all surfaces (adherence page, dashboard, reports, insights).
- Pure calculation suite:
  - `src/shared/calc/adherence.ts`: `calculateAdherencePercent` (formula: `taken / (taken + missed + skipped) * 100`, rounded to 1 dp, null if empty), `bucketOfHour` (Morning <12, Afternoon 12–16, Evening 17–20, Night ≥21), and `calculateTimeBucketStats`.
  - `src/shared/calc/streaks.ts`: `calculateStreaks` respecting rest days (`scheduled === 0` preserves run), penalizing non-adherent days (`missed > 0 || skipped > 0`), and counting in-progress today if adherent-so-far.
  - `src/shared/calc/performance.ts`: `calculateTrend` (rolling 7-day average, prior 7-day average, direction: improving/declining/stable) and `calculateMedicationPerformance` (per-med adherence, best/worst bucket, lastTakenAt).
- Domain service:
  - `src/server/domain/adherence/materialize.ts`: `recomputeDay`, `recomputeRange` for populating and maintaining `adherence_daily` rows.
  - `src/server/domain/adherence/summary.ts`: `getAdherenceSummary` producing canonical `AdherenceSummaryDTO`.
  - `src/server/domain/adherence/service.ts`: coordinator exposing `getAdherenceSummary`, `getMedicationPerformance`, `getTimeBucketPatterns`, `recomputeRange`.
- API layer:
  - `src/server/trpc/routers/adherence.ts`: procedures `summary`, `byMedication`, `patterns`, `recompute`.
  - Registered `adherence: adherenceRouter` in `aadhiRouters` (`src/server/trpc/routers/aadhi.ts`).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/shared/calc/adherence.ts` | created | Pure adherence rate formula and 24-hour time-of-day bucket classifier |
| `src/shared/calc/streaks.ts` | created | Pure streaks engine handling rest days, unbroken runs, and today in-progress logic |
| `src/shared/calc/performance.ts` | created | Pure rolling 7-day trend analysis, direction derivation, and per-medication performance calculation |
| `src/shared/calc/adherence.test.ts` | created | 9 unit tests verifying sample dataset (76/84 = 90.5%), bucket bounds, streak edges, and trends |
| `src/server/domain/adherence/materialize.ts` | created | Daily materialization service storing aggregated day stats in `adherence_daily` |
| `src/server/domain/adherence/summary.ts` | created | Aggregation engine compiling `AdherenceSummaryDTO` |
| `src/server/domain/adherence/service.ts` | created | Domain service facade combining summary, performance, patterns, and range recomputation |
| `src/server/trpc/routers/adherence.ts` | created | tRPC router exposing `summary`, `byMedication`, `patterns`, and `recompute` |
| `src/server/trpc/routers/adherence.test.ts` | created | 5 integration tests testing authentication, inputs, and procedure executions |
| `src/server/trpc/routers/aadhi.ts` | modified | Registered `adherence: adherenceRouter` in `aadhiRouters` |
| `impl.md` | modified | Updated phase matrix and logged Phase 16 completion details |

### Deviations & decisions (precise > faithful)

- **Exact Seed Formula Match:** Implemented the strict §10.5 formula `taken / (taken + missed + skipped) * 100`, verifying with the 76/84 = 90.5% sample figure. Empty periods safely return `null` ("No data").
- **Rest Day Streak Preservation:** As aligned in the grill-me interview, rest days with 0 scheduled doses preserve the user's running streak without resetting it or counting falsely as a non-adherent break.
- **In-Progress Today Semantics:** Today counts towards `currentStreak` if all doses due so far have been taken (`missed === 0 && skipped === 0`), but historical `longestStreak` only includes fully concluded days.
- **Rolling Trend Delta:** Trends use 7-day rolling window comparison: current 7-day average minus prior 7-day average (> +2% = improving, < -2% = declining, otherwise stable).
- **Hybrid Data Aggregation:** Reads query live `dose_events` for real-time responsiveness and consistency, with `recomputeDay` and `recomputeRange` materializing `adherence_daily` rows for fast reporting.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **36 test files, 261 unit & integration tests passed** (+14 new tests in Phase 16, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes

### Hand-off notes for Phase 17 (Adherence UI + medication performance)

- The domain calculation engine and tRPC endpoints for adherence are complete, tested, and verified.
- Phase 17 will build the frontend client experience at `/adherence` and `/adherence/medications`:
  - Range presets (7d, 30d, 90d, custom).
  - Stat cards: Overall adherence %, current streak, longest streak, taken vs missed vs skipped counts.
  - Trend charts: Area/bar adherence trend chart with rolling 7-day line.
  - Time-of-day pattern bars (Morning, Afternoon, Evening, Night).
  - Medication performance table (`/adherence/medications`) showing per-medication adherence, best/worst bucket, sparklines, and links to medication detail.

---

## Phase 17 — Adherence UI + medication performance (DONE)

**Plan reference:** `plan.md` §11.8 (`/adherence`, `/adherence/medications`), §10.5 (Adherence formulas & time buckets), §12 (Status system), Phase 17 spec (`plan.md:1139`).
**Objective met:** Production-grade adherence analytics interface across `/adherence` and `/adherence/medications` delivering deep adherence insights powered by `AdherenceSummaryDTO`:
- Top pill navigation tabs (`AdherenceNavTabs`) providing seamless routing between Overview and Medication Breakdown.
- Range picker (`RangePicker`) supporting 7d, 30d, 90d presets and custom date ranges.
- Stat rail (`StatRail`) displaying overall adherence %, current & longest streaks, doses taken, and missed/skipped counts with trend direction indicators.
- Adherence trend chart (`TrendChart`) using Recharts ComposedChart with daily adherence bars and a smooth 7-day rolling average line curve with glass tooltip.
- Time-of-day pattern breakdown (`TimeOfDayPattern`) visualizing Morning, Afternoon, Evening, and Night completion rates and progress tracks.
- Calendar heat-strip (`MissedHeatStrip`) rendering daily colored status tiles (Green: adherent, Amber: partial/skipped, Red: missed, Slate: rest) with interactive hover tooltips.
- Medication performance table (`MedicationPerformanceTable`) presenting per-medication adherence rates, completion breakdowns, best time bucket badges, and quick links to medication details.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/features/adherence/AdherenceNavTabs.tsx` | created | Pill navigation switcher between Overview and By Medication |
| `src/features/adherence/StatRail.tsx` | created | 4-card metric rail displaying adherence rate, streaks, taken count, and missed/skipped breakdown |
| `src/features/adherence/TrendChart.tsx` | created | Composed Recharts chart with daily adherence bars, rolling 7-day average line, and glass tooltip |
| `src/features/adherence/TimeOfDayPattern.tsx` | created | Time-of-day pattern cards for Morning, Afternoon, Evening, and Night with progress bars |
| `src/features/adherence/MissedHeatStrip.tsx` | created | Interactive day-by-day calendar heat-strip with hover tooltips and adherence legend |
| `src/features/adherence/AdherenceOverviewPage.tsx` | created | Main adherence controller coordinating range selection, queries, stat rail, charts, patterns, and heat-strip |
| `src/features/adherence/MedicationPerformanceTable.tsx` | created | Table view at `/adherence/medications` displaying per-prescription performance, best bucket, and details link |
| `src/app/(app)/adherence/page.tsx` | modified | Wired to render `AdherenceOverviewPage` |
| `src/app/(app)/adherence/medications/page.tsx` | modified | Wired to render `MedicationPerformanceTable` |
| `src/features/adherence/adherence-ui.test.tsx` | created | 4 unit and integration tests covering StatRail, TimeOfDayPattern, MissedHeatStrip, and AdherenceNavTabs |
| `impl.md` | modified | Updated phase matrix and logged Phase 17 completion details |

### Deviations & decisions (precise > faithful)

- **Composed Daily & Rolling Trend:** Per the grill-me alignment, the trend chart combines daily completion bars with a smooth 7-day rolling average line curve, avoiding false zero drops on rest days.
- **Top Pill Navigation Switcher:** Provides immediate, unified switching between Overview (`/adherence`) and Medication Breakdown (`/adherence/medications`) using persistent URL routing.
- **Strict ESLint Token Architecture:** All adherence feature components strictly adhere to Tailwind design tokens and CSS variables (`var(--primary)`, `bg-primary`, `bg-amber-tint`, etc.), ensuring zero hardcoded hex literals in `src/features/`.
- **Interactive Calendar Heat-Strip:** Implemented day-by-day tile matrix with hover tooltips displaying date and exact taken/missed/skipped counts for every calendar day in the range.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **37 test files, 265 unit & integration tests passed** (+4 new tests in Phase 17, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 static and dynamic routes (`/adherence` 4.86 kB, `/adherence/medications` 3.4 kB)

### Hand-off notes for Phase 18 (Dashboard)

- Adherence engine and client UI are complete, tested, and verified.
- Central `/dashboard` surface implemented and completed below.

---

## 2026-09-24 — Phase 18: Dashboard (`/dashboard`)

### Context & Scope

Phase 18 implements the central user landing surface `/dashboard` according to plan §11.4 and §18:
1. **Server domain aggregator:** Created `src/server/domain/dashboard/service.ts` aggregating all landing surface data in a single round-trip (`dashboard.get`):
   - Reconciles dose statuses (`reconcileDoseStatuses`) and ensures horizon dose events (`ensureDoseEvents`).
   - Retrieves today's doses, classified by status into `dueNow` and `today`.
   - Determines `nextDose` (earliest unresolved dose today, or nearest future unresolved dose).
   - Computes today's dose metrics (`adherenceToday`, `takenToday`, `missedToday`, `scheduledToday`).
   - Fetches 7-day adherence summary for `week` (`AdherenceDay[]`) and `currentStreak`.
   - Queries active medications (`medications`).
   - Provides contextual stubs for `latestInsight` (`InsightDTO`, bridging to Phase 24) and `caregiver` (`DashboardCaregiverDTO`, bridging to Phase 21).
2. **tRPC Router:**
   - Created `src/server/trpc/routers/dashboard.ts` with `get` procedure taking optional `timeZone`.
   - Registered `dashboard: dashboardRouter` in `src/server/trpc/routers/aadhi.ts` (auto-joining `appRouter` through `root.ts`).
3. **UI Components (`src/features/dashboard/`):**
   - `NextDoseHero.tsx`: Floating emerald-tinted glass card with one-click "Take Dose", "Snooze" dialog trigger, and "Skip" dialog trigger. Features "Due Now" pulsing beacon, "All caught up" celebration card, and onboarding CTA for users with no medications.
   - `StatRail.tsx` / Metric Cards: 4 `StatCard` items covering Today's Adherence, Current Streak, Next Scheduled Dose, and Missed Today.
   - `TodayFeed.tsx`: Smart prioritized timeline showing up to 4 doses (Due Now & Snoozed first, then Upcoming, then Resolved) with inline actions and link to `/schedule`.
   - `AdherenceWidget.tsx`: Compact 7-day Recharts chart with daily completion bars, 90% target reference line, and interactive tooltips.
   - `MedSummary.tsx`: Active prescriptions list with avatar color chips, dosage, frequency, and link to `/medications`.
   - `InsightWidget.tsx`: AI / heuristic pattern card linking to `/insights`.
   - `CaregiverStatus.tsx`: Caregiver network summary linking to `/caregiver`.
   - `QuickActions.tsx`: 4 quick action shortcuts to key surfaces.
   - `DashboardPage.tsx`: Client controller orchestrating queries, mutations, toasts, dialog state, loading skeletons, and error retries.
4. **App Routing:**
   - Updated `src/app/(app)/dashboard/page.tsx` to render `DashboardPage`.

### Architecture & Design Decisions

- **Single Round-Trip Aggregation:** All dashboard widgets hydrate from a single `dashboard.get` tRPC query, avoiding waterfall queries and layout shifts while ensuring perfect consistency across widgets.
- **Unified Action Invalidation:** Taking, snoozing, or skipping a dose directly from the dashboard invalidates both `dashboard.get` and `dose.today` caches simultaneously.
- **Design System Fidelity:** Emerald floating card styling, SectionLabels, StatCards, and Recharts theme tokens adhere strictly to the established Stitch tokens. Zero hardcoded hex literals in `src/features/`.
- **Three-State Hero Block:** Intelligently switches between Active Next/Due Dose, "All Caught Up" celebratory card, and "Welcome / Add Medication" onboarding CTA.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **40 test files, 284 unit & integration tests passed** (+19 new tests across `service.test.ts`, `dashboard.test.ts`, and `dashboard-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 routes cleanly (`/dashboard` dynamic server component, 9.74 kB)

### Hand-off notes for Phase 19 (History)

- Dashboard landing surface is complete, tested, and verified.
- History audit feed and filters completed below.

---

## 2026-09-25 — Phase 19: History (`/history`)

### Context & Scope

Phase 19 implements the authoritative dose action audit log `/history` according to plan §11.10 and §19:
1. **Validation Schema:** Created `src/shared/validations/history.ts` specifying `historyQuerySchema` with `from`, `to`, `medicationId`, `action` ("all" | DOSE_ACTION_TYPES), `limit`, and `cursor`.
2. **Server Domain Service:** Created `src/server/domain/doseActions/history.ts` with `queryDoseHistory` implementing:
   - Full inner-join across `dose_actions`, `dose_events`, and `medications`.
   - Exact filter predicates for date boundaries, medication IDs, and action types.
   - Base64 cursor encoding and decoding (`encodeHistoryCursor`, `decodeHistoryCursor`) supporting deterministic keyset pagination on `(occurredAt, id)`.
   - Accurate total matched count computation across filtered records.
   - Preservation of soft-deleted medication details (`archivedAt` snapshot) ensuring zero history loss on medication archive.
3. **tRPC Router:**
   - Created `src/server/trpc/routers/history.ts` with procedure `history.query`.
   - Registered `history: historyRouter` in `src/server/trpc/routers/aadhi.ts` (automatically spread to `appRouter`).
4. **UI Components (`src/features/history/`):**
   - `types.ts`: Filter states (`DateRangePreset`, `ActionFilterOption`, `HistoryFilterState`).
   - `FilterBar.tsx`: Sticky toolbar with horizontal scrollable filter chips on mobile and inline dropdowns on desktop (All Time, Today, 7D, 30D, 90D range presets; All, Taken, Snoozed, Skipped, Missed action filters; medication selector; reset button).
   - `HistoryRowMenu.tsx`: Contextual dropdown menu per row for viewing medication details, navigating to dose schedule, or copying event information to clipboard.
   - `HistoryTimeline.tsx`: Grouped chronological timeline by local day with day headings, action count pills, `ListRow` rows with action-specific icon tiles, late dose badges, archived medication badges, reason/snooze metadata, and infinite "Load More Entries" button.
   - `HistoryPage.tsx`: Client controller utilizing `api.history.query.useInfiniteQuery` for smooth cursor pagination and `api.medication.list` for medication filter population.
5. **App Routing:**
   - Updated `src/app/(app)/history/page.tsx` with user authentication check and rendered `HistoryView`.

### Architecture & Design Decisions

- **Deterministic Keyset Cursor Pagination:** Implemented base64 timestamp+id cursors to avoid offset performance degradation and offset drift as new doses are logged.
- **Permanent Audit Trail Safety:** Historical events join against `medications` which uses soft-deletion (`archivedAt`), ensuring that even when medications are paused or archived, past intake records retain full fidelity with appropriate badges.
- **Zero Hex Literals:** All components strictly use Tailwind classes and semantic design tokens in compliance with project ESLint rules.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **43 test files, 300 unit & integration tests passed** (+16 new tests across `history.test.ts` service, `history.test.ts` router, and `history-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 28 routes cleanly (`/history` dynamic server component, 6.53 kB)

### Hand-off notes for Phase 20 (Reports)

- History audit trail and interactive filter surface are complete, tested, and verified.
- Hand-off completed into Phase 20.

---

## 2026-09-25 — Phase 20 (Reports domain + UI + CSV export)

### Summary of changes

1. **Domain Models & Shared Types:**
   - Extended `ReportDTO` in `src/shared/types.ts` with `summary: ReportSummaryStats` (total scheduled, taken, missed, skipped, overall adherence rate) and `missedAnalysis: ReportMissedAnalysis` (time-of-day bucket distribution and per-medication breakdown).
   - Reused existing schemas in `src/shared/validations/reports.ts` (`reportsBaseSchema`, `reportsSchema`).
2. **Server Domain Reporting Service (`src/server/domain/reports/service.ts`):**
   - Built `getReportData`: Queries canonical metrics from `getAdherenceSummary` (guaranteeing 100% adherence calculation parity with dashboard and adherence features) and `getMedicationPerformance`.
   - Aggregates daily adherence series into `ReportRow[]` based on granularity:
     - `daily`: exact day-level rows (`YYYY-MM-DD`).
     - `weekly`: ISO week grouping (`YYYY-Www`).
     - `monthly`: month grouping (`YYYY-MM`).
   - Builds trend points (`ReportTrendPoint[]`) for data visualization.
   - Built `generateReportCsv`: Formats report rows into RFC 4180 standard CSV (`Period,Scheduled,Taken,Missed,Skipped,Adherence Rate`) with proper escaping for delimiters and quotes.
3. **tRPC Reports Router (`src/server/trpc/routers/reports.ts`):**
   - Protected procedure `reports.get` with `reportsSchema` input validation.
   - Registered in `src/server/trpc/routers/bala.ts` per the BALA track reporting designation, joining `appRouter` in `src/server/trpc/root.ts`.
4. **CSV Export Route Handler (`src/app/api/reports/export/route.ts`):**
   - Authenticated GET route handler verifying session with `auth.api.getSession`.
   - Parses query parameters (`from`, `to`, `granularity`, `medicationId`) with `reportsSchema`.
   - Streams CSV attachment with headers `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="medvault-report-..."`.
5. **UI Components (`src/features/reports/`):**
   - `types.ts`: Filter and table sorting state types.
   - `GranularityTabs.tsx`: Accessible pill selector for Daily, Weekly, and Monthly intervals with active indicator.
   - `DownloadButton.tsx`: Async export action triggering browser CSV download from `/api/reports/export` with toast notification on network/server errors.
   - `SummaryTable.tsx`: Sortable period table with adherence badges, formatted period labels, and mobile horizontal scroll.
   - `TrendChartBlock.tsx`: Area trend chart visualizing compliance percentage curve over reporting intervals.
   - `MissedAnalysis.tsx`: Multi-dimensional analysis displaying time-of-day distribution (Morning, Afternoon, Evening, Night) with progress indicators and ranked per-medication missed dose breakdown cards.
   - `ReportsPage.tsx`: Primary reports view integrating `RangePicker`, medication scope dropdown, granularity tabs, KPI summary cards (Adherence, Scheduled, Taken, Missed, Skipped), trend chart, missed dose analysis, and granular audit table.
6. **App Route:**
   - Updated `src/app/(app)/reports/page.tsx` with `requireUser()` auth guard and rendered `ReportsView`.

### Architecture & Design Decisions

- **Single Calculation Engine Parity:** Report figures originate directly from `getAdherenceSummary`, ensuring exact numeric parity across the dashboard, adherence views, and clinical export sheets.
- **RFC 4180 CSV Standard Compliance:** Streamed CSV uses CRLF (`\r\n`) line terminations and standardized quote escaping for seamless consumption by external EHRs and spreadsheet software.
- **Zero Hex Literals:** All UI elements use Tailwind utility classes and CSS theme variables (`var(--primary)`, `bg-card`, etc.) in compliance with project ESLint rules.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **47 test files, 323 unit & integration tests passed** (+23 new tests across `service.test.ts`, `reports.test.ts` router, `reports-view.test.tsx`, and `route.test.ts`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 29 routes cleanly (`/reports` dynamic server component, 6.65 kB; `/api/reports/export` dynamic route handler)

### Hand-off notes for Phase 21 (Caregiver System)

- Reports domain, analytics, and CSV streaming are complete and verified.
- Phase 21 will implement the caregiver system:
  - Domain service in `src/server/domain/caregiver/service.ts` (invitations, acceptance, permissions, revoking, alert generation).
  - tRPC routers for patient and caregiver scopes.
  - UI components in `src/features/caregiver/` (`InviteForm`, `AcceptInvite`, `RelationshipList`, `PermissionsEditor`, `AlertFeed`, `CaregiverOverview`).
  - Routes `/caregiver`, `/caregiver/accept`, `/caregiver/alerts/[id]`.

---

## Phase 21 — Caregiver System: Domain + Flows + UI (Completed 2026-09-25)

### Summary of Accomplishments

1. **Domain Service (`src/server/domain/caregiver/service.ts`):**
   - Implemented full caregiver lifecycle:
     - `inviteCaregiver`: creates cryptographically secure invitation token, sets 7-day expiration, serializes `permissions` and `relationType` to metadata, and revokes prior pending invites to the same email.
     - `listPatientInvitations`, `revokeInvitation`, `getInvitationByToken`: handles invitation lifecycle queries and safe revocations.
     - `acceptInvitation`: validates and redeems invitation tokens, enforces self-invite prevention, transitions existing revoked/declined relations or inserts new active relationship records.
     - `listPatientCaregivers`, `listMonitoredPatients`: returns active relationships with joined profile details.
     - `updateCaregiverPermissions`: updates permission flags (`viewAdherence`, `viewMedications`, `receiveMissedDoseAlerts`, `receiveInsights`, `canAcknowledgeAlerts`) scoped to patient ownership.
     - `revokeRelationship`: patient or caregiver self-revocation with relationship status transition to `revoked`.
     - `listCaregiverAlerts`, `getCaregiverAlert`, `updateAlertStatus`: manages alert status progression (`new` -> `acknowledged` -> `resolved`) with permission verification (`canAcknowledgeAlerts`).
     - `createMissedDoseAlerts`: seam consumer invoked by Phase 13 `runMissedDoseHandlers` during dose reconciliation, deduplicating alerts by `(caregiverUserId, doseEventId)` and filtering by `receiveMissedDoseAlerts`.
     - `getMonitoredPatientOverview`: permission-gated patient summary computing adherence stats via `getAdherenceSummary`, listing today's doses (with medication redaction if `viewMedications` is false), and active alerts.
2. **tRPC Router (`src/server/trpc/routers/caregiver.ts`):**
   - Implemented comprehensive procedures for both patient and caregiver roles:
     - Patient actions: `invite`, `listInvitations`, `revokeInvitation`, `listCaregivers`, `updatePermissions`, `revokeCaregiver`.
     - Caregiver actions: `getInvitation`, `acceptInvitation`, `listPatients`, `patientOverview`, `listAlerts`, `getAlert`, `updateAlert`.
   - Registered missed dose listener: wired `registerMissedDoseHandlers(caregiverService.createMissedDoseAlerts)` directly into `src/server/domain/doseEvents/attachments.ts`.
   - Mounted `caregiver: caregiverRouter` on `hpRouter` in `src/server/trpc/routers/hp.ts`.
3. **UI Suite (`src/features/caregiver/`):**
   - `types.ts`: Tab unions (`overview`, `caregivers`, `invite`).
   - `PermissionsEditor.tsx`: Dialog enabling patients to toggle granular caregiver permissions with live mutation updates.
   - `InviteForm.tsx`: RHF + Zod form generating sharable invite links with one-click clipboard copying and toast notifications.
   - `RelationshipList.tsx`: Displays active caregivers (with permissions summary, edit modal, and revocation dialog) and pending invitations (with copy link and cancellation actions).
   - `AlertFeed.tsx`: Filterable feed (`all`, `new`, `resolved`) with instant Acknowledge/Resolve actions and deep links to alert details.
   - `AlertDetailPage.tsx`: Dedicated detail page on `/caregiver/alerts/[id]` rendering alert timeline, metadata context, and resolution actions.
   - `AcceptInvite.tsx`: Token redemption interface on `/caregiver/accept?token=...` displaying inviting patient metadata and one-click relationship activation.
   - `CaregiverOverview.tsx`: Caregiver hub with multi-patient switcher dropdown, adherence KPI metrics, daily dose schedule (respecting medication privacy gating), and alert feed.
   - `CaregiverPage.tsx`: Primary caregiver view switching seamlessly between "Monitored Patients" and "My Caregivers" tabs.
4. **App Routes:**
   - `src/app/(app)/caregiver/page.tsx`: auth-protected caregiver hub.
   - `src/app/(app)/caregiver/accept/page.tsx`: auth-protected token acceptance screen with redirect handling.
   - `src/app/(app)/caregiver/alerts/[id]/page.tsx`: auth-protected alert detail view.

### Architecture & Design Decisions

- **Strict Caregiver Authorization Boundary:** Caregiver access is strictly read-only for patient clinical data. Caregivers cannot mutate patient doses or medication schedules; mutations are limited to alert triage (`acknowledge`, `resolve`) and leaving relationships.
- **Privacy Gating (View Medications):** When `permissions.viewMedications` is false, patient medication names and dosages are redacted ("Medication", dosage `0`), preserving patient privacy while still providing adherence awareness.
- **Dose Reconciliation Alert Deduplication:** Missed dose alerts are strictly deduplicated by `(caregiverUserId, doseEventId)`, ensuring duplicate runs of dose reconciliation do not generate duplicate caregiver notifications.
- **Zero Hex Literals & Design System Parity:** Built with Tailwind CSS tokens, Base UI primitives with `nativeButton={false}` when wrapping Next.js `<Link>`, and clean responsive layouts.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **50 test files, 342 unit & integration tests passed** (+19 new tests across `service.test.ts`, `caregiver.test.ts` router, and `caregiver-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 29 routes cleanly (`/caregiver` 14.7 kB, `/caregiver/accept` 3.78 kB, `/caregiver/alerts/[id]` 3.63 kB)

### Hand-off notes for Phase 22 (Notifications)

- Caregiver system complete, fully tested, and integrated with the dose reconciliation engine.
- Phase 22 will implement the notifications system:
  - Notifications domain service (`src/server/domain/notifications/service.ts`): in-app notifications, channel routing, read/unread states, dismiss actions, preference gating.
  - tRPC notifications router (`notifications.list`, `notifications.markRead`, `notifications.markAllRead`, `notifications.getUnreadCount`, `notifications.preferences`).
  - UI components in `src/features/notifications/` (NotificationBell dropdown with real-time unread badge, NotificationsPage feed, filter tabs, action links).
  - Route `/notifications` and top header bell integration.

---

## Phase 22 — Notifications: Domain + Channels + Bell + Notification Center (Completed 2026-09-25)

### Summary of Accomplishments

1. **Validation Schemas (`src/shared/validations/notifications.ts`):**
   - Implemented Zod schemas for notification query and mutation operations:
     - `listNotificationsSchema`: tab filter (`all`, `dose`, `caregiver`, `ai`, `system`), `unreadOnly` boolean toggle, `limit` (1–50, default 20), and `cursor` (ISO string) for pagination.
     - `markReadSchema`: `notificationId` validated via `uuidSchema`.
     - `markAllReadSchema`: optional empty object for mass read reconciliation.
2. **Channel Delivery Abstraction (`src/server/domain/notifications/channels.ts`):**
   - Built provider-agnostic notification channel interface (`NotificationChannel`) with `name` and `deliver(db, payload)` contract.
   - `InAppNotificationChannel`: inserts rows into `notifications` database table, resilient to both direct driver execution and unit test mock builders.
   - `ConsoleNotificationChannel`: non-production development logger.
   - Extensible for future email, web push, and SMS dispatchers without altering business domain logic.
3. **Domain Service (`src/server/domain/notifications/service.ts`):**
   - `createNotification`: single-writer pipeline enforcing:
     - **Preference Gating:** checks `user_preferences.notificationPrefs` (`doseReminders`, `caregiverMissedAlerts`, `insights`); suppresses creation when disabled.
     - **Strict Entity Deduplication:** ensures only 1 notification row per `(userId, entityType, entityId, type)`, returning existing instances rather than duplicating records.
     - **Channel Dispatch:** forwards payload to all configured channels.
   - `createMissedDoseNotification`: listener for Phase 13 missed-dose seam, formatting medication name and dosage context.
   - `listNotifications`: filtered by category tab, unread flag, and cursor pagination ordered by `createdAt desc`.
   - `getUnreadCount`: fast count query on unread notifications for badge rendering.
   - `markRead`: updates individual notification `readAt` timestamp with user ownership verification.
   - `markAllRead`: batch updates all unread notifications for a user.
   - `deleteNotification`: dismiss action for notifications.
4. **Integration with Hooks & Caregiver System:**
   - Registered `createMissedDoseNotification` into `registerMissedDoseHandlers` from `src/server/domain/doseEvents/attachments.ts`.
   - Wired caregiver alert insertion in `src/server/domain/caregiver/service.ts` to dispatch `caregiver_alert` notifications to the caregiver user.
5. **tRPC Router (`src/server/trpc/routers/notifications.ts`):**
   - Implemented protected procedures: `notifications.list`, `notifications.unreadCount`, `notifications.markRead`, `notifications.markAllRead`.
   - Mounted `notifications: notificationsRouter` onto `hpRouters` in `src/server/trpc/routers/hp.ts`.
6. **UI Suite (`src/features/notifications/`):**
   - `types.ts`: Filter and grouping types (`NotificationFilterState`, `DayGroupedNotifications`).
   - `NotificationItem.tsx`: Visual notification cards with category icon tints (AlertTriangle, Pill, ShieldAlert, Sparkles, Bell), relative timestamp ("Just now", "5m ago", "2h ago"), unread indicator dot, target deep-links (`/schedule`, `/caregiver/alerts/[id]`, `/insights`, `/medications/[id]`), and quick mark-read actions.
   - `NotificationTabs.tsx`: Category selector tabs (All, Doses, Caregiver, AI Insights, System) and "Unread only" switch toggle.
   - `NotificationsPage.tsx`: Full notification center view grouping items by day ("Today", "Yesterday", "This Week", etc.), badge count, batch "Mark all as read" button, and contextual empty states ("You're all caught up!").
   - `NotificationBell.tsx` (`src/components/layout/NotificationBell.tsx`): Header notification bell with 30s background polling, window focus refetch, unread badge counter (`9+`), and accessible popover dropdown displaying the 5 most recent notifications with a link to `/notifications`.
7. **App Route:**
   - Updated `src/app/(app)/notifications/page.tsx` with `requireUser()` server auth guard and rendered `NotificationsView`.

### Architecture & Design Decisions

- **Strict Entity Deduplication:** Enforced at the domain service layer per `(userId, entityType, entityId, type)`, preventing duplicate notification spam when reconciliation or sync runs multiple times.
- **Unified Delivery Contract:** Decoupled business event triggers from physical delivery mechanisms via `NotificationChannel`, allowing future push/SMS integration without refactoring callers.
- **Zero Hex Literals:** All UI elements adhere to strict Tailwind classes and semantic theme variables.
- **Defensive Layout Integration:** Updated `app-shell.test.tsx` with tRPC notifications mock, ensuring layout tests pass without requiring live network or DB connections.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **53 test files, 366 unit & integration tests passed** (+24 new tests across `service.test.ts`, `notifications.test.ts` router, and `notifications-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 29 routes cleanly (`/notifications` dynamic server component, 9.76 kB)

### Hand-off notes for Phase 23 (AI Insights)

- Notifications system complete, fully tested, and integrated with the dose reconciliation engine, caregiver alerts, and layout bell.
- Hand-off completed in Phase 23.

---

## Phase 23 — AI Insights: Domain + Service + UI (Completed 2026-09-25)

### Summary of Accomplishments

1. **Validation Schemas (`src/shared/validations/insight.ts`):**
   - Implemented Zod schemas for structured AI generation and listing:
     - `singleInsightSchema`: validates category (`INSIGHT_CATEGORIES`), summary (5–300 chars), detail (optional max 1000 chars), suggestedActionType (`SUGGESTED_ACTIONS`), and confidence score (0–1).
     - `insightResponseSchema`: structured output constraint enforcing 1–5 insights with a tone parameter (`encouraging` | `neutral`).
     - `listInsightsSchema`: validates query limit (1–50, default 20).
2. **Domain Service (`src/server/domain/insights/service.ts`):**
   - `buildSnapshot`: pure read-only analytics snapshot over the user's 30-day compliance history:
     - Overall adherence percentage, total scheduled, taken, missed, and skipped doses.
     - Current and longest adherence streaks.
     - Rolling 7-day adherence trend (`improving` | `declining` | `stable`).
     - Time-of-day bucket distribution (`morning`, `afternoon`, `evening`, `night`).
     - Per-medication adherence performance.
     - Recent snooze count across the period.
   - `BEHAVIORAL_SYSTEM_PROMPT`: strict safety instructions prohibiting diagnostic conclusions, treatment prescriptions, or medication changes; strictly bounds guidance to habit timing, routine pairing, and reminder adjustments.
   - `generateFallbackInsights`: deterministic rule engine analyzing bucket timing frictions (<85%), snooze frequency (>=3), streak milestones (>=3) / decline warnings, and medication variance.
   - `generateInsights`: server-side LLM provider execution with fallback safety to deterministic rules when keys are missing or calls fail. Persists to `ai_insights`, emits `insight` in-app notifications, and automatically prunes historical rows beyond the 20 most recent entries.
   - `listInsights`: ordered reverse-chronological list query for user insights.
   - `getLatestInsight`: single most recent insight query for dashboard and widget preview.
3. **tRPC Router (`src/server/trpc/routers/insights.ts`):**
   - Implemented protected procedures: `insights.list`, `insights.latest`, and `insights.regenerate`.
   - Mounted on `hpRouters` in `src/server/trpc/routers/hp.ts` (respecting zero-touch rule on `root.ts`).
4. **UI Suite (`src/features/insights/`):**
   - `InsightCard.tsx`: Glassmorphism cards with category badges, dynamic source tags (`AI Generated` with Sparkles vs `Pattern Analysis` with Brain), confidence score, relative timestamps, sanitized plain-text summaries/details, and contextual suggested action buttons (`/schedule`, `/settings/reminders`, `/caregiver`, `/adherence`).
   - `RegenerateButton.tsx`: Interactive trigger with loading animation spinner and cache invalidation (`insights.list`, `insights.latest`, `dashboard.get`).
   - `InsightsPage.tsx`: Full responsive 1/2 column grid, non-diagnostic behavioral guidance disclaimer banner, animated skeleton loading state, error retry state, and empty state.
   - `InsightWidget.tsx`: Enhanced dashboard widget with dynamic source tag reflection.
5. **App Route:**
   - Updated `src/app/(app)/insights/page.tsx` auth-guarded with `requireUser()` and metadata.

### Architecture & Design Decisions

- **Strict Behavioral Safety Boundary:** System prompt and Zod schema prevent medical diagnoses or prescription changes.
- **Compile & Test Boundary:** Insight generator is verified to never mutate medications, schedules, or dose events.
- **Dual-Source Architecture:** Seamless transition between AI-generated insights and deterministic pattern analysis.
- **Automatic Pruning:** Retains the latest 20 insights per user.
- **Zero Hex Literals:** 100% Tailwind semantic classes and CSS variables.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **56 test files, 390 unit & integration tests passed** (+24 new tests in `service.test.ts`, `insights.test.ts`, and `insights-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 29 routes cleanly (`/insights` 5.33 kB)

### Hand-off notes for Phase 24 (Settings)

- AI Insights complete, fully tested, bounded, and integrated with the dashboard, notification system, and `/insights` page.
- Hand-off completed in Phase 24.

---

## Phase 24 — Settings: Profile / Reminders / Caregiver / Appearance / Data (Completed 2026-09-25)

### Summary of Accomplishments

1. **Validation Schemas (`src/shared/validations/settings.ts`):**
   - Implemented Zod schemas for settings and governance:
     - `profileSchema` & `updateProfileSchema`: validates name (2–100 chars), email (emailSchema), and timezone (valid IANA timezone via timezoneSchema).
     - `reminderSettingsSchema` & `updateRemindersSchema`: validates `missedAfterMinutes` (5–120), `snoozeMinutes` (1–60), `maxSnoozes` (0–10), `reminderBeforeMinutes` (0–60), `notificationPrefs` (doseReminders, caregiverMissedAlerts, insights, sounds), `caregiverAlertPrefs`, and `perMedicationReminders` array.
     - `caregiverAlertPrefsSchema` & `updateCaregiverPrefsSchema`: validates `missedDoseOn` (boolean), `adherenceDropThreshold` (0–100 nullable), and `dailyDigest` (boolean).
     - `appearanceSchema` & `updateAppearanceSchema`: validates `theme` (THEMES: light, dark, system), `uiDensity` (UI_DENSITIES: comfortable, compact), and `reduceMotion` (boolean).
     - `deleteDataSchema` & `deleteAccountSchema`: strict typed confirmation literals (`"DELETE ALL DATA"` and `"DELETE MY ACCOUNT"`).
2. **Domain Service (`src/server/domain/settings/service.ts`):**
   - `getProfile` & `updateProfile`: fetches user profile record and updates display name and timezone.
   - `getReminderSettings` & `updateReminderSettings`: combines `user_preferences` thresholds with active user medications and updates global reminder windows plus individual `remindersEnabled` flags.
   - `updateCaregiverAlertPrefs`: persists caregiver notification preferences to `user_preferences`.
   - `updateAppearance`: updates `theme`, `uiDensity`, and `reduceMotion` on `user_preferences`.
   - `getDataOverview`: aggregates record counts across medications, dose events, AI insights, notifications, and connected caregiver relationships.
   - `exportData`: bundles user profile, medications, dose events, schedules, and insights into structured export payload with ISO timestamp.
   - `deleteAllData`: transactionally clears dose events, schedules, medications, insights, notifications, caregiver links, and resets preferences back to default while keeping user account intact.
   - `deleteAccount`: wipes all clinical records and deletes `users` row, cascading Better-Auth sessions and accounts.
3. **tRPC Router (`src/server/trpc/routers/settings.ts`):**
   - Implemented protected procedures: `getProfile`, `updateProfile`, `getReminders`, `updateReminders`, `getPreferences`, `updateCaregiverPrefs`, `updateAppearance`, `getDataOverview`, `exportData`, `deleteAllData`, `deleteAccount`.
   - Mounted onto `balaRouters` in `src/server/trpc/routers/bala.ts`.
4. **UI Suite (`src/features/settings/`):**
   - `ProfileForm.tsx`: display name editing, verified email badge, IANA timezone dropdown, dirty-state detection, and save trigger.
   - `ReminderSettings.tsx`: threshold inputs with quick preset pills (15m, 30m, 45m, 60m; 5m, 10m, 15m, 20m; 1x, 2x, 3x, 5x; exact, 5m, 10m, 15m), notification channel switches (doses, caregiver alerts, insights, sounds), and per-medication reminder toggles.
   - `CaregiverSettings.tsx`: missed dose alerts toggle, daily digest toggle, and network link to `/caregiver`.
   - `AppearancePanel.tsx`: light, dark, and system theme cards with instant DOM theme reflection (`document.documentElement.classList`), system media query listener, UI density selector, reduce motion toggle, and real-time live preview card.
   - `DataOverview.tsx`: vault summary grid displaying record counts and client data isolation assurance.
   - `ExportButtons.tsx`: client-side generation and downloading of `medications.csv`, `dose-events.csv`, and full `medvault-full-backup.json`.
   - `DeleteFlow.tsx`: Danger Zone with accessible modal dialogs requiring exact typed phrases (`"DELETE ALL DATA"` and `"DELETE MY ACCOUNT"`), sign-out integration, and redirection.
5. **App Routes (`src/app/(app)/settings/`):**
   - Replaced phase stubs with feature implementations across `/settings/profile`, `/settings/reminders`, `/settings/caregiver`, `/settings/appearance`, and `/settings/data`.
   - Root `/settings/page.tsx` redirects cleanly to `/settings/profile`.

### Architecture & Design Decisions

- **Typed Confirmation Phrase:** Follows plan §1294 requiring exact phrase typing (`"DELETE ALL DATA"` / `"DELETE MY ACCOUNT"`) before enabling destructive wipe operations.
- **Instant Reactive Theme Reflection:** Changes to theme instantly update `<html>` class with media query fallback while optimistically persisting to database preferences.
- **Dual-Table CSV & JSON Portability:** Exports cleanly formatted CSVs for spreadsheets and full JSON dump for complete vault backup.
- **Zero Hex Literals:** 100% Tailwind tokens and CSS variables.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **59 test files, 412 unit & integration tests passed** (+22 new tests in `service.test.ts`, `settings.test.ts`, and `settings-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 29 routes cleanly (`/settings/profile` 3.74 kB, `/settings/reminders` 4.4 kB, `/settings/caregiver` 3.14 kB, `/settings/appearance` 3.47 kB, `/settings/data` 7.12 kB)

### Hand-off notes for Phase 25 (Demo Mode)

- Settings domain and all 5 sub-routes complete, verified, and integrated.
- Hand-off completed in Phase 25.

---

## Phase 25 — Demo Mode: Domain + Seed Reuse + UX (Completed 2026-09-25)

### Summary of Accomplishments

1. **Validation Schemas (`src/shared/validations/demo.ts`):**
   - Implemented Zod schemas for interactive simulation operations:
     - `simulateActionSchema`: validates action (`"take" | "miss" | "skip" | "snooze"`), optional `doseId`, and optional `skipReason`.
     - `applyScenarioSchema`: validates scenario (`"baseline" | "decline" | "improvement" | "caregiver_demo"`).
     - `setTimeSchema`: validates `time` (ISO datetime string or null to reset to real-time).
2. **Domain Service (`src/server/domain/demo/service.ts`):**
   - `getDemoUser`: resolves persistent Arun Kumar demo user (`arun@medvault.local`), auto-seeding pristine dataset if absent.
   - `getDemoState`: fetches or initializes isolated `demoStates` record for simulation overrides (`simulationNow`, `scenario`, `timeMultiplier`).
   - `enterDemo` & `leaveDemo`: session entry and departure helpers adhering to `medvault_demo_session` cookie specification.
   - `resetDemo`: transactionally restores the Arun Kumar §19 baseline dataset (84 doses, 76 taken, 5 missed, 3 skipped, 8 snoozed, 90.5% adherence, 7-day streak) and resets `demoStates`.
   - `setTime`: writes `simulationNow` to `demoStates`, enabling full temporal shifting across all domain calculations.
   - `simulateAction`: mutates target or next-due dose event with action ("take", "miss", "skip", "snooze") and writes corresponding audit record to `doseActions` with `occurredAt` and `meta`.
   - `applyScenario`: applies scenario blocks (baseline, decline, improvement, caregiver_demo) to recent dose events.
   - `generateCaregiverAlert`: connects Dr. Priya Patel (`dr.patel@medvault.demo`) with active doctor relationship (`relationType: "professional"`), records missed dose, creates `caregiverAlerts` row, and dispatches in-app notification.
   - `generateDemoInsight`: executes behavioral AI insight pipeline on the demo dataset with deterministic fallback safety.
3. **Session & Clock Indirection (`src/server/trpc/context.ts` & `src/server/auth/require-user.ts` & `src/shared/times.ts`):**
   - Threaded `medvault_demo_session` cookie and `/demo` referer through `createContext` so unauthenticated evaluators can access all protected tRPC procedures bound to Arun Kumar's demo record without login credentials.
   - Wired `setNowImpl` in `createContext` to reflect `demo_state.simulationNow` across all date-time calculations dynamically (`now()` in `times.ts`).
   - Updated `requireUser` to allow seamless navigation across all app sections when demo mode is active.
4. **tRPC Router (`src/server/trpc/routers/demo.ts`):**
   - Implemented public procedures: `getState`, `enter`, `leave`, `reset`, `setTime`, `simulate`, `applyScenario`, `generateAlert`, `generateInsight`.
   - Mounted onto `hpRouters` in `src/server/trpc/routers/hp.ts` (respecting zero-touch rule on `root.ts`).
5. **UI Suite (`src/features/demo/`):**
   - `DemoDock.tsx`: Floating live simulation dock with quick dose action buttons (Take, Miss, Skip, Snooze), collapsed/expanded drawer toggle, shortcuts to trigger caregiver alerts and AI insights, and seed reset button.
   - `DemoClock.tsx`: Simulation clock controller with manual time-shift jumps (-1d, -4h, +4h, +1d) and instant clock reset.
   - `ScenarioControl.tsx`: Interactive scenario tiles (Baseline 90.5%, Missed Adherence, Full Recovery, Caregiver Triage).
   - `ResetButton.tsx`: Quick trigger to restore pristine §19 seed.
   - `DemoShell.tsx`: Persistent top demo indicator banner with live badge, Arun Kumar profile context, quick reset, and exit button, wrapping `AppShell` with the demo user.
6. **App Routes (`src/app/demo/`):**
   - `src/app/demo/layout.tsx`: Force-dynamic layout wrapping child routes in `DemoShell` with `ProfileMenuUser` demo user and `DemoDock`.
   - `src/app/demo/page.tsx`: Force-dynamic demo landing page rendering the full live `DashboardView`.

### Architecture & Design Decisions

- **Complete Tenant Isolation:** Dedicated demo user (`isDemo = true`) ensures all seed data, mutations, time shifts, and alerts are isolated to Arun Kumar and never touch real user accounts.
- **Zero-touch Immutable Root:** Mounted on `hpRouters` in `src/server/trpc/routers/hp.ts`.
- **Zero Hex Literals:** 100% Tailwind tokens and semantic styling variables.
- **Live Reactive Dashboard:** All simulation actions immediately invalidate tRPC queries (`dashboard.get`, `dose.today`, `adherence.summary`), causing the UI to update in real time.

### Verification (all green)

- `pnpm typecheck` — clean (0 errors)
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — **62 test files, 448 unit & integration tests passed** (+36 new tests across `service.test.ts`, `demo.test.ts`, and `demo-view.test.tsx`, 0 regressions, 4 skipped DB tests without credentials, as designed)
- `pnpm build` — successfully compiled all 29 routes cleanly (`/demo` 167 B / 314 kB)

### Hand-off notes for Phase 26 (Global states, accessibility & responsive refinement)

- Demo mode complete, verified, and ready for college presentation and evaluation.
- Phase 26 will execute a global sweep across all shipped pages:
  - Error boundaries (`error.tsx`), loading skeletons (`loading.tsx`), empty states, and not-found handling (`not-found.tsx`).
  - Accessibility pass: focus-visible rings, ARIA landmarks and live regions, screen reader announcements, contrast verification, skip navigation links, and `prefers-reduced-motion` adherence.
  - Responsive audit across 1280px, 1024px, 768px, and 390px viewport breakpoints.






