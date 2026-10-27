# Palette Lab — Change Log

All notable project changes are recorded here in reverse chronological order.

## 2026-10-27 — Secure local key setup and DeepSeek re-verification

- Added hidden-input PowerShell setup for local DeepSeek and Unsplash variables without embedding secrets in commands.
- Added a clipboard-based DeepSeek setup that validates input, writes only to Git-ignored `.dev.vars`, and clears the clipboard afterward.
- Removed temporary launchers to prevent accidental source-file paste or secret commits.
- Reverified the real local DeepSeek Flash request with HTTP 200 and correct three-field image analysis.

## 2026-10-27 — First production deployment

- Connected Cloudflare Workers to the dedicated `palette-lab` GitHub repository with least-privilege repository access.
- Completed the first production build and deployed to https://palette-lab.3476554092.workers.dev/.
- Verified public assets, API health, three-color extraction, dark Art rendering and 390 px mobile layout.
- Confirmed unconfigured AI fails closed with a visible offline fallback; no mock provider or secrets were deployed.
- Added deployment configuration, verification and remaining secret-rollout documentation.

## 2026-10-27 — Real inspiration verification tooling

- Added a credential-redacting verification command for the complete Unsplash and DeepSeek comparison chain.
- The command checks real photo results, attribution links and model-generated rankings without printing credentials or image payloads.
- Corrected the repository status: all implementation and environment-safety commits through `363ddeb` are backed up on remote `main`.
- Real Unsplash verification remains pending until the owner configures an access key.

## 2026-10-27 — Environment restoration correction

- Identified and documented a local configuration-loss defect in test restoration.
- Added explicit test markers and backup-only restoration so real `.dev.vars` files are never deleted without a backup.
- Added environment safety tests to CI and rebuilt non-secret local defaults for owner re-entry.

## 2026-10-27 — Online inspiration and comparison foundation

- Added content-aware Unsplash query planning and supported color filters.
- Added attributed reference photos and up-to-four-candidate AI comparison.
- Added real/mock provider boundaries, timeouts and comparison-failure fallback.
- Added a complete browser workflow with self-generated mock fixtures; 27 unit tests and 11 workflows pass.
- Real Unsplash verification awaits the owner's access key.

## 2026-10-27 — Real DeepSeek verification

- Completed a real DeepSeek Flash multimodal request through the local Worker with HTTP 200.
- Confirmed actual image-specific analysis rather than mock content.
- Added a reusable real-provider verification script with credential-redacted diagnostics.
- Kept all secrets local and excluded from version control.

## 2026-10-27 — Provider registry and DeepSeek setup

- Added automatic environment restoration after browser tests so mock mode cannot overwrite the owner's working configuration.
- Added provider capability registry for Kimi, DeepSeek, OpenAI, OpenRouter and future Cloudflare support.
- Configured DeepSeek Flash locally without storing a real key.
- Added credential-safe provider metadata and health checks.
- Added registry/API tests; 24 unit tests and 10 browser workflows pass.

## 2026-10-27 — Multimodal analysis foundation

- Added protected analysis API with request limits and Zod validation.
- Added mock and OpenAI-compatible providers with structured reports and uncertainty metadata.
- Added AI analysis panel with compressed-image consent, loading, errors and actionable recommendations.
- Added API and full-browser mock workflows; 20 unit tests and 10 browser tests now pass.
- Added test-environment backup/restore to keep mock mode out of production builds.

## 2026-10-27 — AI-readiness reliability review

- Preserved independent role edits across Web/Art switches.
- Added a real versioned JSON Schema and relative export reference.
- Visually verified exported Web PNG content, not only file size.
- Reduced automatic muted-text/surface collisions.
- Verified 17 unit tests, 9 browser workflows, recent CI and 0 known vulnerabilities.

## 2026-10-27 — Production export adapters

- Added semantic CSS variable downloads.
- Added versioned JSON design tokens with roles and source palette data.
- Added real 2× Web/Poster PNG exports.
- Included WCAG status in the export panel without hiding warnings.
- Verified all three file types through browser downloads; 17 unit tests and 8 workflows now pass.

## 2026-10-27 — Semantic fallbacks and contrast verification

- Replaced hue-inferred status colors with stable semantic fallbacks.
- Added neutral role assignments for single-color images.
- Added WCAG 2.1 role-pair checks with visible pair labels and ratios.
- Added unit and browser coverage for degenerate palettes and unreadable edits; 15 unit tests and 7 workflows now pass.

## 2026-10-27 — Role editing and domain previews

- Added deterministic Web/UI and Art/Poster role assignment.
- Added editable role selectors with immediate preview updates.
- Added real Web interface and Japanese-print-inspired poster previews.
- Corrected lightness ordering and OKLCH chroma/hue handling through unit tests.
- Verified 11 unit tests and 6 browser workflows, builds and 0 known vulnerabilities.

## 2026-10-27 — Stage review and reliability fixes

- Reviewed implementation, UX, tests, security, CI, backup and deployment readiness.
- Prevented stale asynchronous uploads from replacing newer selections.
- Added Clipboard API fallback and copy-feedback browser coverage.
- Added unsupported-file error coverage; 5 browser tests and 8 unit tests now pass.
- Confirmed 0 known vulnerabilities and recent remote CI success before the next phase.

## 2026-10-26 — Ambient mode specification

- Documented a future Standard/Ambient customization mode.
- Defined blurred-image rendering, neutral scrims, contrast-checked accents and neutral-dominant surfaces.
- Added default/current/local image choices, auto/standard/custom accents and reduced-transparency requirements.
- Kept the current Standard interface unchanged.

## 2026-10-26 — Light surface hierarchy

- Increased separation between page background, workspace and adjacent panels.
- Added distinct panel heading, input, control and swatch surfaces.
- Added structural borders and restrained two-level shadows without changing the dark theme.
- Gave Art Light an independent warm-paper elevation system.
- Reverified all browser workflows, mobile layout, builds and security audit.

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
