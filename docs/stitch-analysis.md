# Stitch Export Analysis — `Landingpage/`

> Phase 01 deliverable. This document is the **verified, line-anchored inventory** of the
> Stitch-generated landing page export. It is read-only proof that plan.md §2/§5/§6 match the
> real source. `Landingpage/` was only read for this analysis — **no files were modified.**
>
> Status: verified against the working tree on 2026-09-24 (commit `621377a` + `7d8e76e`).

---

## 1. Method

1. Enumerated the full tracked tree (`git ls-files`) plus ignored artifacts present on disk.
2. Read every source file end-to-end (`App.jsx` 1304 lines, `mobile.jsx`, `HeroVisual.jsx`,
   `FloatingCard.jsx`, `MedVaultAuthIllustration.jsx`, `MedVaultPhoneSection.jsx`,
   `index.css`, `App.css`, `index.html`, `main.jsx`, `package.json`, `vite.config.js`).
3. Built the **import graph** (who requires whom) to determine what actually executes at runtime.
4. Built the **asset reference graph** (which `public/` files are actually loaded) and
   computed MD5s to detect duplicates.
5. Extracted every hex color / rgba / gradient / font-family from the source and
   spot-checked the plan §5 token table against it (see §7: two tokens are NOT in the export).
6. Mapped every §5.2/§5.3/§5.4/§5.5 recipe and every §6 screen to exact source locations.

## 2. Repository snapshot (verified)

- Two commits on `main`:
  - `621377a` — "Add MedVault landing page" (all of `Landingpage/`)
  - `7d8e76e` — "Add MediTrack AI implementation plan (plan.md)"
- Tracked files: **34** (33 in `Landingpage/`, 1 root `plan.md`).
- On disk but **ignored/untracked** (never port, never reference at runtime):
  `Landingpage/node_modules/`, `Landingpage/dist/` (stale build, 10 files / 1.8 MB),
  `Landingpage/.vscode/` (launch.json — editor config).
- Empty root: no Next.js application code exists yet; product code is greenfield (root is where
  the Next app will live per plan §4.1).

> Corrections to the plan's original §2 prose (before this Phase 01 pass):
> 1. There are now **two** commits, not one.
> 2. `MedVaultAuthIllustration.jsx` and `MedVaultPhoneSection.jsx` live at **`Landingpage/` root**,
>    **not** under `src/`. `App.jsx` imports the former as `../MedVaultAuthIllustration`.
> 3. `MedVaultPhoneSection.jsx` and `FloatingCard.jsx` are **not imported anywhere** —
>    standalone compositions (reference-only / recipe source), not runtime code.
> 4. Not every asset under `public/` is "used by the landing page" (see §5).

## 3. File inventory (tracked tree, verified)

Classification legend:

| Code | Meaning |
|---|---|
| **P** | **Port** into the Next app. Source of truth for that UI surface / recipe. |
| **R** | **Reference** only. Config/wiring of the Vite build — informs the Next setup, not ported. |
| **L** | **Leftover** Vite template / not part of the design. Ignore; do not port. |
| **A** | **Asset stash** — present in the repo but referenced by **no** runtime code. Decide later. |
| **D** | **Duplicate** — byte-identical (MD5) to another tracked asset. |
| **S** | **Stray** — scratch/out-of-band file, no design value. |

