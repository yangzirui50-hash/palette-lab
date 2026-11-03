# Palette Lab — Change Log

All notable project changes are recorded here in reverse chronological order.

## 2026-11-03 — Prepare independent human focus protocol rehearsal

- Added offline A/B blind-annotation pages generated from hash-verified licensed development images, with uncertainty, normalized regions, local saving and identity-checked JSON progress restore/export.
- Added validated one-to-one region comparison and a human disagreement review page; partial/uncertain cases remain explicit and no qualifying labels are invented.
- Added synthetic tool QA and documented the actual-content gaps behind retrieval category prefixes. Real human labels and held-out qualification remain pending.

## 2026-11-03 — Deliver local colors through editing, previews and exports

- Added recoverable ROI/manual working candidates without changing source palette shares; role HEX editing accepts normalized three/six-digit values in single and series flows.
- Moved single preview/export beside role editing on wide screens, added phone/desktop task navigation and a standalone 1200×720 palette-card PNG.
- Kept valid ROI evidence after undo/redo, mapped local positions to source coordinates and transmitted explicit ROI-relative area scope to the provider.
- Used the displayed report snapshot for actual reference requests, with historical-context guidance.
- Separated stable validation code for client caching without hiding or increasing the chunk-warning threshold. The image-analysis Worker is unchanged.

## 2026-11-03 — Recoverable local projects and analysis snapshots

- Added validated local project loading before workspace mount, debounced/revision-checked IndexedDB saving and clear save/error/conflict states.
- Restored source Files, palette evidence, count, independent manual choices, series order/primary/locks/strategies/drafts and ROI after successful saves and reloads.
- Added 30-step in-page undo/redo and atomic source/series/project edits with fresh, correctly released view URLs.
- Added local project backup/open with version/structure checks, image SHA-256 and decoding/dimension verification; failed imports preserve live work.
- Preserved captured-input analysis snapshots through ROI/role browsing and reload, marking historical inputs without automatic paid calls.
- Added model/history and real browser recovery, quota, invalid-data, cross-context backup and concurrent-window regression coverage.

## 2026-11-03 — Source fidelity and one palette-analysis entry

- Preserved original RGB statistics inside histogram bins and exact sampled colors for low-color inputs, fixing uniform-source drift and avoidable low-color merging.
- Routed single/series extraction through one versioned Worker pipeline; removed the old separate series decoder.
- Added per-source analysis provenance to JSON tokens and series reports, refreshing it with count changes.
- Retained successful batch files around corrupt items, with progress, named failures and later retry; existing edited drafts remain intact.
- Closed an absolute-distance loophole that could assign a dim red pixel to a blue-gray family; added six rotated dim-hue challenges and compatible-family/abstention cases.
- Updated fixture assertions to actual source colors and added original-RGB, resized cross-mode, export-metadata and partial-failure regressions.

## 2026-11-03 — Preserve manual choices during analysis and strategy changes

- Separated single-image manual role overrides from automatic suggestions, preserving both-domain choices during count-driven re-extraction and failed imports.
- Added independent unified-series drafts per domain/strategy and last-strategy restoration per domain, retained through reordering, primary changes and partial image removal; clearing all images starts fresh drafts.
- Applied manual unified roles before computing palette and locked-image exceptions so preview, role choices and exports agree. Untouched suggestions remain live; absent-source colors carry no invented area.
- Added visible manual markers and a scoped restore-automatic action. Drafts remain in-memory; project/reload recovery is not claimed.
- Added browser regressions for context boundaries and actual exports, plus domain regressions for override/lock/palette consistency.

## 2026-11-03 — Trustworthy contrast audits and role selectors

