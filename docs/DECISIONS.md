# Architecture Decision Records

## ADR-001 — Domain profiles instead of universal aesthetic rules

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Web/UI and Art/Poster share the color engine but define separate color roles, previews, exports and analysis prompts.
- **Reason:** Different design fields have different usability and visual requirements.

## ADR-002 — Local-first color processing

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Deterministic image processing runs locally; AI and stock services are optional enhancements.
- **Reason:** Privacy, reliability, offline utility and lower API cost.

## ADR-003 — Provider adapters

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** AI analysis and inspiration search use replaceable provider contracts.
- **Reason:** Avoid vendor lock-in and preserve future implementation choices.

## ADR-004 — Hono on Cloudflare Workers

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Use Hono with Cloudflare Workers for protected API calls when online features are introduced.
- **Reason:** Unified TypeScript development, server-side secrets and a clear deployment path.

## ADR-005 — Independent Vitest configuration

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Run deterministic tests with a separate Node-oriented Vitest configuration.
- **Reason:** Avoid starting the Cloudflare development server during unit tests.

## ADR-006 — One core for responsive web and native wrappers

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Build desktop and mobile responsive web experiences first, then support PWA installation, Tauri desktop packaging and Capacitor mobile packaging without forking product logic.
- **Reason:** Preserve development speed and local-first portability while leaving practical software-distribution paths open.

## ADR-007 — Deterministic OKLCH palette clustering

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Use weighted sampling and deterministic OKLCH clustering for palette extraction, with six-digit HEX output and normalized shares.
- **Reason:** Reproducible results, perceptually meaningful grouping, portable tests and consistent exports without requiring an AI call.

## ADR-008 — Current-use dependencies with audited overrides

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Keep only dependencies required by current code or the active phase, remove template leftovers, enforce `npm audit` in CI, and use narrow compatible overrides for upstream security fixes.
- **Reason:** Reduce supply-chain exposure and maintenance cost without hiding vulnerabilities through unreviewed breaking downgrades.

## ADR-009 — Independent theme and domain tokens

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Treat Light/Dark and Web/Art as independent token axes with separate text, fill and on-fill accents, while preserving workflow, component structure and palette state.
- **Reason:** Support distinct modern and editorial visual directions without maintaining four separate applications or sacrificing usability.

## ADR-010 — Content-first creative workspace

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Prioritize canvas and large color fields over marketing copy, add a proportional palette strip, and replace fluorescent light-theme accents with muted indigo while lowering Art vermilion saturation.
- **Reason:** Improve repeated-task ergonomics and color judgment by applying patterns common to professional palette and canvas tools without copying a specific product.

## ADR-011 — Unified dark accents with independent light domains

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Use the owner's neutral charcoal and yellow-green accent system across all dark domains; design Light Web independently with porcelain and deep teal, and Light Art with warm paper and restrained vermilion.
- **Reason:** Preserve a familiar dark identity while avoiding fluorescent accents in the light workspace. This supersedes the indigo accent experiment from ADR-010.

## ADR-012 — Light hierarchy through surfaces before borders

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision:** Separate light backgrounds, alternate panels, primary panels, inputs and swatches with measured tonal contrast, structural borders and two-level shadows; keep the dark theme unchanged.
- **Reason:** Improve scanability and perceived structure without returning to harsh grid-like borders or flat white expanses.

## ADR-013 — Constrained ambient theming

- **Status:** Accepted for a future phase
- **Date:** 2026-10-26
- **Decision:** Offer Standard and Ambient modes. Ambient mode combines a blurred image, neutral scrim and one contrast-checked accent with mostly neutral surfaces; users may override or disable it.
- **Reason:** Add image-driven personalization without compromising readability, palette accuracy or the standard workspace.

## ADR-014 — Semantic fallbacks and WCAG verification

- **Status:** Accepted
- **Date:** 2026-10-27
- **Decision:** Use explicit neutral and semantic fallbacks for degenerate palettes, and validate role pairs with WCAG 2.1 before treating them as export-ready.
- **Reason:** Prevent invisible status colors, unusable single-color previews and unchecked accessibility regressions during manual editing.

