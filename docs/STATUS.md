# Palette Lab — Current Status

_Last updated: 2026-11-03_

## Current phase

The local image pipeline now runs in cancellable Workers with hue/perceptual denoise guards, inward-clipped masks, native-source ROI detail, import/count race protection and adaptive palette candidate selection. Independent whole-image/ROI contrast-based focus estimation supports multiple/no-focus outcomes. Type checking, lint, 147 unit tests and environment-safety checks pass; the current 50-image browser benchmark passed 50/50 in 55.084 seconds. The full browser and external development-corpus acceptance is recorded in the November 3 repair review. Human attention accuracy is not measured without independent annotations.

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
- HEX output is normalized to six digits
- 147 unit tests and 29 regular browser workflows pass locally; 50/50 benchmark fixtures and 30/30 independent development sources pass separately
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
- Web and Art role edits are preserved independently across domain switches
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

Collect an independent two-reviewer focus annotation pilot and freeze held-out criteria; then qualify on balanced labeled images. Investigate remaining category-level color coverage regressions, broaden photographic product/portrait data, and complete Firefox/WebKit and deployed-revision acceptance. Keep the current development-only minimatch audit issue visible until a compatible dependency-chain update is reviewed.
