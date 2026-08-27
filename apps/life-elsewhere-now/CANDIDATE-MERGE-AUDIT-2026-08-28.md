# Product 3 candidate-code merge audit

Date: 2026-08-28  
Candidate reviewed: `/Users/ashley/Downloads/eazo-life-elsewhere-now`  
Canonical Product 3: `apps/life-elsewhere-now`

## Executive decision

The candidate is a visual branch of the canonical Product 3 implementation, not an independent product architecture. Its strongest contribution is an editorial postcard presentation and calmer card hierarchy. Its largest risk is replacing region-independent synthetic portraits with twelve country-labelled, photorealistic people without adding those assets to the rights ledger or establishing provenance, consent, stereotype review, or independence from scene geography.

The merge therefore adopts presentation patterns and a cache correction while retaining the canonical data, safety, Eazo, privacy, offline, testing, and disclosure architecture.

## File-level comparison

| Candidate change | Decision | Product 3 action |
|---|---|---|
| `src/postcards.ts` and 12 PNG portraits | Reject for production | Do not copy. Country-labelled photorealistic people would couple appearance to geography and have no auditable source/license records. |
| `Portrait` becomes image + caption | Merge the semantic pattern | Keep deterministic region-independent SVG; add a visible postcard-style caption stating that the portrait is possible, independently seeded, and not real. |
| Full-screen photographic cover | Reject | Keep the stronger multi-element orbital contrast system, explicit controls, and visible privacy promise. |
| Warm-white editorial cards and rounded surfaces | Merge selectively | Apply restrained rounding, paper panels, captions, and improved card containment to encounter/compare views without replacing the established nocturnal identity. |
| Shortened encounter/method copy | Reject | Preserve definitions, limitations, privacy statements, sensitive-scene rules, and Eazo-specific action labels. |
| Footer removed | Reject | Preserve data-license disclosure and local-data deletion control. |
| Service worker unregistered and all caches deleted | Reject implementation; accept diagnosis | Replace cache-first navigation with network-first navigation and cached offline fallback; use stale-while-revalidate for static assets. |
| E2B `allowedHosts` and root `vite.config.mjs` | Reject | Environment-specific preview configuration does not belong in the Product 3 production surface. |
| Static `versions/` gallery | Archive only | Useful as design exploration, but not copied into the production bundle or mandatory cache. |

## Safety findings

The candidate postcards visually assign recognizable ethnic, ceremonial, rural, or traditional markers to Afghanistan, Brazil, Ethiopia, Georgia, India, Indonesia, Japan, Mexico, Mongolia, Morocco, Peru, and Vietnam. Even if generated, these images can imply that a country has a representative face or lifestyle. That conflicts with LIFE-REQ-002, which requires visual generation to remain independent from region, wealth, religion, and circumstance.

The canonical deterministic portrait generator remains the production source because its input does not receive country, religion, income, conflict, or user identity fields. The merged caption makes this independence legible to users instead of leaving it only in the method page.

## Cache optimization

The candidate correctly identified that cache-first navigation can keep serving an old build during rapid preview and release iteration. Its proposed self-destructing worker would, however, remove offline behavior required by LIFE-REQ-009. The merged worker now uses:

- network-first navigation, updating the cached shell when online;
- cached-shell fallback when navigation is offline;
- stale-while-revalidate for same-origin static assets;
- versioned cache cleanup during activation;
- explicit core-media pre-caching.

## Verification required

- existing Product 3 unit and manifest tests;
- Pixel 7 and iPhone 12 production path;
- offline active-session behavior and cached navigation fallback;
- visible portrait disclosure in encounter and comparison views;
- no horizontal overflow at mobile breakpoints;
- production build and JavaScript budget.

## Verification outcome

- Vitest: 17/17 passed.
- Playwright: 11 passed, 1 skipped. Pixel 7 Chromium passed the cold offline reload; Playwright WebKit's offline-reload operation is unstable and remains covered only by active-session offline automation plus the physical-iPhone release gate.
- Lint and TypeScript: passed with zero project warnings/errors.
- Production build: JavaScript gzip 290.27 KB; CSS gzip 5.74 KB.
- Manifest: 10 files, 8,411,375 bytes, with matching hashes and license records.
- Candidate country portraits: 0 files copied into the production bundle.