## ADR-015 — Independent domain editing state

- **Status:** Accepted
- **Date:** 2026-10-27
- **Decision:** Store role assignments per domain and preserve each domain's manual edits across switches; back JSON exports with a real versioned schema and inspect actual PNG output.
- **Reason:** Prevent silent work loss and unverifiable export contracts while maintaining deterministic local workflows.

## ADR-016 — Schema-validated AI with isolated mock verification

- **Status:** Accepted
- **Date:** 2026-10-27
- **Decision:** Validate AI requests and reports with Zod, keep provider secrets in the Worker, use a deterministic mock for tests, and restore pre-test environment before production builds.
- **Reason:** Add multimodal analysis without leaking keys, trusting malformed output, weakening offline workflows or shipping mock mode.

## ADR-017 — Provider registry with explicit capability boundaries

- **Status:** Accepted
- **Date:** 2026-10-27
- **Decision:** Register provider protocol, default model, endpoint, vision and structured-output capabilities; mark custom providers as unimplemented instead of pretending compatibility.
- **Reason:** Enable fast provider switching while preserving model-specific validation, honest capability reporting and credential safety.

## ADR-018 — Attributed references with bounded AI comparison

- **Status:** Accepted
- **Date:** 2026-10-27
- **Decision:** Derive Unsplash searches from validated analysis, preserve source/photographer attribution, hotlink official image URLs, and compare at most four candidates with fit and actionable guidance rather than fake aesthetic scores.
- **Reason:** Provide useful inspiration without copying assets, hiding provenance or making unbounded AI calls.

## ADR-019 — Explainable series consistency without automatic recoloring

- **Status:** Accepted for implementation
- **Date:** 2026-10-27
- **Decision:** Build series mode around cross-image role consistency, reproducible differences and three unification strategies. Keep pixel-level recoloring and universal aesthetic scores out of scope.
- **Reason:** Provide practical design-system value and a defensible workflow distinction without pretending that color extraction alone proves semantics or that all variation is undesirable.

## ADR-020 — Local cancellable image analysis and independent focus evidence

- **Status:** Accepted and implemented
- **Date:** 2026-11-03
- **Decision:** Run deterministic image analysis/rendering in a module Worker; crop native ROI first; guard denoising by original pixel color; clip feathering inward. Compare coverage and accent extraction candidates per image rather than special-casing fixtures. Expose whole-image focus independently of selected-color density, including abstention and multiple candidates.
- **Reason:** Correct complete user-visible pipelines, remove synchronous main-thread analysis, and avoid confusing color density with human attention. Keep human-quality validation explicitly pending until independent labels exist.
- **Tradeoffs:** Total time may increase despite smoother interaction. Resampling changes decoded evidence and must be measured end to end. Focus remains a bottom-up contrast heuristic, without face/text semantics or calibrated probabilities.

## ADR-021 — Complete contrast evidence and truthful selected colors

- **Status:** Accepted and implemented
- **Date:** 2026-11-03
- **Decision:** Keep passed, failed and unexamined pair evidence in a typed contrast report; compare unrounded ratios; use the same report and presentation in preview/export for single and series flows. Include fallback/current role values in the selector even when absent from the extracted palette.
- **Reason:** A skipped check must not become a success, and the editor must display the color actually rendered and exported. Small colored status text needs the same normal-text threshold as other small text.
- **Tradeoffs:** Correct checks expose additional warnings in existing default schemes. Colors remain editable/exportable and are not silently corrected. Scope remains the declared pairs, rather than a claim of full WCAG compliance; role optimization and edit persistence follow separately.

## ADR-022 — Preserve intent as scoped overrides, not frozen suggestions