| Path | Bytes | Lines | Class | Role / note |
|---|---|---|---|---|
| `index.html` | 363 | 12 | R | Vite shell; `<title>landingpage`; links `/favicon.svg` (the leftover bolt — replace with the brand tile in Next). |
| `package.json` | 736 | 31 | R | deps: `react 19.2.4`, `framer-motion ^12.38.0`, `lucide-react ^0.453.0`; dev: `vite ^8`, `tailwindcss ^4.2.2` via `@tailwindcss/vite`. |
| `package-lock.json` | 103,448 | — | R | lockfile. |
| `vite.config.js` | 220 | 8 | R | plugins `[react(), tailwindcss()]` — the Tailwind v4 wiring proof for the Next globals.css approach. |
| `eslint.config.js` | 758 | — | R | Vite ESLint flat config. |
| `README.md` | 1,027 | 16 | L | Vite template README. |
| `.gitignore` | 253 | 24 | R | ignores `node_modules`, `dist`, `.vscode/*`, logs. |
| `src/main.jsx` | 229 | 10 | R | React 19 `createRoot` + `<StrictMode>`. Not ported (Next renders instead). |
| `src/App.jsx` | 64,507 | 1304 | **P** | The landing page. Single default export `MedVaultLanding`. Sections: helpers/mascots (49–268), dashboard-mockup components (270–538), `MedVaultLanding` main (540–1304): `#hero-setup` styles 623–692, **Nav** 694–747, **Hero** 749–876, **How It Works** 878–955, **Features × 3** 957–1070, **Trust** 1072–1083, **Final CTA** 1085–1148, **Footer** 1150–1219, **floating AI chat** 1221–1297. Hand-rolled `#auth` hash view-switch (544–575, 1299–1301) renders `MedVaultAuthIllustration` — replaced by real `/login`+`/register` routes in Next. |
| `src/App.css` | 2,891 | 184 | **L** | Vite template CSS (`.counter`, `.hero .base`, `#center`…). Unreferenced by design. |
| `src/index.css` | 2,145 | 112 | **L** | `@import "tailwindcss"` + template `:root` vars (`--accent:#aa3bff` = Vite purple, dark-mode block 35–53). **Ignore var block**; keep only the Tailwind import pattern for Next `globals.css`. |
| `src/mobile.jsx` | 14,620 | 401 | **P** | Phone mockup **part 1** (imported by `HeroVisual.jsx` only). CSS recipes 43–127; `PhoneScreen` (feed rows + bottom nav) 129–234; sparkle dots/stars 236–263; paralлах scene 265–400 (`useIsNarrow(768)` 4–14). |
| `src/components/HeroVisual.jsx` | 3,792 | 136 | **P** | Hero phone + 4 floating notification chips. `FloatingNotification` glass-chip recipe 18–82; chip instances 92–131. Imports `mobile.jsx`. |
| `src/components/FloatingCard.jsx` | 2,405 | 83 | **P**/R | Large glass-card recipe (`glass`/`glassLg` classes 16–20, icon-tile recipe 25–28). **Not imported at runtime** — recipe source for dashboard/insight glass cards. |
| `MedVaultAuthIllustration.jsx` (root) | 14,257 | 336 | **P** | **Auth split screen** — direct design reference for `/login`·`/register`. Eye icons 3–14; `iStyle` input recipe 26–40; styles 44–179 (`@media (min-width:900px)` .auth-left 59–67; `.btn-primary` 111–135; `.btn-google` 137–157; `.back-btn` 159–178); layout 181–336 (left image `/imagessss/login_page.jpeg`, right form: logo 214–228, headline 230–242, name/email/password 245–283, remember-me 285–294, primary CTA 297–302, OR + Google 304–313, mode toggle 316–325). |
| `MedVaultPhoneSection.jsx` (root) | 14,763 | 258 | **P**/R | Phone mockup **part 2** — floating glass cards composition. **Not imported anywhere** — reference-only composition that defines the floating-card/Snooze-pill/badge motif. CSS 4–121; phone 153–194; cards 196–254 (AI Insight c1, Report Upload c2, Medicine reminder c3, Report+snooze+8:00PM badge c4). |
| `src/Untitled` | 21 | 1 | **S** | Scratch text: `AI Analyzes Your Data`. Ignore. |
| `public/favicon.svg` | 9,522 | — | **L** | Purple Vite bolt (`#863bff`). Referenced only by `index.html` as the tab favicon; the design's favicon is the emerald→cyan `HeartPulse` tile. Replace in Next. |
| `public/icons.svg` | 5,031 | — | **L** | Vite social sprite (`bluesky-icon` etc.). Unreferenced. Ignore. |
| `public/how-it-works/ai-doctor.png` | 189,206 | — | **P** | Referenced: `src/App.jsx:192` (`AIRobotReadingMascot`). |
| `public/how-it-works/prescription.png` | 711,064 | — | **P** | Referenced: `src/App.jsx:172` (`PrescriptionMascot`). |
| `public/how-it-works/reminders-mobile.png` | 392,688 | — | **P** | Referenced: `src/App.jsx:219` (`ReminderMascot`). |
| `public/imagessss/login_page.jpeg` | 349,470 | — | **P** | Referenced: `MedVaultAuthIllustration.jsx:187` (auth left panel image). |
| `public/hero/hero-art.png` | 51,224 | — | A | **Unreferenced** by all JSX/CSS. |
| `public/hero/hero-phone-mockup.png` | 95,652 | — | A | **Unreferenced** by all JSX/CSS. |
| `public/images/hero-final.png` | 5,292,372 | — | **D** | MD5 `6A0AF277…` — identical to root `Gemini_Generated_Image_jr77vyjr77vyjr77.png`. Unreferenced. |
| `public/images/mascots-team.png` | 60,442 | — | A | **Unreferenced** (all mascots are inline SVG/TSX in `App.jsx`). |
| `Gemini_Generated_Image_jr77vyjr77vyjr77.png` (root) | 5,292,372 | — | **D** | == `public/images/hero-final.png`. Unreferenced. |
| `imagessss/login_page.jpeg` (root) | 349,470 | — | **D** | MD5 `5140E0E3…` — identical to `public/imagessss/login_page.jpeg`. |
| `imagessss/login ku.png` (root) | 1,120,557 | — | A/S | **Unreferenced** screenshot of the login screen. |
| `src/assets/hero.png` | 44,919 | — | **L** | Vite template asset. Unreferenced. |
| `src/assets/react.svg` | 4,126 | — | **L** | Vite template asset. Unreferenced. |
| `src/assets/vite.svg` | 8,709 | — | **L** | Vite template asset. Unreferenced. |

## 4. Import graph (verified)

```
src/main.jsx ──> src/App.jsx ──> ./components/HeroVisual.jsx ──> ../mobile.jsx
                             └─> ../MedVaultAuthIllustration.jsx   (root, "__"/"__")
src/components/FloatingCard.jsx   (imported by NOBODY — recipe only)
MedVaultPhoneSection.jsx          (imported by NOBODY — composition reference only)
```

