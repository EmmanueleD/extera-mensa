# Feature: mobile-avatar-visuals

## Objective

Make the full application usable and visually coherent on mobile while resolving the car steering-wheel/avatar collision, removing the obsolete message connector, and expanding deterministic avatar variety.

## Problem

The driver initial and steering wheel currently compete for the same corner of the car seat, the wheel is too small, and elevated message bubbles still draw an obsolete vertical gray connector. Avatar recipes expose only three closely related silhouettes with little internal decoration. Across the application, narrow viewports have no deliberate responsive treatment: the topbar can overflow, car and bubble geometry can escape the viewport, touch targets and participant names are weak on touch devices, and responsive behavior is not covered by browser-level tests.

## Why

The car scene should remain legible and playful without overlapping controls, avatars should feel meaningfully individual, and every public and authenticated flow should work at common phone widths.

## Scope

- Move and enlarge the steering wheel within the driver window without overlapping the avatar initial.
- Remove the vertical gray connector below raised speech bubbles while preserving the normal bubble tail.
- Expand deterministic avatar silhouette, scale, spots, and internal-decoration variety while preserving stable seeded output and the curated color palette.
- Make the entire application responsive, including authentication/recovery, Today/carpool, topbar/navigation, Profile, and Statistics.
- Improve narrow-screen overflow, wrapping, touch targets, touch-visible identity, car/bubble bounds, and chart/container sizing.
- Add focused regression coverage and run the complete repository verification.

## Constraints

- Existing avatar seeds must remain deterministic; regeneration may intentionally produce a different deterministic recipe.
- Preserve accessibility semantics, reduced-motion behavior, owner-only message editing, presence indicators, and existing desktop behavior.
- Do not change database schema, RLS, authentication rules, or message ownership.
- Mobile acceptance covers the full application at common narrow widths, with 320px as the minimum supported viewport.
- Testing mode: ordinary tests during implementation, selected by the user; no mandatory RED-first phase.
- No commits, push, PR, merge, or deployment without separate explicit user authorization.

## Delivery and routing

- Route: delegated direct.
- Trigger evidence: understanding spans more than four files and implementation requires multiple non-trivial files.
- Writer: one bounded `gentle-ai-worker` thread, continued across work units when useful.
- Delivery strategy: `ask-on-risk`; final implementation exceeds the 400-line review budget.
- Chain strategy selected by the user: `stacked-to-main`.
- Slice 1: `fix/mobile-avatar-visuals-01-avatars`, commit `f5cc3a3`, deterministic avatar variety, 268 authored lines.
- Slice 2: `fix/mobile-avatar-visuals-02-carpool`, commit `8f13a6d`, car visuals, touch geometry, participant labels, and responsive CSS foundation, 334 authored lines.
- Slice 3: `fix/mobile-avatar-visuals`, shell/auth/profile/statistics responsive wiring plus ODD evidence; final commit identities are recorded below.
- Each branch will be pushed without opening or merging PRs; future PRs should land in slice order and be rebased/retargeted to `main` after the preceding slice merges.

## Tasks

- [x] T1 Car visual collision and bubble cleanup
  - Move the steering wheel to the lower-left of the driver window and enlarge it.
  - Keep the participant initial clear and readable.
  - Remove only the obsolete lane connector, retaining the speech-bubble tail.
  - Add focused structural/CSS regression coverage.

- [x] T2 Deterministic avatar variety
  - Add meaningfully distinct silhouette and scale variants.
  - Add deterministic spots and varied internal decorative elements.
  - Preserve safe palette use, deterministic rendering, labels, and reduced motion.
  - Extend avatar model/component tests.

- [x] T3 Whole-app mobile remediation
  - Provide compact, non-overflowing navigation for narrow screens.
  - Make auth/recovery, Today/carpool, Profile, and Statistics layouts fit at 320px and common phone widths.
  - Keep car/message content within viewport bounds and avoid row collisions.
  - Make participant identity usable on touch and interactive targets appropriately sized.
  - Preserve desktop layout and semantics.

- [x] T4 Verification and evidence
  - Run focused tests for car visuals, avatars, shell/auth, Today, Profile, and Statistics.
  - Run `npm run verify`.
  - Perform a real-browser mobile smoke check if an available runtime permits it; otherwise record the limitation explicitly.
  - Record exact evidence and remaining limitations here.

## Acceptance criteria

- The larger steering wheel is visibly anchored at the lower-left of the driver window and does not overlap the participant initial.
- Raised speech bubbles have no vertical gray connector; the standard speech-bubble tail remains.
- Different seeds produce visibly broader deterministic variation in silhouette, scale, spots, and internal decoration.
- All routes and dialogs fit without unintended horizontal scrolling at 320px width.
- Navigation remains usable without clipping or overcrowding.
- Cars, participant names, speech bubbles, profile controls, auth forms, and statistics remain readable and operable on touch-sized screens.
- Existing desktop behavior, accessibility, message ownership, presence, and reduced-motion behavior remain intact.
- Focused tests and `npm run verify` pass.

