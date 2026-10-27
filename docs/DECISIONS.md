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