- **Status:** Accepted and implemented
- **Date:** 2026-11-03
- **Decision:** Store explicit single-image overrides by domain and unified-series overrides by domain/strategy. Derive untouched roles from current suggestions; recompute unified palettes and lock exceptions from the effective edited roles. Provide an explicit scoped reset, clear on successful new source/all-images removal, and keep choices after failed replacement.
- **Reason:** Analysis updates and view/strategy changes must not silently erase user decisions. Freezing an entire suggested role table after one edit would also stop untouched roles from updating and could produce stale export exceptions.
- **Tradeoffs:** Drafts are page-scoped, not saved projects. Different strategies keep independent choices restored when revisited. Global manual edits can produce per-image exceptions for locked original roles, including the primary image; the UI and export describe those exceptions explicitly.

## ADR-023 — Preserve sampled RGB evidence and share the image entry

- **Status:** Accepted and implemented
- **Date:** 2026-11-03
- **Decision:** Retain weighted original channel sums inside histogram bins, bypass grouping for low-color sampled inputs, and route single/series extraction through the same Worker entry. Version the processing settings and include per-source metadata in JSON exports. Commit successful batch items despite individual failures.
- **Reason:** A uniform source must not change because of a histogram grid, and a cross-image comparison must not measure two different preprocessing paths. Batch failures must identify failed files without silently discarding valid work.
- **Tradeoffs:** Palette suggestions can change from historical quantized values; regression expectations now use decoded source colors. Large images are still resampled and at most 8000 nontransparent pixels sampled. Cluster means and protected accent representatives are not a literal pixel-picker guarantee, and area estimates remain approximate. Human attention qualification remains separate.

## ADR-024 — Validate and recover one local project without losing edit intent

- **Status:** Accepted and implemented
- **Date:** 2026-11-03
- **Decision:** Read the saved project before mounting shared state; keep source Files and evidence with overrides/series settings; derive transient URLs; serialize revision-checked IndexedDB writes; provide hashed, validated project backups and a bounded in-page undo history. Store reports as captured-input snapshots instead of deleting them when users browse ROI/roles.
- **Reason:** A screenshot or tokens file cannot restore the complete workspace. Persistence added to scattered effects could overwrite saved data with the initial empty render, lose concurrent-window work or save URLs that die on reload. Reports need an explicit relationship to their original inputs.
- **Tradeoffs:** Local browser data is not cloud sync. Pending writes can still be lost by closing before completion; the saved badge reflects completed storage. History is limited to 30 in-page edits and reports to 20 snapshots. Unknown stored versions are protected rather than guessed/migrated. The frontend validation/backup code increases the main bundle to about 531kB before gzip; the build warning remains visible and a later delivery can separate stable validation code for caching.

## ADR-025 — Carry explicit design choices through local evidence and delivery

- **Status:** Accepted and implemented
- **Date:** 2026-11-03
- **Decision:** Retain source-scoped ROI/manual candidates separately from the measured palette, commit validated HEX through existing scoped role edits, and put preview/export near editing with phone task navigation. Share report selection with dependent requests and transmit explicit local-area/source-coordinate scope. Produce a local palette-card PNG and separately cache stable client validation code.
- **Reason:** Local discoveries and manual choices must survive to the actual preview/download without becoming fabricated source-area evidence. Users need a short route from editing to a deliverable, and the displayed report must be the one used by dependent actions.
- **Tradeoffs:** Working candidates are capped at 24; removing one leaves already assigned roles intact. Preview locations are measured color regions, not semantic object positions or human fixation. Cache separation reduces main-chunk size but not validation's first-load cost. Real-device usability and independently labeled focus accuracy remain separate acceptance tasks.

## ADR-026 — Separate contrast heat from stable focus-region evidence

- **Status:** Implemented as review candidate, pending human interpretation review
- **Date:** 2026-11-03
- **Decision:** Retain existing heat, grow strong seeds through weaker measured support, preserve independently qualified strong cores, and require supported positions or abstention. Expose uncertainty and reasons instead of calling every candidate failure distributed. Version the focus model separately from palette preprocessing.
- **Reason:** Text-like strokes can be individually below the energy gate even when their combined local response is meaningful. Simply lowering candidate energy or joining every nearby fragment risks noise and merged subjects. Uncertainty in the model is not evidence of a dispersed real-world scene.
- **Tradeoffs:** 35% support is a conservative development choice, not a learned optimum. Adjacent sub-threshold structures may still merge and semantically important content may remain undetected. Global prototypes that made every development image a localized target were not selected merely for higher coverage. Human drafts and verbal feedback are diagnosis inputs, not qualifying spatial ground truth; review precedes merging this algorithm candidate into production.