## Progress

- Exploration completed by `gentle-ai-explore`.
- User selected whole-application mobile scope.
- User selected ordinary tests during implementation rather than strict RED-first TDD.
- Branch created: `fix/mobile-avatar-visuals`.
- T1 completed: the steering wheel is a 1.25rem decorative element anchored at the lower-left of the driver seat, opposite the lower-right participant initial; the lane-1 connector was removed while the standard bubble tail remains.
- T2 completed: avatar recipes now provide five seeded silhouettes, deterministic 0.88–1.0 scale variation, optional spots, and none/cheeks/freckles/spark decoration variants while preserving the public component contract.
- T3 implementation completed its first writer pass, but independent verification kept T3 open for two bounded corrections: occupied car-seat controls remained 40×40px instead of approximately 44px, and long touch-visible participant names needed a height bound to protect row spacing.
- T3 correction pass now provides centered 44×44px occupied-seat controls within the existing 46px seat pitch and clamps touch-visible participant names to two lines with an independent finite height bound.
- T3 is complete after independent re-verification confirmed both corrections and the approximately 282.4px five-seat car footprint within the 288px content width available at a 320px viewport.

## Verification evidence

- T1 writer verification: focused car/style suites passed 14/14 tests; typecheck, targeted ESLint, and targeted Prettier passed.
- T1 independent verification: PASS for source and tests. It confirmed lower-left wheel positioning, separated lower-right initial, driver-only decorative semantics, preserved owner interaction/accessibility, connector removal, and retained bubble tails.
- T1 limitation: jsdom cannot prove rendered pixel non-overlap; real-browser visual confirmation remains part of T4.
- Native assessment was unassessable because the feature document is intentionally untracked; the required independent verification was therefore run and passed.
- T2 writer verification: focused avatar suites passed 14/14 tests; typecheck, targeted ESLint, and targeted Prettier passed. The worker's first reporting attempt failed after writing coherent files; read-only incident diagnosis preserved them and the resumed writer completed verification without corrections.
- T2 independent verification: PASS for deterministic recipes and markup, five silhouettes, scale/spot/decoration diversity, finite bounded geometry, palette fallback, safe Vue-owned SVG, accessibility, reduced motion, and 32–36px structural rendering.
- T2 limitation: jsdom cannot prove real-browser raster quality, antialiasing, or transformed SVG clipping; visual confirmation remains part of T4.
- T3 writer verification: focused responsive suites passed 52/52 tests; typecheck, targeted ESLint, and targeted Prettier passed.
- T3 independent verification: FAIL pending two deterministic corrections. Navigation, auth/recovery, viewport bounds, dialogs, statistics, owner-only controls, desktop scoping, and the no-clipping policy passed; car owner targets were measured structurally at 40×40px and long mobile labels had no height bound.
- T3 correction writer verification: car/style suites passed 17/17 tests; typecheck, targeted ESLint, and targeted Prettier passed. The 44px targets retain 2px separation within the existing pitch, while two-line labels are bounded by `max-height` and overflow rules.
- T3 independent re-verification: PASS. It confirmed 44×44px targets, 2px adjacent separation, unchanged car width, bounded two-line labels, sufficient row/cabin spacing, preserved owner-only behavior, and no broad overflow clipping.
- T3 limitation: actual browser hit boxes, multiline ellipsis, font metrics, subpixel rounding, and pixel geometry remain for T4.
- T4 aggregate verification: `npm run verify` passed with typecheck, lint, Prettier, 15/15 unit files and 106/106 tests, and a production build transforming 112 modules.
- T4 real-browser smoke: Orca's embedded Chromium rendered login and registration at a 320×800 viewport. Both routes reported `clientWidth = scrollWidth = 320`, no horizontal overflow, and the captured forms/cards fit the viewport with all actions visible. The local Vite server was stopped and the temporary browser tab was closed afterward.
- T4 browser limitation: protected Today, Profile, message dialog, and Statistics routes could not be opened without an authenticated test session. Their mobile behavior is supported by source, CSSOM, component tests, independent verification, and the verified 320px car-footprint arithmetic, but not by authenticated browser screenshots. Device-emulation screenshots were unreliable in this Orca runtime, so only stable 320×800 viewport captures were accepted as visual evidence.
- Final tracked diff: 703 authored changed lines across 25 files; the new tracker contains 107 lines. No commit, push, PR, merge, or deployment was performed.

## Next step

Create the three stacked-to-main work-unit commits and branches, record their identities here, then push the branches without opening or merging PRs.
