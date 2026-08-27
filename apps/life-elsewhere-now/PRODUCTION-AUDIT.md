# Elsewhere, Now — production test and release audit

Date: 2026-08-28  
Product: `life-elsewhere-now` (Product 3)  
PRD: V2 “此刻，世界另一边”  
Current workflow phase: `SELF_TEST`  
Gate status: `D2-exit candidate — BLOCKED from D3/D4`

## Release truth

The old “real-time global birth map” concept remains retired. This build implements the approved V2: 48 synthetic scenes backed by a versioned World Bank WDI snapshot. It does not track births, real people, precise locations, or user location.

The build is feature-complete for the nine Product 3 requirements and has passed its automated implementation suite. It must not be labelled D3 or D4 yet: the PRD requires human comprehension, copy/design signatures, physical-device evidence, and an Eazo Mobile host acceptance run that automated browser emulation cannot replace.

## Requirement audit

| Requirement | Automated implementation | Result | Remaining release evidence |
|---|---|---|---|
| LIFE-REQ-001 | Immediate CTA and explicit synthetic/no-tracking/no-location copy; mobile E2E | partial pass | Exactly 20 target users; at least 18 must identify scenes as non-real |
| LIFE-REQ-002 | 10,000 seeds × 6 launch regions; byte-identical visual options; SVG sanitizer | pass | None for D2; physical-device rendering remains in shared D3 gate |
| LIFE-REQ-003 | Unique non-numeric `SAFE-FALLBACK-001` | pass | None |
| LIFE-REQ-004 | 48 templates, 12 topics, 6 regions; ten-scene diversity and sensitive exclusion | pass | Human content reviewer signature remains required for D3 |
| LIFE-REQ-005 | WDI snapshot, definition/unit/source/year/transform/rounding/license/SHA ledger | pass | Periodic source freshness review |
| LIFE-REQ-006 | High-sensitivity scenes excluded from launch scheduler and flag remains off | pass for launch-disabled scope | Human sensitive-content review before enabling the flag |
| LIFE-REQ-007 | Definition/unit/year mismatch reason codes suppress ranking | pass | None |
| LIFE-REQ-008 | Privacy-safe share payload; official `@eazo/sdk` `share.compose` integration | partial pass | Eazo Mobile host must accept the payload on a real device |
| LIFE-REQ-009 | Interrupted staged update retains the valid active version; offline active-session E2E | pass | Cold offline reload on hosted immutable artifact |

## Executed evidence

- Vitest: 17/17 workspace tests passed, including all 9 Product 3 requirement tests.
- Playwright: 13 tests passed and 1 WebKit-only cold-reload test was skipped across Pixel 7 Chromium and iPhone 12 WebKit profiles. Both profiles now verify keyboard progression, horizontal pointer swipes, direct filmstrip navigation, previous/next transport controls, the save-to-pair return path, mobile overflow, the full product path, accessibility behavior, and active-session offline behavior. Chromium verifies the cold offline shell reload. Playwright WebKit reports an internal error for automated offline reload, so a real-iPhone cold reload remains part of the physical-device gate.
- Visual browser audit: 1440 px desktop plus 375, 390, and 430 px mobile views passed; the 390 × 844 production preview was re-inspected after the gameplay upgrade. Home CTA, 4:5 encounter frame, contact strip, fixed bottom navigation, touch targets, and view-reset behavior were exercised with zero horizontal overflow.
- Manifest: 11 files and 10,663,965 bytes, including versioned social covers, the compressed NASA Earth Observatory night-light composite, and a 535,794-byte edited/muted NASA JSC ISS night loop; below the 25 MB mandatory-cache cap.
- Production build: JavaScript gzip 290.99 KB, CSS gzip 6.51 KB; below the 350 KB first-view JavaScript budget.
- Lint: zero warnings for the full workspace at the time of the Product 3 run.
- Product 3 typecheck and production build: passed.

## Detailed design audit

The redesigned UI uses a nocturnal editorial-atlas system rather than dashboard cards: forest-black space, warm-paper type, coral and acid-lime signals, a credited night-light world composite without political borders, a short NASA JSC orbital time-lapse, and deterministic abstract portraits. The contrast system deliberately juxtaposes macro/micro, motion/stillness, light/dark, near/far, and three tiny everyday fragments. Mobile is a distinct composition—not a scaled desktop page—with a 40dvh cinematic panel, three-column contrast rail, one-screen lens/CTA row, 68 px safe-area bottom navigation, full-width encounter actions, and automatic scroll reset between views. Reduced-motion and data-saver users receive the existing static Earth poster instead of autoplay video.

The encounter loop now behaves like a compact photographic contact sheet: each scene sits in a tall 4:5 frame with frame number and local-time metadata, a ten-frame color strip shows progress, and previous/next controls remain visible without making gestures mandatory. A horizontal swipe advances or returns, Left/Right keys provide the same operation, direct strip selection supports non-linear browsing, and 180 ms exit plus 260 ms entrance motion gives the next image a legible handoff. Rapid input is temporarily locked during the handoff to prevent state races. `prefers-reduced-motion` removes the animated transition. Saving a scene exposes a device-local contact-sheet dock and a one-step “Open pair” continuation, closing the previous dead end between collecting and comparing. Encounter pages preserve a clear reading order: synthetic scene, region/time, ordinary moment, generation limit, evidence, then actions. Comparison deliberately avoids high/low arrows and explains comparability.

Objective checks passed: 56 px primary/action height, visible focus outlines, skip link, live-region feedback, reduced-motion media query, safe-area viewport configuration, swipe threshold and vertical-scroll discrimination, transition input lock, no horizontal overflow at 375/390/430 px, readable source ledger, local data reset, offline state, and Web fallback. The generated V5 contact-sheet social card matches the finished photographic-mobile direction, contains only abstract synthetic portrait geometry, and is recorded separately from the NASA visual source in the rights ledger.

Human-only checks remain deliberately unsigned: `aestheticLevel=enjoy`, North American English approval, brand taste, three-second comprehension, and share-intent threshold. Automated visual review cannot substitute for those signatures.

## Known technical warning

Vite externalizes Node `crypto`/`buffer` paths reachable inside `@eazo/sdk 0.22.8`. The official share surface works through the SDK capability path and the build stays within budget, but the warning should be rechecked against the next SDK release. Browser warnings from unrelated installed extensions are excluded from app results.

The expanded contrast and motion source audit is recorded in `VISUAL-RESEARCH-2026-08-27.md`. It separates viral editing-pattern research from production-media licensing and records the exact NASA source and local transform.

The 2026-08-28 candidate-code review is recorded in `CANDIDATE-MERGE-AUDIT-2026-08-28.md`. The merge adopts postcard-style disclosure and calmer editorial cards while rejecting unlicensed country-labelled people, shortened safety copy, E2B-only preview configuration, and removal of offline support. Navigation now uses network-first refresh with cached offline fallback; static assets use stale-while-revalidate.

## Stage decision

The product moves from `BUILDING` to `SELF_TEST`, which is the next permitted adjacent workflow state. D2-exit is a candidate, not a pass. D3 and D4 remain blocked until every human/physical-device/Eazo-host item above has immutable evidence. No automated result or GitHub push is treated as production authorization.