- Runtime code of the landing page = `App.jsx` + `HeroVisual.jsx` + `mobile.jsx` +
  `MedVaultAuthIllustration.jsx` (when `#auth`).
- `FloatingCard.jsx` and `MedVaultPhoneSection.jsx` are isolated design artifacts; they are
  still tracked and **must not be deleted** (plan §1) and are the source for the glass-card and
  floating-snooze-card recipes.

## 5. Asset usage map (verified)

| Asset | Referenced by | Action for Next |
|---|---|---|
| `/how-it-works/ai-doctor.png` | `App.jsx:192` | port → `public/landing/how-it-works/ai-doctor.png` |
| `/how-it-works/prescription.png` | `App.jsx:172` | port |
| `/how-it-works/reminders-mobile.png` | `App.jsx:219` | port |
| `/imagessss/login_page.jpeg` | `MedVaultAuthIllustration.jsx:187` | port → `public/auth/login-page.jpeg` (rename; `imagessss` is a Stitch typo dir) |
| `public/hero/*`, `public/images/mascots-team.png`, root `Gemini_Generated_*`, root `imagessss/*` | none | Do **not** port (except `images/hero-final.png` — see note) |
| `src/assets/*`, `public/favicon.svg`, `public/icons.svg` | template only | exclude |

> Note: `images/hero-final.png` (= the Gemini image) is a 5.3 MB full-hero illustration that is
> not wired up anywhere. If a marketing asset is needed later, reuse it; otherwise leave it out
> of the Next `public/`. Phase 04 keeps the runtime DOM identical, so none of the currently-unused
> assets are required.

## 6. Per-file notes & porting decisions

### `src/App.jsx` — the port blueprint
Convert inline-style JSX to the token/class system where practical but **keep the visual
identical**. The `<style>` block 623–692 holds the must-keep recipes (`cta-primary` 635–644,
`cta-ghost` 645–652, `nav-login` 653–654, `.dot-grid` 655–658, `.nav-link` 659–691,
`#10b98115/#10b98130` static pill 677–678, `@keyframes` float/shadowPulse/pulse/gradShift/
fadeUp/spin/slideIn 628–634). The remote `@import` of Plus Jakarta Sans (line 624) is replaced
by `next/font/google`.

Section → component for `src/features/landing/`:

| App.jsx lines | Inline block | Next component |
|---|---|---|
| 49–224 | `DoctorMascot`/`RobotMascot`/`NurseMascot`/`PrescriptionMascot`/`AIRobotReadingMascot`/`ReminderMascot` + `@keyframes float` | `mascots.tsx` (SVG-in-TSX; `Prescription`/`AIRobot`/`Reminder` are image wrappers) |
| 226–268 | `ScrollingServices` (services `["Medical Reports","Reminders","AI Insights","Nearby Services"]`, 2.8 s interval) | `ScrollingServices.tsx` |
| 694–747 | **Nav** (68 px fixed; logo 709–720; center links hidden <769 `window.innerWidth<768` 731; Log In 738; Create Vault 739–745) | `Nav.tsx` |
| 749–876 | **Hero** (gradient 755; dot-grid 757; blobs 760–761; H1 773–787; para 789–797; ScrollingServices 799–818; CTAs 820–836; avatar stack 839–859; HeroVisual 862–874) | `Hero.tsx` |
| 878–955 | **How It Works** (3 step cards, `repeat(3,1fr)` grid **does not collapse on mobile** 893–899; step colors `#14b8a6`,`#06b6d4`,`#8b5cf6` 906/911/920) | `HowItWorks.tsx` |
| 957–1070 | **Features** — F1 `FeatureMedicalRecords` 338–399 (glass record cards), F2 `FeatureSmartReminders` 401–457 (scrolling phone), F3 `FeatureFindCare` 459–538 (map pins + hospital chip) | `Features.tsx` + 3 sub-components |
| 1072–1083 | **Trust** — `TestimonialCard` 303–329 (5 amber stars `#f59e0b`/`#f59e0b30` 313; avatars 316–321) | `Testimonials.tsx` |
| 1085–1148 | **Final CTA** (gradient 1088; dot pattern 1094–1098; white pill 1104–1108; white primary button 1120–1134; outline button 1135–1144) | `FinalCta.tsx` |
| 1150–1219 | **Footer** (`#0f172a` 1151; brand 1155–1160; 5-col grid 1152; social circles 1164–1168; link lists 1171–1202; contact 1204–1212; copyright 1215–1218) | `Footer.tsx` |
| 1221–1297 | **Floating AI chat** (FAB 1288–1296; panel header gradient `#10b981→#059669` + `Bot` + "MedVault AI" + "● Online · Replies instantly" `rgba(255,255,255,0.8)` 1233–1240; bot bubble `#f0fdf4` 1247). **Decorative** — becomes a link to `/help`. | `AiChatFab.tsx` (decorative → `/help`) |

The `#auth` state machine (544–575, 1299–1301) is removed; replaced by `<Link>/login`,`/register`,`/demo`.

