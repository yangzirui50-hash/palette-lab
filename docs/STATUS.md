# Palette Lab — Current Status

_Last updated: 2026-11-03_

## Current phase

Three daily-use repair units are implemented: truthful contrast/role selections, page-scoped manual drafts, and faithful sampled RGB with a shared single/series Worker pipeline. Batch import retains successful items around failures, and JSON records processing provenance with publicly resolvable schemas. Dim cross-hue conflicts and muted same-hue false rejection have complementary regressions. Type checking, lint, 178 unit tests, 41 regular browser workflows, environment safety and production build pass. The 50-image operational benchmark and licensed 30-image 4/6/8-color development matrix also pass; independent human focus qualification remains skipped. See docs/REVIEWS/2026-11-03-source-pipeline.md. Persistent project recovery is next. Public release acceptance is recorded separately from local checks.

## Production (historical checks; repair revision acceptance is separate)

- Public URL: https://palette-lab.3476554092.workers.dev/
- Cloudflare Workers is connected to the dedicated GitHub repository and `main` branch.
- Public image import, exact three-color extraction, dark Art rendering and 390 px mobile layout are verified.
- Public API health returns HTTP 200 with `configured: true` and `provider: deepseek`.
- `AI_API_KEY` is stored only as a Cloudflare server-side secret; non-secret provider settings are synchronized in `wrangler.jsonc`.
- A real production DeepSeek Flash multimodal request returned HTTP 200 and correctly identified the test image's three color fields and 50% / 32.5% / 17.5% area relationship.
- The production response identifies `provider: deepseek` and `model: deepseek-flash`; mock output was not used.

## Verified

- Product, architecture, roadmap and multi-platform documents are established
- React + TypeScript + Vite production build passes
- Hono + Cloudflare Workers foundation is configured
- Web/UI and Art/Poster profiles are defined
- OKLCH palette clustering returns deterministic colors and normalized shares
- HEX output is normalized to six digits; non-grid uniform sampled RGB and low-color source distinctions are preserved
- Single and series palette extraction share versioned decoding/preprocessing/Worker execution and exported per-source provenance
- A corrupt batch item no longer discards successful items or prevents following files from being attempted
- 178 unit tests and 41 regular browser workflows pass locally after the source/pipeline unit. Its complete browser run passes 43 tests including the 50-image benchmark and 30-image development matrix, with independent human-focus qualification skipped. A final schema-link-only change also passes three targeted real-download workflows.
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

Next implement validated local project records, recovery, backup round-trips and reversible editing; the current published manual drafts do not yet survive reload. Preserve report snapshots across browsing/ROI changes before improving task layout and local-color application. Inspect worst per-image quality changes alongside aggregate passes: a four-color portrait remains a human-review case (+3.5 percentage points unassigned versus the earlier pipeline). Independent focus qualification remains before the 1000-image scale run. Keep the existing development-only minimatch audit issue visible until a compatible update is reviewed.
