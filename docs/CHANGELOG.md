# Palette Lab — Change Log

All notable project changes are recorded here in reverse chronological order.

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