## ADR-027 — Separate cached semantic focus from application design reports

- **Status:** Implemented as review candidate; text presentation accepted, semantic qualification pending
- **Date:** 2026-11-03
- **Decision:** Keep full-source subject/part/priority analysis as an explicit bounded task through the existing DeepSeek connection. Preserve at most ten source-owned records, independent of edited colors, use case and ROI browsing. Keep local color evidence separate, display approximate bounds only on request, and reject stale source completions.
- **Reason:** A combined aesthetics/focus request introduced schema conflicts and latency. Reinterpreting every palette edit as a new original-image task wastes calls and can mix unrelated states. Readable hierarchy can help without pretending a model rectangle is a verified focus point.
- **Tradeoffs:** Model ranking remains fallible and source-owned cache does not establish a fixed underlying model revision. Semantic advice currently does not change role assignments. Source cancellation cannot guarantee upstream billing cancellation. A string-only legacy recommendation alias is normalized before the complete independent report validation; other malformed values remain invalid.

## ADR-028 — Do not enable extra reasoning or draft review from this experiment

- **Status:** Accepted implementation boundary; future alternatives remain open
- **Date:** 2026-11-03
- **Decision:** Retain the current bounded default and accepted presentation. Do not automatically add high-effort thinking, a self-review call or a local model. Preserve frozen failures and request four fresh judgments before another ranking selection.
- **Reason:** Sixteen deeper attempts produced eleven strict-valid results at an observed 35.6-second median, with mixed semantic improvements/regressions. Fifteen valid reviews retained the same dominance and target-tier edges as their drafts. More calls did not demonstrate a stable ranking benefit.
- **Tradeoffs:** This decision does not prove reasoning or review generally ineffective. The comparison is development evidence with four unannotated fresh-to-project images and no attention accuracy metric. Output-structure reliability and an unanchored competing-cue ranking task remain separate next investigations.

## ADR-029 — Describe the exact result schema and return validation evidence to a bounded retry

- **Status:** Implemented on review branch
- **Date:** 2026-11-04
- **Decision:** Serialize JSON Schema from the runtime validator on the server and pass bounded previous visible output/validation issues to the existing second attempt when structure is invalid. Keep the semantic guide, result shape, source cache and accepted UI unchanged; version the prompt metadata separately.
- **Reason:** An invalid enum, object in a string field or contradictory primary graph should be explained to the provider rather than silently guessed by application code or retried without context.
- **Tradeoffs:** The exact-schema arm still failed one of twenty-six first attempts and did not improve the strict-valid count on the reused sixteen subset. Contract precision and successful captured-error repairs do not prove semantic accuracy or a general success-rate gain. Repair can add input tokens, but does not add a third/default review attempt. Prototype whole-image readings remain a different, unaccepted output contract.


## Whole-image reading is a separate default task

- **Status:** Accepted product-output choice; implementation verified locally
- **Date:** 2026-11-04
- **Decision:** Present whole-image organization/character first, then optional unranked local cues, using the existing multimodal provider. Preserve the old ranker behind an optional disclosure with separate schema/history. Keep deterministic image/color computation local.
- **Reason:** The owner's gesture-led and distributed-scene judgments exposed a mismatch in the question demanded by mandatory total ranking. A readable overall interpretation better matches the selected palette workflow; more reasoning did not consistently resolve the old rank disagreements.
- **Tradeoffs:** This changes the output task rather than proving improved attention accuracy. Subject candidates remain available but unqualified. One ordinary request returns both scales; only structural or transient transport failure can use the existing second attempt. Task/prompt/input provenance and source-owned caches prevent old focus records being relabeled. Actual palette-decision usefulness remains to be evaluated in use.
