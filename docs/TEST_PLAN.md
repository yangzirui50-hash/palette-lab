# Palette Lab Comprehensive Test Plan

_Last updated: 2026-11-03_

## 1. Product-specific quality goals

Palette Lab is not only an image picker. It is a local-first color-system workspace with palette extraction, spatial evidence, local ROI analysis, role editing, Web/Art previews, AI analysis, inspiration, series workflows and production exports. Tests must prove complete user workflows and algorithmic contracts, not just page rendering.

Priority meanings:

- **P0 — correctness and data integrity**: wrong colors, cross-color contamination, stale state, broken exports, privacy leaks or unusable core flows.
- **P1 — reliability and usability**: responsive layout, accessibility, error recovery, timing regressions and repeated interaction.
- **P2 — generalization and production scale**: broad independent real imagery, multiple engines/devices, online deployment and large corpus benchmarking.

## 2. Layered test matrix

| Layer | Required checks | Evidence |
|---|---|---|
| Palette extraction | Hue wrap, multiple chromatic families, small accents, neutral/single color, periodic alias, normalized shares, RGB/OKLCH consistency | Unit and fixture assertions |
| Spatial assignment | No unrelated cross-color highlight, compatible reassignment, explicit unassigned, transparent pixels, deterministic output | Pixel-level regression |
| Regions and distribution | Diagonal continuity, dominant location, disconnected areas, uniform fields, isolated lights, edge/corner fairness, hotspot validity | Unit, screenshots and neon/night fixtures |
| Metrics | Significance normalization, high-contrast accent weight, nearest-swatch discrimination, dominant location, no NaN | Formula tests and mixed-image checks |
| ROI and state | Independent local palette, global preservation, pointer alignment, commit-on-release, reset on source change, no stale overlay | Browser workflows |
| Roles and previews | Independent Web/Art roles, contrast warnings, no source-image pasting, spatially informed generative poster | Role and visual checks |
| Exports | CSS variables, versioned JSON/schema, real Web/Art PNG content, series artifacts | Download and image review |
| AI and inspiration | Structured response, bounded retry, timeout, rate limit, provider metadata, no fabricated real-provider result | Worker/mock tests; real provider separately |
| Series | Import/reorder/remove/primary, independent roles, unify strategies, shared/missing colors, mobile and exports | Series workflows |
| Error recovery | Empty/unsupported/oversized input followed by valid recovery, no persistent error or stale content | Browser regression |
| Accessibility | Accessible names, keyboard activation, visible focus, native details, contrast status, no horizontal overflow | Keyboard and viewport checks |
| Performance | Per-image/category timing, rapid repeated operations, 50-image benchmark, no runaway failure | JSON timing reports |
| Privacy/security | Local processing by default, AI consent, secret exclusion, credential-safe errors, schema/rate limiting | Git and Worker checks |
| Compatibility | Chromium, Firefox, WebKit where installed; 320/390/768/desktop viewports | Engine/viewport report |
| Deployment | Public assets, production health, real deployment revision, no mock/secrets | Separate online acceptance |

## 3. Current acceptance gates

### P0

- Zero red-like pixels in the permanent deep-blue night-city selection.
- No missing chromatic family in red-blue periodic regression.
- Palette shares normalize within 99–101%; no NaN/Infinity in displayed evidence.
- No stale ROI, overlay, role edit or single-image state after source/domain changes.
- All core downloads are real and reviewed; no source image is embedded in the generative poster.
- No secret is added to Git or printed in logs.
- No open P0 failure may be described as passed.

### P1

- 320, 390, 768 and desktop widths have no horizontal overflow.
- Core controls have accessible names and keyboard operation; advanced metrics work with native keyboard details.
- Unsupported/oversized input can be followed by a valid image without reload.
- Current-machine performance is compared with the 50-image baseline rather than hidden: mean 1.463 s and p95 2.373 s at 512 px. New regressions must be explained.
- Repeated source/domain/ROI changes cannot display an older result under a new selection.

### P2

- Broader independent real-image corpus is required before claiming universal real-world accuracy.
- Firefox/WebKit coverage counts only if the engine actually launches and completes the checks.
- Production acceptance is separate from local success and requires the deployed revision to be identified.
- A 1000-image run measures scale only after dataset licensing, category balance and held-out separation are defined.

## 4. Execution phases

1. **Foundation**: unit tests, current permanent fixtures, privacy and Worker tests.
2. **Core workflows**: single image, series, roles, previews, exports, error recovery and repeated operations.
3. **Access and compatibility**: keyboard, viewport and available browser engines.
4. **Algorithmic quality**: cross-color, continuity, metrics, resolution stability and visual review.
5. **Performance**: regular browser suite plus opt-in 50-image timing benchmark.
6. **Production/generalization**: real corpus, online deployment, Unsplash and real-provider checks when available.

## 5. Reporting rules

Every report distinguishes unit tests, regular browser workflows, opt-in benchmarks, real versus synthetic images, local versus production, and passed/failed/not-run. No single aggregate percentage may hide a failed category or an unexecuted environment.

Historical November 1 execution result: see `docs/REVIEWS/2026-11-01-comprehensive-test-report.md` — 72 unit tests and 25 regular browser workflows passed locally; 50/50 benchmark images passed. Firefox/WebKit, production and broader real-world generalization remain not run or unverified.

## November 3 additions

Mandatory regression covers denoising enabled, actual rendered overlay pixels, import/count races, native ROI detail, re-import reset and visible multiple/no-focus results. Optional 30-image development runs exercise 4/6/8 colors, both modes, normalized shares, provenance hashes, no network API, no stale ROI and unchanged focus candidates across palette counts. High-quality resampling is part of the pipeline under comparison.

