# Palette Lab — Change Log

All notable project changes are recorded here in reverse chronological order.

## 2026-10-26 — Preview startup reliability

- Split lightweight frontend preview from full Cloudflare development.
- `npm run dev` now avoids unnecessary Worker startup; `npm run dev:full` preserves integrated API development.
- Kept production Worker builds unchanged.

## 2026-10-26 — User-directed theme correction

- Restored the unified neutral charcoal and yellow-green accent system across all dark domains.
- Replaced the rejected Light Web indigo experiment with a new porcelain, ink and deep teal palette.
- Kept Light Art independent with warm paper and restrained vermilion.
- Reverified all four theme/domain combinations and final-state screenshots.

## 2026-10-26 — Content-first workspace refinement

- Reduced marketing space and prioritized the actual workspace.
- Replaced small palette rows with large color fields and a proportional color strip.
- Removed fluorescent yellow-green from Web themes; introduced muted indigo actions.
- Reduced Art vermilion saturation for more comfortable Light and Dark modes.
- Added responsive two-column mobile swatches and final-state screenshot reviews.
- Reverified 8 unit tests, 3 browser tests, builds and 0 known vulnerabilities.

## 2026-10-26 — Theme and domain token system

- Added the theme/domain design-system contract and ADR.
- Added Light/Dark switching with local persistence and theme-color metadata.
- Added independent Web/UI and Art/Poster accent, surface and display-font tokens.
- Verified all four combinations preserve palette data and never reset the current image.
- Added a third browser workflow test and final-state visual reviews for Light Web and Dark Art.

## 2026-10-26 — Interactive local workspace

- Added PNG/JPEG/WebP validation, local Canvas preprocessing and transparent-pixel handling.
- Added responsive image import, preview, palette shares, count controls, domain switching and HEX copying.
- Added self-generated test imagery and 2 real-browser workflow tests for desktop and mobile.
- Verified 8 unit tests, 2 browser tests, ESLint, production builds and 0 known vulnerabilities.

## 2026-10-26 — Dependency and security cleanup

- Reduced direct runtime dependencies from 48 to 7; npm removed 138 unused packages.
- Applied compatible security updates and narrow overrides for remaining upstream advisories.
- Reached 0 known vulnerabilities in `npm audit` without forced breaking downgrades.
- Added dependency policy and CI security auditing.
- Reverified 8 tests, ESLint and production builds.

## 2026-10-26 — Deterministic palette engine

- Added weighted OKLCH palette clustering with normalized color shares.
- Added deterministic six-digit HEX output and typed color records.
- Added 5 palette-engine tests; 8 project tests now pass.
- Verified ESLint and production builds after strict-type corrections.

## 2026-10-26 — Multi-platform direction

- Added desktop and mobile responsive workspace requirements.
- Added PWA, Tauri desktop and Capacitor mobile delivery paths.
- Confirmed that native packaging must reuse the same product core.

## 2026-10-26 — Documentation workflow

- Added current-status tracking.
- Added explicit documentation synchronization rules.
- Added this change log.

## 2026-10-26 — Phase 0 foundation

- Froze V1 scope and domain contracts.
- Added product, architecture and roadmap documents.
- Established React, TypeScript, Vite, Hono and Cloudflare Workers foundations.
- Added domain profiles and 3 automated tests.
- Added secret exclusions and GitHub Actions CI.
- Created the remote repository and pushed the initial baseline.