### `src/components/HeroVisual.jsx` / `FloatingNotification`
Glass chip recipe (18–82): `rgba(255,255,255,0.9)` + `blur(14px)`, radius `22px`, padding
`14px 18px`, border `1px solid rgba(16,185,129,0.28)`, shadow `0 15px 40px rgba(15,23,42,0.1)
,0 5px 15px rgba(15,23,42,0.04)`, icon tile `42px radius 14 ${color}18` (`#10b98118` etc.),
title `13px/700 #0f172a`, sub `11px #64748b`, time `10px #94a3b8`, motion float `y:[0,-12,0]`
6 s. Chips: Med Reminder `#10b981`, Vitals `#ef4444`, Visit `#3b82f6`, Report Ready `#8b5cf6`.

### `src/components/FloatingCard.jsx` — glass-card recipe (reference)
Classes `glass` (16) / `glassLg` (20): `rounded-2xl` (**16 px**, not 18 — see §7 note),
`border white/30`, `bg-white/20`, `p-5/p-6`, shadow `0 20px 50px rgba(0,0,0,0.15)` /
`0 24px 55px rgba(0,0,0,0.16)`, `backdrop-blur-xl`; icon tile `h-12 w-12 rounded-2xl
bg-emerald-500/15 text-emerald-600`; title `font-bold text-slate-800`; body `text-slate-600`.

### `src/mobile.jsx` — phone mockup part 1
Key recipes (CSS 43–127): `mvp-phone-wrap` 280×572, `mvp-phoneFloat` 6 s `perspective(900px)
rotateY(-18deg)…`; outer `linear-gradient(160deg,#dde5e2,#bec8c4)` padding 4 radius 52; inner
`#0d1f1a` radius 50; screen `#f5fffe` radius 45 padding 16 14 0; notch 97×22; buttons
`#b0bcb8`; `mvp-sc-label` 12/700 `#0d1f1a` with `span{color:#10b981}` ("›"); `mvp-sc-row`
white radius 14 padding 10 13 border `0.5px solid #e2eeea`; `mvp-sc-ico` 32 radius 8 (blood-test
`#d1fae5` + `#10b981` stroke 138–152; appointment `#dbeafe` + `#3b82f6` 163–177); `mvp-sc-t`
12/700 `#0d1f1a`; `mvp-sc-s`/`mvp-sc-d` 10 `#9ab5ad`; `mvp-div` 0.5 `#e8f0ee`; bottom nav 64 px
white `border-top:0.5px solid #e8f0ee`; home tab filled `#10b981` + `.mvp-nav-dot` 4 px `#10b981`.

### `MedVaultPhoneSection.jsx` — phone mockup part 2 (composition reference)
`mvp-fc` floating cards 96–120: `rgba(255,255,255,0.88)` + `blur(14px)`, radius 18, border
`rgba(255,255,255,0.95)`, shadow `0 8px 32px rgba(16,185,129,0.13)`; `mvp-fc-ico` 40 px
`linear-gradient(135deg,#d1fae5,#a7f3d0)`; title 14/800 `#0d1f1a`; sub 11.5 `#6b8a82`;
badge 20/800 + `PM` 10 `#6b8a82`; **`mvp-snooze`** (line 115): `#10b981`, white 10/700,
`padding:3px 18px`, radius 6. Cards: `c1` AI Insight, `c2` Report Upload, `c3` Medicine
reminder "Take Paracetamol — 8:00 PM", `c4` Report + Snooze + `8:00 PM` badge.

### `MedVaultAuthIllustration.jsx` — auth screen (port for `/login`·`/register`)
Ports: `.auth-left` split (≥900 px `flex:1.1`, bg `#f8fafc`, cover image, bottom fade mask
192–196); `.auth-right` `flex:0.9`; scroll area w/ hidden scrollbar 77–87; content wrapper
`max-width:460px; padding:60px 40px` + `fadeUp` 89–95; logo tile 44×44 radius 12 gradient
`135deg #10b981→#06b6d4` shadow `0 8px 16px rgba(16,185,129,0.25)` + HeartPulse
(`<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>` = lucide `HeartPulse`) 215–224; wordmark
`fontSize 26 weight 800` 225–227; headline `clamp(40px,4vw,56px)` w900 `-0.03em`
"Welcome back." / "Initialize your vault." with emerald span 230–242; **input recipe**
(`iStyle` 26–40): padding 16 18, radius 14, `1.5px solid` `#10b981`(focus)/`#e2e8f0`, bg
white( focus)/`#f8fafc`, 15/500 `#0f172a`, focus `0 0 0 4px rgba(16,185,129,0.12)`,
transition `.25s`; labels 14/700 `#1e293b`; remember-me checkbox 18 px `accent-color:#10b981`
285–294; `.btn-primary` (297–302 + 111–135) full-width, padding 16, radius 14, bg `#10b981`,
hover `#059669` + `translateY(-2px)` + shadow `0 12px 24px rgba(16,185,129,0.25)` + arrow;
`.btn-google` (304–313) white, `1.5px #e2e8f0`, `#1e293b`, Google mark; `.back-btn` 44 circle,
white, `1.5px #e2e8f0`, hover `#f1f5f9` (159–178, positioned top-right 32 px).

