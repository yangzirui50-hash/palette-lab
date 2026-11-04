# Palette Lab — Current Status

_Last updated: 2026-11-04_

## Current phase

The owner selected whole-image interpretation first, with local cues on demand. Branch `feat/whole-image-reading` implements that choice in the actual workbench: clean original imagery, composition/character paragraphs, initially closed relation/local/uncertainty disclosures, and optional legacy subject-priority analysis. The prior thirty plus four verbal image judgments remain archived privately; do not request them again. This is a changed output question, not a validated attention-ranking improvement.

The separate `/api/reading` task has runtime schema, prompt/input identity, source-owned history (maximum ten), legacy-backup compatibility and stale-result guards. An explicit click requests both scales together; ordinary editing, ROI inspection, reload and detail disclosure reuse the saved reading. The old focus and aesthetics histories are retained separately. No extra detector, model, dependency, automatic reasoning review or role reassignment is introduced by this feature.

Local verification on the existing dependency tree: 253 unit tests, 80 regular browser workflows (four opt-in suites skipped), lint/type/build/environment safety. Eight real source-handler tasks succeeded with nine upstream HTTP requests; a separate built-client browser workflow succeeded with one real DeepSeek request and verified phone layout, saved-result reuse and no browser errors. The handler probes and loopback built-client preview are not deployed Cloudflare acceptance or attention-accuracy measurements. See `REVIEWS/2026-11-04-whole-image-delivery.md`.

The complete usable loopback workbench is available at http://127.0.0.1:7113/ while its local server runs. Feature publication and the independent pre-existing dependency audit gate are recorded separately; production main remains `ed7d32f` at this verification stage. The next engineering step is publication after reviewing the compatibility/security gate; the next product evaluation concerns usefulness for palette decisions, not another repeat focus annotation.

Historical stages follow; their earlier pending presentation decisions and test counts do not supersede the current candidate record.

Presentation follow-up: default image readability takes precedence over grid visualization. The prototype now shows unpainted source/ROI pixels with an optional contrast-evidence toggle, initially off and reset on source replacement. The filled-grid default was rejected in review; that is a presentation decision, not semantic focus acceptance. Follow-up verification passes 230 unit tests and 71 browser checks (70 regular plus 50-image benchmark), with three opt-in suites skipped. Production main is unchanged; the prototype remains isolated.

Local review branch `fix/focus-structure-prototype` now carries `1.2.0-prototype`, based on published daily reliability plus the prior focus candidate. The full verbal review has been received and archived privately; it identified unresolved subject, ordering, missing-region and over-localization problems. The current unit removes nearest-supported-cell projection, preserves measured response masks, groups connected parent support and separates contrast evidence from perceived-focus claims. See `FOCUS_OUTPUT_CONTRACT.md`. No semantic focus acceptance or production merge is implied. The previous release and candidate records below are historical.

Independent daily-operation follow-up: newer count intent survives interleaved analysis commits; clipboard denial is recoverable; all six series exceptions and long names fit the PNG; blocked downloads clean up and retry. Local verification is 212 unit tests, seven pilot CLI/server tests and 67 regular browser workflows, plus type/lint/environment safety and production-build checks recorded separately. The image/focus algorithm is unchanged. Candidate 1.1.0 remains on `fix/focus-region-evidence` awaiting the owner's later per-image feedback; it is not included in this release.
Review candidate `fix/focus-region-evidence` implements focus model 1.1.0: measured-support region growth, protected strong targets, supported positions, explicit uncertainty/reasons and response bounds. It also repairs count intent being overwritten by interleaved analysis completion. See `REVIEWS/2026-11-03-focus-regions.md`. This algorithm candidate is separate from published main; no human focus-accuracy acceptance is claimed.

Five daily-use repair units are implemented. The latest connects native-ROI candidates and validated manual HEX to recoverable role edits, adds a palette-card PNG and nearby desktop preview/export with phone navigation, and fixes report selection and ROI evidence scope. Validation code has a separate stable chunk; main client JS is about 446kB (147kB gzip), plus 98kB (28kB gzip) validation. This improves caching rather than removing first-load validation cost. See docs/REVIEWS/2026-11-03-workbench-delivery.md. Release checks are recorded separately from local regression. The preceding source-pipeline unit's 50/30 operational suites are not rerun for unchanged image algorithms; independent human focus qualification remains pending.

## Production (historical checks; repair revision acceptance is separate)

- Public URL: https://palette-lab.3476554092.workers.dev/
- Cloudflare Workers is connected to the dedicated GitHub repository and `main` branch.
- Public image import, exact three-color extraction, dark Art rendering and 390 px mobile layout are verified.
- Public API health returns HTTP 200 with `configured: true` and `provider: deepseek`.
- `AI_API_KEY` is stored only as a Cloudflare server-side secret; non-secret provider settings are synchronized in `wrangler.jsonc`.
- A real production DeepSeek Flash multimodal request returned HTTP 200 and correctly identified the test image's three color fields and 50% / 32.5% / 17.5% area relationship.
- The production response identifies `provider: deepseek` and `model: deepseek-flash`; mock output was not used.

## Verified

- Fifth-unit local acceptance: 208 unit tests and 58 regular browser workflows pass, followed by actual production-build and public smoke. GitHub verify succeeds for 2bb529f; security remains the separately reported dependency failure.
- The two-reviewer 30-image development-pilot tool and comparison workflow are prepared. Human annotations and held-out focus qualification remain pending. The six corpus prefixes are retrieval buckets, not proof of actual-content balance.