- Fixed normal-size secondary and colored status text being accepted at 3:1; these preview labels now use 4.5:1 with full-precision comparisons.
- Added explicit passed/failed/unexamined evidence and actual check counts; missing or invalid colors no longer become successful checks.
- Shared the same report between preview/export in single and series flows, rendered by one expandable audit component with scope and export guidance.
- Included fallback/current colors in role selectors, fixing selected-option/paint/export mismatch and keeping fallback colors available after edits.
- Added boundary, incomplete/invalid-report and actual-browser/download regressions. Export formats and dependencies are unchanged.
- Reordered development toward daily usability; manual edit preservation, project recovery, unified image processing and layout improvements remain subsequent units.

## 2026-11-03 — Repair color pipelines and add independent focus estimation

- Moved raster analysis and rendering to cancellable local Workers with response IDs and cache scoping; fixed rapid color-count changes and pending-import stale controls.
- Guarded denoising by original hue and perceptual error; clipped feather masks inward. Native-resolution ROI analysis now has a local detail preview and explicit re-import reset.
- Compared accent-preserving and coverage-oriented palette candidates without fixture exceptions, and improved substantial downscaling to reduce texture aliasing.
- Added whole-image/ROI contrast-based focus candidates independently of palette count, including multiple/no-focus states, numbered heatmaps and explicit semantic limits.
- Added geometric focus contracts, actual-overlay/race/ROI browser checks, an attributed 30-source development corpus and an optional independently annotated held-out focus evaluator.
- Defined multi-focus recall, candidate precision, no-focus false positives, aspect-aware localization and proposed 1000-image allocation in ATTENTION_EVALUATION.md. Human-label accuracy remains unmeasured.
- Separated the unchanged security audit into its own CI job so functional checks can run while the known development dependency advisory stays visible.

## 2026-11-02 — Reconcile conversation changes for GitHub synchronization

- Matched the October 28–November 1 conversation to all ten local commits after the previous GitHub baseline `de78279`; the implemented changes and historical test reports are already committed.
- Updated README and status to reflect implemented series comparison/unification rather than listing multi-image consistency as future work.
- Updated spatial/corpus verification dates and separated remaining hotspot, semantic-mask, real-image and production acceptance work from completed changes.
- Added `docs/REVIEWS/2026-11-02-github-sync.md` with the commit map and fresh verification results; production deployment acceptance remains separate.

## 2026-11-01 — Comprehensive local acceptance plan

- Established a product-specific layered plan covering algorithms, complete workflows, accessibility, reliability, performance, compatibility, security and deployment boundaries in `docs/TEST_PLAN.md`.
- Added empty/oversized/unsupported recovery, repeated source/mode changes, keyboard and 320/390/768 layout checks, real Art PNG export review and cross-resolution family stability.
- Passed 72 unit tests and 25 regular browser workflows with zero failures; the opt-in 50-image benchmark also passed 50/50.
- Confirmed Chromium coverage, 0 production dependency vulnerabilities and no real secrets in Git. Firefox/WebKit, production and broader real-world generalization remain explicitly unverified.
- Recorded results in `docs/REVIEWS/2026-11-01-comprehensive-test-report.md`.

## 2026-11-01 — Spatial precision and continuity optimization

- Increased global and spatial analysis from 320 to 512 pixels, adopted eight-neighbor connectivity for diagonal strokes and reduced highlight feathering to 0.65 px.
- Preserved zero red-like pixels in the night-city deep-blue selection and added a diagonal-continuity regression.
- Reused compatible analysis where safe, but found no meaningful measured speed improvement and do not claim a performance win.
- Re-ran all 50 benchmark images: mean time increased from 1.030 to 1.463 seconds; person/neon unassigned fell, while night-city unassigned rose to 22.9% and remains explicit rather than forced.
- Passed 72 unit tests and 20 regular browser workflows; detailed trade-offs are recorded in `docs/REVIEWS/2026-11-01-spatial-precision-optimization.md`.

## 2026-11-01 — Fifty-image timing and stability benchmark