### `src/index.css` / `src/App.css` — template leftovers (ignore)
`index.css` = `@import "tailwindcss"` (keep the import idiom for Next `globals.css` `@theme`)
plus the Vite `:root`/dark-mode var block (`--accent:#aa3bff`, `color-scheme: light dark`,
`prefers-color-scheme: dark` 35–53) which is **not** part of the design. `App.css` = template
styles (`.counter`, `.hero .base`, `#next-steps`, `#docs`) — none reachable from `App.jsx`.

## 7. Design-token extraction → plan §5 verification

Extracted values are case/format normalized; `rgba(16,185,129,0.12)` also appears as
`#10b98112`/`#10b98118`/`#10b98115`/`#10b98130`/`#10b98140`/`#10b98145`/`#10b98155`/
`#10b98160` alpha suffixes in CSS (see recipes above).

### 7.1 Color tokens — verified

| Plan §5.3 token | Value | Status | Strongest source |
|---|---|---|---|
| `--color-primary` | `#10b981` | ✅ in export (73×) | logo gradient `App.jsx:711`; wordmark `App.jsx:718`; `cta-primary` `App.jsx:636` |
| `--color-primary-dark` | `#059669` | ✅ | cta gradient end `App.jsx:636`; auth hover `MedVaultAuthIllustration.jsx:129`; final CTA `App.jsx:1088` |
| `--color-primary-tint` | `#d1fae5` | ✅ | folder icon chip `App.jsx:381`; check chips `App.jsx:995`; row icon `mobile.jsx:138` |
| `--color-primary-tint-2` | `#a7f3d0` | ✅ | `mvp-fc-ico` gradient end `MedVaultPhoneSection.jsx:108` |
| `--color-primary-soft` | `#f0fdf4` | ✅ | hero gradient start `App.jsx:755`; bot bubble `App.jsx:1247`; `0 8px 4px` nurse card `App.jsx:149` |
| `--color-primary-ring` | `rgba(16,185,129,0.12)` | ✅ | auth input focus shadow `MedVaultAuthIllustration.jsx:38` |
| `--color-secondary` | `#06b6d4` | ✅ | logo gradient end `App.jsx:711`; kicker 3 `App.jsx:1047`; FindCare map pin/badge `App.jsx:496`/`526` |
| `--color-secondary-tint` | `#cffafe` | ✅ | Hospital chip bg `App.jsx:526`; check chip `App.jsx:1059` |
| `--color-secondary-soft` | `#f0f9ff` | ✅ | hero gradient end `App.jsx:755` |
| `--color-magenta` | `#f472b6` | ✅ | kicker 2 `App.jsx:1015`; Pill chip `App.jsx:446`; avatar gradient `App.jsx:613` |
| `--color-magenta-tint` | `#fce7f3` | ✅ | Pill chip bg `App.jsx:446`; check chip `App.jsx:1027` |
| `--color-violet` | `#8b5cf6` | ✅ | Report-Ready chip `HeroVisual.jsx:127`; avatar stack `App.jsx:844`; RobotMascot default |
| `--color-blue` | `#3b82f6` | ✅ | Visit chip icon `HeroVisual.jsx:117`; appointment row icon `mobile.jsx:166` |
| `--color-blue-tint` | `#dbeafe` | ✅ | appointment row icon bg `mobile.jsx:164` |
| `--color-red` | `#ef4444` | ✅ | Vitals chip `HeroVisual.jsx:108`; avatar stack `App.jsx:844` |
| `--color-red-tint` | `#fee2e2` | ❌ **NOT in export** | introduced for §12 status chips (Tailwind `red-100` family) |
| `--color-amber` | `#f59e0b` | ✅ | stars `App.jsx:313`; avatar stack `App.jsx:844` |
| `--color-amber-tint` | `#fef3c7` | ❌ **NOT in export** | introduced for §12 status chips (Tailwind `amber-100` family) |
| `--color-teal` | `#14b8a6` | ✅ | How-It-Works step 1 color `App.jsx:906` |
| `--ink-900` | `#0f172a` | ✅ | body `App.jsx:626`; H1 `App.jsx:780`; wordmark `App.jsx:718`; footer `App.jsx:1151` |
| `--ink-800` | `#1e293b` | ✅ | labels `MedVaultAuthIllustration.jsx:249`; mascot strokes `App.jsx:61` |
| `--ink-700` | `#334155` | ✅ | feature bullets `App.jsx:994`; footer fine print `App.jsx:1216` |
| `--ink-600` | `#475569` | ✅ | `cta-ghost`/`nav-login` `App.jsx:647/653`; feature body `App.jsx:985` |
| `--ink-500` | `#64748b` | ✅ | hero para `App.jsx:790`; step desc `App.jsx:298`; testimonial text `App.jsx:315` |
| `--ink-400` | `#94a3b8` | ✅ | testimonial role `App.jsx:324`; chip time `HeroVisual.jsx:79`; eye icon `MedVaultAuthIllustration.jsx:4` |
| `--phone-muted` | `#9ab5ad` | ✅ | `mvp-sc-s`/`mvp-sc-d` `mobile.jsx:122–123`; `MedVaultPhoneSection.jsx:89–90` |
| `--phone-ink` | `#0d1f1a` | ✅ | phone inner frame `mobile.jsx:109`; label/title `mobile.jsx:117,121` |
| `--border` | `#e2e8f0` | ✅ | nav border-bottom/ghost border `App.jsx:646,700`; testimonial border `App.jsx:308`; input border `MedVaultAuthIllustration.jsx:30` |
| `--border-strong` | `#cbd5e1` | ✅ | Google hover `MedVaultAuthIllustration.jsx:157`; skeleton bars `App.jsx:424` |
| `--bg` | `#f8fafc` | ✅ | body bg `App.jsx:626`; How-It-Works section bg `App.jsx:879`; auth left `MedVaultAuthIllustration.jsx:64` |
| `--bg-card` | `#ffffff` | ✅ | all cards (testimonial `App.jsx:306`, how-it-works `App.jsx:928`) |
| `--bg-input` | `#f8fafc` | ✅ | input resting `MedVaultAuthIllustration.jsx:31` |
| `--bg-soft` | `#f1f5f9` | ✅ | scrollbar track `App.jsx:627`; skeleton rows `App.jsx:386,424` |
| `--hero-gradient` | `linear-gradient(150deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)` | ✅ exact | `App.jsx:755` |
| `--footer-bg` | `#0f172a` | ✅ | footer `App.jsx:1151` |