- Product, architecture, roadmap and multi-platform documents are established
- React + TypeScript + Vite production build passes
- Hono + Cloudflare Workers foundation is configured
- Web/UI and Art/Poster profiles are defined
- OKLCH palette clustering returns deterministic colors and normalized shares
- HEX output is normalized to six digits; non-grid uniform sampled RGB and low-color source distinctions are preserved
- Single and series palette extraction share versioned decoding/preprocessing/Worker execution and exported per-source provenance
- A corrupt batch item no longer discards successful items or prevents following files from being attempted
- 188 unit tests and 52 regular browser workflows pass locally after project recovery. Three image/annotation opt-ins are skipped because the image algorithm is unchanged. An additional final eleven-case recovery run and production-build smoke pass, including fresh-context backup and explicit offline-report restore with no API calls.
- Local saving protects unreadable records and concurrent-window updates; quota failure retains editing and backup. Project import checks image hashes, decoding and dimensions before replacing live work.
- 30-step in-page undo/redo restores atomic image/series/project edits with regenerated URLs; it resets after reload. Reports retain up to 20 captured-input snapshots and explicitly mark changed inputs.
- The 2026-10-27 systematic stage gate passes for the personal public-preview scope; see `docs/REVIEWS/2026-10-27-stage-gate.md`
- Production native rate limiting returns 429 with `Retry-After: 60`; AI timeouts, bounded retry and stale-response protection are verified
- Online inspiration and AI comparison are verified with attributed mock fixtures
- Real Unsplash access-key verification is pending owner registration
- Mock multimodal analysis returns structured reports through the real Worker API
- Real DeepSeek Flash analysis completed successfully with HTTP 200 on 2026-10-27
- The real model correctly identified the test image's three color fields and composition; mock output was not reused
- `scripts/verify-real-provider.mjs` checks the real Worker/provider chain and redacts credentials from failure logs
- Test environment is restored before production builds to prevent mock deployment
- CSS variables, versioned JSON tokens and 2× PNG previews pass real download verification
- Web and Art manual role choices survive count-driven re-extraction independently; successful new-source import starts a fresh draft, while failed imports preserve it
- Unified-series drafts and last strategy are restored per domain; primary/reorder and partial removal preserve choices, with scoped reset and explicit locked-image exceptions
- JSON exports reference a real versioned schema in `public/schemas/`
- Exported Web PNG is visually reviewed for complete content
- Automatic role assignment avoids obvious muted-text/surface collisions
- Browser image import, local Canvas preprocessing, palette display and HEX copying are verified
- Single-color inputs receive usable neutral roles and semantic fallbacks
- WCAG 2.1 contrast checks flag unreadable role edits with pair labels and ratios
- Eight Web roles and six Art roles are editable and reflected in real previews
- Stale upload responses are ignored and their object URLs are released
- Clipboard fallback and unsupported-file feedback have browser coverage
- Large color fields, palette proportion visualization and responsive mobile swatches are verified
- All dark domains use the unified charcoal and yellow-green accent system
- Light Web uses porcelain and deep teal; Light Art uses warm paper and restrained vermilion
- Light surfaces separate page, workspace, adjacent panels, headings, inputs and swatches with measured contrast and elevation
- Light/dark themes and all four Web/Art combinations preserve palette data
- Theme preference persists after reload; extracted HEX values remain unchanged
- Desktop and 390px mobile layouts pass without horizontal overflow
- ESLint passes
- Runtime dependencies reduced from 48 to 7
- The November 3 security recheck found a moderate development-only minimatch advisory (GHSA-g3hv-75wg-m249); earlier zero-vulnerability reports are historical. The audit job remains active and fails while this is unresolved.
- The last synchronized baseline a4376fd failed its npm audit step; historical green CI is not current acceptance. Security and functional verification now run as independent jobs without suppressing audit failures.

## Repository

- Baseline commit: `7373a48 chore: establish Palette Lab project foundation`
- Documentation commit: `eb479ee docs: establish synchronized project documentation`
- Ambient specification commit: `4b254e1 docs: specify ambient background customization`
- Ambient specification and backup-status commits are synchronized with remote `main`; the retry succeeded on 2026-10-26
- AI foundation, DeepSeek verification, online inspiration and environment-safety commits through `363ddeb` are synchronized with remote `main`
- DeepSeek Flash real analysis succeeded again on 2026-10-27 after secure local key reconfiguration, with HTTP 200 and correct image-specific analysis
- Local key setup uses hidden input or clipboard transfer without displaying secrets; `.dev.vars` remains excluded from Git
- `test:env` now proves real configs are preserved and mock files are removed only when explicitly marked
- Remote: https://github.com/yangzirui50-hash/palette-lab
- The November 2 reconciliation maps all ten previously unpushed commits, from `429f7a7` through `a2b34ca`, to the October 28–November 1 conversation and checked-in code/tests/reports. See `docs/REVIEWS/2026-11-02-github-sync.md` for scope, verification and the distinction between repository synchronization and production acceptance.

## Not implemented yet

- Ambient background mode and adaptive accent generation
- Real Unsplash access while the owner's application is under review
- Clickable distribution hotspots that generate local palettes
- Interactive semantic object masks and further region-edge refinement

## Next action

The owner will provide the 30-image focus feedback later; preserve the candidate branch, self-contained contact report and original human drafts, and accept sequential verbal feedback without requiring a new drawing/export session now. These development images cannot become held-out qualification data. Independent daily-operation fixes may continue without merging the candidate focus algorithm. Inspect worst per-image quality changes, freeze standards and obtain independent labels before the thousand-image stage. Keep the existing development-only minimatch audit issue visible until a compatible update is reviewed.