Focus contracts, independent region annotation protocol, multiple-focus recall/precision, no-focus false positives, center baseline, aspect-aware error, held-out gates and the proposed 1000-image allocation are defined in `ATTENTION_EVALUATION.md`. The human-label gate is not run until a qualifying independent dataset exists. The current change does not claim Firefox/WebKit or real-device acceptance.

## Contrast and role trust regression (2026-11-03)

Check normal-size secondary/status text at 4.5:1 using unrounded ratios; missing/invalid pairs are unexamined and excluded from checked/passed counts. Empty reports must not show success in either preview or export. Browser regressions use an actual black/gray/white image to verify the 12px gray-text warning, shared single/series audit presentation, fallback options in both domains and downloaded JSON role values. Single-color input must show the assigned fallback colors instead of a misleading first palette option. Correct additional default-scheme warnings are expected, not suppressed.

The first trust unit does not change extraction/attention algorithms; 50-image timing and external-development/human-annotation suites are not rerun for that change. Their earlier results remain historical baselines. Preservation through re-extraction is covered by the next unit below; project recovery remains unfinished.

## Manual edit preservation regression (2026-11-03)

The next unit covers retention through rapid count changes (including a chosen color absent from the new palette), both-domain choices, scoped reset, failed and successful source replacement, domain/strategy draft switching and last-strategy restoration per domain, reordering/primary changes, partial/all series removal, and real JSON export. Unified domain tests cover retained out-of-source colors, updating untouched suggestions, and locked-image exceptions recalculated against the edited base. Restoring a draft is distinct from recovering a project after reload, which remains unimplemented.

## Source fidelity and shared entry regression (2026-11-03)

Exact uniform RGB, distinct low-color values sharing a histogram bin and source-based grayscale cluster means have unit coverage. Eight further regressions cover dim cross-hue conflicts, six hue rotations, abstention and compatible-family fallback before/after denoising; six positive same-hue muted-family tests prevent inappropriate abstention. Browser cases cover original-color preview/download, low-color proportions below the sampling limit, metadata refreshed after count changes, identical single/series resized evidence, a corrupt middle batch item, later retry, and all-failed batches retaining an existing edited draft. Historical fixture expectations use their actual decoded colors (#0a0a0a, #dfff4f, #4a90e2), not the old grid values. Because extraction outputs changed, rerun the 50-image benchmark and existing licensed 30-image development count/view matrix. Compare the worst per-image unassigned-area deltas as well as aggregate processing success. Those operational gates do not prove independently labeled focus accuracy or universal palette quality.

## Project recovery regression (2026-11-03)

Unit contracts cover versioned records, valid source/role/palette invariants, series references/unique IDs, context canonicalization, undo/redo branches, no-op/browsing behavior and bounded history sharing File references. Eleven browser cases cover single/series reload, count/domain/strategy/lock/order restoration, backup into a fresh browser context, unsupported versions, bad checksums and image decoding, source/new-project/series undo, undo back to initial empty and subsequent reload, retained reports across ROI/roles/reload without another request, quota failures with working backup, unreadable-record protection and concurrent-window conflicts. Browser page errors must remain empty even on expected failure paths. Image selectors distinguish the source input from the project-backup input.

Complete local acceptance is 188 unit tests and 52 regular browser workflows, plus a final eleven-case recovery rerun after transient-feedback cleanup. Image algorithms are unchanged from the previous unit, so 50/30-image and independent annotation suites are skipped here; the previous unit's results remain separate evidence. Production-build/public smoke imports an explicitly labeled offline report fixture and blocks all API requests; it does not claim a new real-provider request.

## Working colors and delivery regression (2026-11-03, fifth unit)

208 unit tests in 23 files and 58 regular browser workflows pass; three opt-in suites are skipped. New coverage checks three/six-digit HEX normalization/rejection, candidate source/scope invariants, backwards-compatible version-1 records, ROI-to-source coordinate mapping, zero-pixel preview fallback and explicit provider scope. Six browser workflows trace manual/ROI colors through source-share preservation, undo/redo, domains, series strategies, reload and actual JSON/PNG downloads. Card verification checks 1200×720 dimensions and both source/applied-role pixels. Historical report selection is checked against the actual dependent request body. Desktop composition, mobile export visibility, series task navigation and duplicate IDs are checked.

Type, lint, environment safety and full production build pass. Local/public production-build smoke is separate, blocks APIs and verifies actual source colors, manual roles/candidate recovery, palette-card download, mobile navigation and zero-share custom series export. No image algorithm change means no new 50/30-image run; no independently labeled accuracy, real-provider request, Firefox/WebKit or real-device acceptance is implied.

## Human-pilot tool QA (separate from human quality)

Six `node --test scripts/attention-pilot.test.mjs` checks cover one-to-one region assignment, missing/partial data, uncertainty/disagreements, identity/checksum/duplicate/completion validation, geometry/state consistency and the actual CLI's byte checks/escaped HTML output. Two browser workflows use clearly synthetic records to verify drawing, confirmation, uncertainty notes, reload, identity-checked progress restore/export, A/B isolation and phone width. The existing 58 application workflows are unaffected; the regular runner now includes these two tool workflows as well.

The generated real packet separately loads all 30 original hash-verified images via local file pages, with zero network/API requests or browser errors. This is read-only packet QA: zero human labels are created. Images are excluded from Git; generation scripts, provenance, protocol and tests are committed. Human pilot answers and qualifying held-out accuracy remain not run.