### 7.2 Status colors (plan §12) — source check

- taken `#10b981` ✅, upcoming `#3b82f6` ✅, due `#10b981` ✅, missed `#ef4444` ✅, skipped
  `#94a3b8` ✅, snoozed `#f59e0b` ✅, paused `#64748b` ✅, canceled `#94a3b8` ✅.
- Note: **no missed/skipped-due chip exists in the export** — the exporting site only shows
  "upcoming/active" states; the tint backgrounds for missed/skipped/snoozed come from §12's
  extended tokens (`#fee2e2`, `#f1f5f9`, `#fef3c7`); the first two are day-zero spec decisions.

### 7.3 Typography — verified (plan §5.2)

| Spec | Value | Source |
|---|---|---|
| Face | Plus Jakarta Sans 400–900 | `App.jsx:624` `@import` weights `400;500;600;700;800;900` |
| Phone mockup face | DM Sans 400–800 | `mobile.jsx:44`, `MedVaultPhoneSection.jsx:5` |
| H1 | `clamp(42px,5.5vw,72px)` / 900 / lh 1.08 / ls `-0.03em` | `App.jsx:776–778` |
| H2 how-it-works | `clamp(26px,4vw,48px)` / 900 | `App.jsx:887` ⚠ spec says `52px` max — **two variants exist** (see §7.5) |
| H2 features/trust | `clamp(32px,4vw,52px)` / `clamp(24px,3.5vw,44px)` brand parity | `App.jsx:966`, `App.jsx:1075` |
| Feature H3 | `clamp(28px,3.5vw,44px)` / 800 / ls `-0.025em` | `App.jsx:984,1016,1048` |
| Kicker | 13 / 800 / ls `0.12em` / upper / colored | `App.jsx:983`(emerald) `1015`(pink) `1047`(cyan) |
| Auth headline | `clamp(40px,4vw,56px)` / 900 / ls `-0.03em` | `MedVaultAuthIllustration.jsx:232` |
| Field label | 14 / 700 / `#1e293b` | `MedVaultAuthIllustration.jsx:249` |
| Field text | 15 / 500 | `MedVaultAuthIllustration.jsx:33–35` |
| Stat number | 36 / 900 | `App.jsx:333` (StatPill) |
| Body | 15–17 px | H1 para 17 (`App.jsx:790` fs `clamp(14px,1.8vw,17px)`), feature body 17 (`App.jsx:985`), step desc 14.5 (`App.jsx:949`), how-it-works sub 16 (`App.jsx:889`) |

### 7.4 Non-token recipes — verified (plan §5.4/§5.5)

| §5 recipe | Source |
|---|---|
| Pill buttons (radius 100, emerald gradient, hover lift) | `.cta-primary` `App.jsx:635–644` |
| Ghost pill (2px `#e2e8f0`, hover emerald) | `.cta-ghost` `App.jsx:645–652` |
| Text button Log In | `.nav-login` `App.jsx:653–654` |
| IconButton 44 circle back button | `.back-btn` `MedVaultAuthIllustration.jsx:159–178` |
| Auth/form primary button (radius 14, full width, lift+shadow) | `.btn-primary` `MedVaultAuthIllustration.jsx:111–135` |
| Inputs | `iStyle` `MedVaultAuthIllustration.jsx:26–40` |
| Google button | `.btn-google` `MedVaultAuthIllustration.jsx:137–157` |
| Checkbox (18 px, accent emerald) | `MedVaultAuthIllustration.jsx:287` |
| Cards (feature) | how-it-works card `App.jsx:922–952` (radius 32, border `#e2e8f0`, shadow `0 12px 48px rgba(0,0,0,0.04)`) |
| Cards (testimonial) | `App.jsx:306–311` (radius 20, shadow `0 2px 12px rgba(0,0,0,0.05)`) |
| Glass cards | `FloatingCard.jsx:16–20`; `MedVaultPhoneSection.jsx:96–105`; `HeroVisual.jsx:47–61` |
| Chip/icon tiles (tint bg + colored icon) | `HeroVisual.jsx:63–73` `${color}18`; `mobile.jsx:120`; `App.jsx:381` |
| Snooze pill | `.mvp-snooze` `MedVaultPhoneSection.jsx:115` |
| ListRow (feed) | `.mvp-sc-row` `mobile.jsx:119–123` |
| SectionLabel (12/700 + emerald `›`) | `.mvp-sc-label` `mobile.jsx:117–118` |
| StatPill (36/900 + 12 label) | `App.jsx:331–336` |
| Avatar (34–40, gradient `${c}99`, white border, stack `-10px`) | `App.jsx:844–852` |
| NavigationLink (tinted pill gradient + emerald) | `.nav-link` `App.jsx:659–691` |
| FAB (56 circle, gradient, glow) | `App.jsx:1288–1296` |
| Tag pill on CTA (white/20) | `App.jsx:1104–1108` |
| StarRating (5 amber CheckCircle2 `fill:#f59e0b30`) | `App.jsx:313`, `856` |
| Bottom nav (white, `0.5px #e8f0ee` top, active dot `#10b981`) | `.mvp-bottom-nav` `mobile.jsx:126` / `186–230` |
| Nav shell (fixed 68 px, blur 16, scroll shadow) | `App.jsx:695–706` |