- Added an opt-in `BENCHMARK=1` browser workflow covering 50 images in one session, including two real images and 48 deterministic synthetic fixtures.
- Recorded per-image/category timing, palette counts, unassigned evidence and failures; all 50 passed with normalized palettes, finite significance, both spatial modes and no stale ROI.
- Completed the benchmark in 56.711 seconds with a 1.030-second mean and 1.389-second 95th percentile; the measured mean implies about 17.2 minutes for 1000 similar runs before downloads and review.
- Documented results and limits in `docs/REVIEWS/2026-11-01-benchmark-50.md`; this is not a 50-real-image generalization claim.

## 2026-10-28 — Validated significance and discrimination metrics

- Added normalized visual-significance shares from deterministic area, local-contrast, chroma and multi-scale density evidence, with a small-accent regression and 100% normalization check.
- Added nearest-swatch OKLab discrimination with the nearest HEX, symmetric-distance tests and a single-color fallback; no arbitrary qualitative rating.
- Restored center share, component count and mean pixel separation in an expandable structure panel and added bounding-box spatial span.
- Passed 71 unit tests and 20 browser workflows, ESLint and production build, including multi-image NaN checks.

## 2026-10-28 — Dominant-location evidence and generative poster scenes

- Replaced misleading whole-color average placement with dominant-component location; distribution mode prefers the leading hotspot.
- Reduced the region panel to four decision-useful metrics: dominant location, actual area, connected integrity and edge contact. Advanced evidence remains available internally.
- Removed source-image cropping/pasting from Art preview and generated complete editorial scenes from role colors and dominant spatial positions.
- Added organic forms, atmospheric gradients, orbit/horizon structure and grain with responsive light/dark/mobile rendering and no poster image element.
- Passed 68 unit tests and 20 browser workflows, ESLint and production build.

## 2026-10-28 — Multi-image corpus and alias-resistant sampling

- Added permanent person and complex night fixtures plus deterministic product, landscape, UI, poster, monochrome, transparency, periodic and tiny-image coverage.
- Added sequential mixed-image browser verification for normalized palettes, both spatial modes, stale-state rejection and runtime stability.
- Replaced periodic-only sampling with deterministic stratified jitter after red-blue stripes exposed loss of the entire blue family.
- Added periodic unit/browser assertions and documented corpus scope and remaining real-world generalization limits.
- Passed 67 unit tests and 20 browser workflows, ESLint and production build.

## 2026-10-28 — Color-engine root-cause corrections and adversarial regression

- Corrected hue averaging through OKLab vectors, constrained salient chromatic centers and made emitted RGB/OKLCH swatches consistent.
- Added hue-compatible reassignment plus explicit unassigned evidence instead of forcing every pixel into an unrelated palette color.
- Replaced edge-repeating heatmap convolution with an average-density boundary after testing both corner amplification and uniform-field center bias.
- Prevented stale overlay display, deferred analysis until ROI drag completion and reset spatial state on source changes.
- Added a permanent complex night-city regression proving red-family preservation, zero red-like pixels in the deep-blue selection and ROI reset.
- Passed 66 unit tests and 17 browser workflows, ESLint and production build; higher-resolution sampling, actionable hotspots and region-edge refinement remain separate stages.

## 2026-10-28 — Multi-scale scattered-color distribution mode

- Added a dedicated distribution mode for neon, stars, textures and fragmented color fields instead of forcing them through connected-region logic.
- Preserved meaningful isolated lights, combined three density scales with local luminance contrast and chroma, and added weighted salient centroids, dispersion and hotspot evidence.
- Added palette-colored heatmaps with hotspot markers, full ROI/local-palette support and an explicit non-semantic, non-aesthetic contract.
- Added deterministic neon fixtures and unit/browser coverage, including mobile layout and region-mode switching.
- Passed 61 unit tests, 16 browser workflows, ESLint and production build.

## 2026-10-28 — Independent local palettes and complete color regions

