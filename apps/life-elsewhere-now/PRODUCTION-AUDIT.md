# Elsewhere, Now — production test and release audit

Date: 2026-08-27  
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

- Vitest: 9/9 Product 3 requirement tests passed.
- Playwright: 6/6 Product 3 production-path tests passed across Pixel 7 Chromium and iPhone 12 WebKit profiles.
- Visual browser audit: desktop first view, 375 px mobile first view, encounter, save, and pair comparison passed; zero horizontal overflow.
- Manifest: 5 files, 2,145,123 bytes, all hashes and licenses validated; below the 25 MB mandatory-cache cap.
- Production build: JavaScript gzip 289.50 KB, CSS gzip 3.39 KB; below the 350 KB first-view JavaScript budget.
- Lint: zero warnings for the full workspace at the time of the Product 3 run.
- Product 3 typecheck and production build: passed.

## Detailed design audit

The UI uses an editorial atlas system rather than dashboard cards: warm paper, ink typography, orange as the single semantic accent, orbital geography without political borders, and deterministic abstract portraits. The first view answers “what / action / result,” keeps the synthetic disclosure adjacent to the CTA, and presents a complete CTA at desktop short height and mobile height. Encounter pages preserve a clear reading order: region/time, ordinary moment, generation limit, evidence, then actions. Comparison deliberately avoids high/low arrows and explains comparability.

Objective checks passed: 44 px minimum action height, visible focus outlines, skip link, live-region feedback, reduced-motion media query, safe-area viewport configuration, no horizontal overflow at 375 px, readable source ledger, local data reset, offline state, and Web fallback. The generated social card matches the finished palette and contains the exact synthetic-data disclaimer.

Human-only checks remain deliberately unsigned: `aestheticLevel=enjoy`, North American English approval, brand taste, three-second comprehension, and share-intent threshold. Automated visual review cannot substitute for those signatures.

## Known technical warning

Vite externalizes Node `crypto`/`buffer` paths reachable inside `@eazo/sdk 0.22.8`. The official share surface works through the SDK capability path and the build stays within budget, but the warning should be rechecked against the next SDK release. Browser warnings from unrelated installed extensions are excluded from app results.

## Stage decision

The product moves from `BUILDING` to `SELF_TEST`, which is the next permitted adjacent workflow state. D2-exit is a candidate, not a pass. D3 and D4 remain blocked until every human/physical-device/Eazo-host item above has immutable evidence. No automated result or GitHub push is treated as production authorization.