### 7.5 Nuances found during verification (feed back into §5)

1. **Section H2 has two sizes.** How-It-Works uses `clamp(26px,4vw,48px)`,
   Features uses `clamp(32px,4vw,52px)`, Trust uses `clamp(24px,3.5vw,44px)`, Final CTA uses
   `clamp(28px,4.5vw,56px)` white. §5.2's single "Section H2 `clamp(26px,4vw,52px)`" is an
   approximation — make the token support a max via a per-section size, not a single literal.
2. **Glass card radii differ per component**: Stitch uses 16 px (`rounded-2xl`) in
   `FloatingCard.jsx`/`FeatureMedicalRecords`, 18 px in `MedVaultPhoneSection` `.mvp-fc`, 22 px
   in `HeroVisual` floating notifications. §5.4's "18–22 px" is right for phone motifs; the
   dashboard/insight glass card can pick 18 px as a compromise, matching `.mvp-fc`.
3. **`#fee2e2` / `#fef3c7` are not in the Stitch export** — they are plan-introduced tint
   tokens for the §12 status-chip system. Documented here so Phase 03 does not incorrectly
   claim them as Stitch-sourced.
4. **How-It-Works grid never collapses** (`repeat(3,1fr)`, `App.jsx:893`). Preserve in Phase 04
   for visual parity; the responsive pass (Phase 26/§16) may add a mobile collapse only if the
   design review permits.
5. **Wordmark sizes**: nav 20 px/900 (`App.jsx:717–719`), footer 19 px/900, auth 26 px/800
   (`MedVaultAuthIllustration.jsx:225–227`). §5.1 "~20 px / weight 900" = nav/footer; auth uses
   800 weight at 26 px.
6. **`window.innerWidth` is read at render** (`App.jsx:731`) — a Stitch hack; port the
   `useIsNarrow(768)` pattern from `mobile.jsx` instead in the Next Nav.
7. **Import of lucide `HeartPulse` is `stroke` style; the logo baseline is `#10b981→#06b6d4`
   at 135°** with white text/icons (nav `App.jsx:711`, auth `MedVaultAuthIllustration.jsx:217`).

## 8. Breakpoint facts (plan §16 verification)

| Breakpoint | Behavior | Source |
|---|---|---|
| `< 768` | Nav center links hidden | `App.jsx:731` |
| `< 768` | Hero phone scene min-height 580 (820 on desktop); centered, sparkles retained | `mobile.jsx:7–13`, `mobile.jsx:273` |
| `≥ 900` | Auth left image panel shown (`flex:1.1`, `#f8fafc`); hidden below | `MedVaultAuthIllustration.jsx:59–67` |
| wrap | Hero left `1 1 480px` / right `1 1 520px`, `minWidth:320` | `App.jsx:770`, `App.jsx:864–866` |
| wrap | Feature bullets & testimonials `repeat(auto-fit,minmax(280px,1fr))` | `App.jsx:988`, `App.jsx:1079` |
| `1024` | Template CSS font-size 16 (leftover, irrelevant to design) | `src/index.css:30–32` |

## 9. Screen → route confirmation (plan §6)

| Stitch screen | Source location | Product route | Confirmed |
|---|---|---|---|
| Landing page | `App.jsx` (whole) | `/` | ✅ port |
| Auth split screen | `MedVaultAuthIllustration.jsx` | `/login`, `/register` | ✅ port |
| Phone feed rows / SectionLabels | `mobile.jsx:129–234` | `/schedule` (Upcoming rows), `/history` (Recent Reports), `/notifications` | ✅ motif reuse |
| Floating "AI Insight" glass card | `MedVaultPhoneSection.jsx:196–208` | `/dashboard`, `/insights` | ✅ motif |
| "Medicine reminder … Snooze" card | `MedVaultPhoneSection.jsx:224–254` | DoseCard Take/Snooze/Skip everywhere | ✅ motif |
| Bottom nav (home active dot) | `mobile.jsx:186–230` | `(app)` mobile bottom nav | ✅ |
| AI chat FAB | `App.jsx:1221–1297` | `/help` (decorative → informational) | ✅ |
| Footer / trust | `App.jsx:1072–1219` | `/`, `/help` | ✅ |
| "Report Upload"/OCR + "Vitals Tracked"/visit chips | `MedVaultPhoneSection.jsx:209–222`, `HeroVisual.jsx:104–130` | **none** (non-goals §3) — retain visual language only | ✅ documented |