- ROI now re-extracts an independent local palette with the same deterministic engine while preserving the whole-image palette.
- All approximate-color regions are shown by default so disconnected same-color areas are no longer hidden; largest-region mode remains optional.
- Local analysis selects the dominant in-scope color instead of an incidental high-chroma accent.
- Added independent-local-palette and browser regression coverage; reviewed the owner's person image for face/arm completeness and face-local extraction.
- Passed 57 unit tests, 15 browser workflows, ESLint and production build.

## 2026-10-28 — Region-of-interest color analysis

- Added pointer-based region selection so similarly colored skin, clothing and other objects outside the selected area no longer distort local spatial evidence.
- Aligned selection coordinates with the rendered image rather than its letterboxed container; mapped cropped assignments back to the original overlay.
- Kept whole-image palette shares unchanged, made local evidence explicit and prevented cropped evidence from being sent to AI as full-image context.
- Reviewed the reported shirt/skin capture and passed 56 unit tests, 15 browser workflows, ESLint and production build.

## 2026-10-28 — Connected-region highlighting and semantic boundaries

- Added largest/all connected-region display modes so similar colors on different objects need not appear as one undifferentiated mask.
- Added feathered highlight masks and explicit copy that approximate color regions are not semantic object segmentation.
- Kept isolated-noise cleanup and source-driven editorial posters; verified region toggles, actual screenshots, 55 unit tests, 15 browser workflows, ESLint and production build.

## 2026-10-28 — Source-driven poster and spatial denoising

- Replaced decorative-only poster composition with source-image-driven editorial framing, metadata and responsive layout.
- Added two-pass neighborhood cleanup limited to isolated components of at most two pixels, preserving meaningful connected color regions and detail.
- Unified spatial overlay and metrics on the same denoised assignments, with transparent-pixel handling and new noise/detail regression tests.
- Reviewed actual source-driven poster and spatial output; 55 unit tests, 15 browser workflows, ESLint and production build pass.

## 2026-10-28 — Editorial poster and AI report refinement

- Rebuilt Art/Poster with a modern editorial grid, stronger Chinese display hierarchy, metadata, orbit/core/plane/axis composition and responsive behavior.
- Added preview-only contrast fallback when primary visual equals canvas, preventing invisible main artwork without changing user roles.
- Reorganized AI results into summary, visual evidence, role rationale, executable actions and uncertainty with clearer typography and card structure.
- Reviewed actual desktop/mobile/AI screenshots; 54 unit tests, 15 browser workflows, ESLint and production build pass.

## 2026-10-28 — Spatial evidence and region-aware AI analysis

- Added deterministic spatial evidence for palette regions: centroid, bounds, center/edge shares, connected components and color separation.
- Added local original-image region highlighting with transparent-pixel and small-dimension handling.
- Explained why spatial nearest-color shares can differ slightly from weighted-cluster shares.
- Added optional schema-validated spatial evidence to DeepSeek requests and prompt guidance for backgrounds, central subjects and salient accents.
- Verified real DeepSeek spatial analysis with HTTP 200; 54 unit tests, 15 browser workflows, ESLint, production build and 0-vulnerability audit pass.

## 2026-10-28 — Salient subject-color and OKLab correction

- Reproduced a user-reported case where small red subject regions disappeared from extracted palettes under dominant neutrals.
- Added hue-bin salience protection for chromatic clusters covering at least 0.5% of sampled pixels without giving them fabricated area shares.
- Corrected palette and series distance calculations to convert LCH hue/chroma into true OKLab coordinates instead of subtracting hue degrees as a linear channel.
- Added saturated-subject and hue-wrap regression coverage; 50 unit tests, 14 browser workflows, ESLint, production build and 0-vulnerability audit pass.
- Owner confirmation with the original production image is still required.

## 2026-10-28 — Series merge and production verification boundary

- Merged the reviewed deterministic series workflow to `main` at `f4c1d92` and pushed successfully.
- Confirmed the deployed page exposes the new mode switch.
- Added a reusable production series verification script; local network timeouts currently block its completion, so interactive production verification remains pending.

## 2026-10-28 — Series unification and production exports