## 10. Port list (exact → target, used by Phase 04)

| Source (in `Landingpage/`) | Target (Next, relative to `src/` or `public/`) |
|---|---|
| `src/App.jsx:635–691` (.cta-primary/.cta-ghost/.nav-login/.nav-link/dot-grid) | `app/globals.css` `@layer components` |
| `src/App.jsx:694–747` Nav | `features/landing/Nav.tsx` |
| `src/App.jsx:749–876` Hero | `features/landing/Hero.tsx` |
| `src/components/HeroVisual.jsx` | `features/landing/HeroVisual.tsx` (next/dynamic, SSR-muted framer) |
| `src/components/FloatingCard.jsx` | `components/ui/glass-card.tsx` (recipe) |
| `src/mobile.jsx` (CSS 43–127, PhoneScreen 129–234, parallax) | `features/landing/PhoneMockup.tsx` |
| `MedVaultPhoneSection.jsx` (c1–c4 196–254, `.mvp-*` CSS 4–121) | `features/landing/PhoneMockupFloats.tsx` (composition) |
| `src/App.jsx:878–955` + mascots 49–224 | `features/landing/HowItWorks.tsx` + `mascots.tsx` |
| `src/App.jsx:338–538` (F1 F2 F3) | `features/landing/Features.tsx` (+ `FeatureMedicalRecords`, `FeatureSmartReminders`, `FeatureFindCare`) |
| `src/App.jsx:303–329, 1072–1083` | `features/landing/Testimonials.tsx` |
| `src/App.jsx:1085–1148` | `features/landing/FinalCta.tsx` |
| `src/App.jsx:1150–1219` | `features/landing/Footer.tsx` |
| `src/App.jsx:1221–1297` | `features/landing/AiChatFab.tsx` (→ `/help`) |
| `MedVaultAuthIllustration.jsx` | `features/auth/AuthShell.tsx` (+ `LoginForm`/`RegisterForm`) |
| `src/App.jsx:709–719` + `MedVaultAuthIllustration.jsx:214–228` | `components/brand/Logo.tsx`, `Wordmark.tsx` |
| `public/how-it-works/{prescription,ai-doctor,reminders-mobile}.png` | `public/landing/how-it-works/*.png` |
| `public/imagessss/login_page.jpeg` | `public/auth/login-page.jpeg` |

Not ported (per §3/§5): `index.css:var block`, `App.css`, `public/favicon.svg`, `public/icons.svg`,
`public/hero/*`, `public/images/mascots-team.png`, `public/images/hero-final.png`,
`Gemini_Generated_Image_*.png`, root `imagessss/*`, `src/Untitled`, `src/assets/*`, `dist/`,
`node_modules/`, `.vscode/`.

## 11. Verification assertions (Phase 01 "Testing")

- ✅ Spot-check A: `#10b981`, `#059669`, `#06b6d4`, `#d1fae5`, `#a7f3d0`, `#f0fdf4`, `#f0f9ff`,
  `#cffafe`, `#dbeafe`, `#fce7f3`, `#14b8a6`, `#0f172a`, `#1e293b`, `#334155`, `#475569`,
  `#64748b`, `#94a3b8`, `#9ab5ad`, `#0d1f1a`, `#e2e8f0`, `#cbd5e1`, `#f8fafc`, `#f1f5f9`,
  `#e8f0ee`, `#e2eeea` all present in raw source (see §7.1 table for counts).
- ✅ Spot-check B: hero gradient string matches exactly (`App.jsx:755`).
- ⚠️ `#fee2e2` and `#fef3c7` absent from source → **extended** tokens, documented (§7.1, §7.5.3).
- ✅ Duplicate detection (MD5): `Gemini_Generated_Image_*.png` = `public/images/hero-final.png`;
  root `imagessss/login_page.jpeg` = `public/imagessss/login_page.jpeg`.
- ✅ Import-graph fact: `FloatingCard.jsx` + `MedVaultPhoneSection.jsx` unused at runtime.
- ✅ Breakpoint facts §8 match §16 intent (768/900).

## 12. Open decisions for Phase 03/04

1. **One or two section-H2 token classes** (§7.5.1) — decide one scale tier (`h2-section`) with
   an optional `h2-section-lg` for Features.
2. **Glass radius token** — adopt 18 px as `--radius-glass` (matches `.mvp-fc`; closest to
   both 16 px and 22 px neighbors).
3. **`How-It-Works` 3-col grid on mobile** — preserve (parity) for Phase 04; revisit in Phase 26.
4. **`hero-final.png` (5.3 MB)** — leave out of Phase 04; may be used later for OG image.