- Added Follow Primary, Balanced and Preserve Accents strategies using existing-role medoids rather than RGB averaging, with primary/candidate role locks.
- Defaulted to Preserve Accents for safer intent retention and made independent exceptions visible.
- Added unified role editing, existing Web/Art previews, WCAG checks, CSS/tokens/report exports and versioned series schemas.
- Replaced unreliable whole-workspace DOM capture with a native Canvas series overview PNG using filenames instead of internal IDs.
- Passed 48 unit tests, 14 browser workflows, ESLint, production build and 0-vulnerability audit; desktop/mobile and actual PNG output reviewed.

## 2026-10-27 — Deterministic series difference engine

- Added provider-independent series records and one-to-one OKLCH color matching with shared, missing and additional color evidence.
- Added share deltas, per-role differences, all-member shared colors and stable candidate ordering.
- Normalized share-delta precision and strict share-record typing after test/build review.
- Added eight tests covering identical images, near colors, role correction, all-member sharing, reordering, primary changes and invalid definitions; 38 unit tests, ESLint and production build pass.

## 2026-10-27 — Series state and diagnostic workflow

- Added explicit single/series modes while preserving single-image state and per-domain role edits.
- Added local 2–6 image import, reorder, remove, primary selection, object-URL cleanup and responsive thumbnails.
- Added series overview with shared colors and explainable deviations, plus primary/current image inspection and independent role correction.
- Fixed CSS `display` overriding native `hidden`, added visibility assertions and visually reviewed desktop/mobile screenshots.
- Passed 40 unit tests, 13 browser workflows, ESLint and production build. Unification strategies and exports remain pending.

## 2026-10-27 — Series engine boundary review

- Replaced greedy pairing with deterministic maximum-cardinality, minimum-cost one-to-one assignment after finding an adversarial color-match case.
- Added explicit missing-role diagnostics with nullable evidence instead of silently ignoring absent roles.
- Documented match thresholds, stable ordering and precision contracts; added adversarial and missing-role coverage.
- Passed 40 unit tests, 11 existing browser workflows, ESLint, production build and 0-vulnerability audit. UI and exports remain unimplemented.

## 2026-10-27 — Series consistency product contract

- Defined series mode as explainable color-system diagnosis and unification, not multi-image picking or automatic recoloring.
- Approved three task levels, three unification strategies and explicit role/exception corrections.
- Added fourteen acceptance tests covering determinism, semantic uncertainty, intentional variation, state, mobile, exports and AI independence.
- Created the isolated `feat/series-consistency` implementation branch; no feature code is implemented yet.

## 2026-10-27 — Systematic stage-gate review and reliability hardening

- Reviewed functionality, production reliability, cost protection, secret boundaries, tests, deployment and documentation before the next feature phase.
- Added native Cloudflare rate limiting before paid request processing, with production 429 verification.
- Added a 90-second analysis timeout, safe error classification and at most one retry for transient provider failures.
- Prevented stale analysis/reference responses from replacing newer image or domain state.
- Passed 30 unit tests, 11 browser workflows, environment safety, ESLint, production build and 0-vulnerability audit.
- Recorded a scoped PASS for the personal public preview; strict global quotas remain a future high-traffic requirement.

## 2026-10-27 — Production DeepSeek verification

- Configured `AI_API_KEY` exclusively as a Cloudflare Production secret; no credential was added to Git.
- Synchronized non-secret provider settings in `wrangler.jsonc` for consistent Git deployments.
- Added credential-safe provider failure reasons and a regression test; 28 unit tests, ESLint and production build pass.
- Verified production health with `configured: true` and `provider: deepseek`.
- Completed a real production DeepSeek Flash multimodal request with HTTP 200 and accurate color-field and area analysis.
- Real Unsplash access remains pending application review.

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
- Added WCAG 2.1 contrast checks with visible pair labels and ratios.
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
- Added responsive two-column mobile swatches and final-state visual reviews.
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
