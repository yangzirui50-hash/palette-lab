# Palette Lab — Architecture

## System shape

```text
Image input
  → local preprocessing (Canvas + Web Worker)
  → deterministic palette and usage metrics
  → domain profile (Web/UI or Art/Poster)
  → editable palette roles and previews
  → export adapters

Optional later stages:
  → multimodal evidence and design analysis
  → inspiration provider and reference comparison
  → multi-image consistency and worldbuilding profiles
```

## Technology

- React + TypeScript + Vite
- Canvas + Web Worker for local pixel processing
- OKLCH-oriented color calculations and Color.js
- Zod for external and persisted data validation
- Hono + Cloudflare Workers for later protected API calls
- IndexedDB for local project history
- Vitest for deterministic logic and Playwright for workflows

## Implemented color engine

`src/lib/color/extract.ts` accepts typed RGB pixels and returns deterministic palette swatches. It samples large inputs, builds a quantized histogram and clusters weighted samples in OKLab space, with an additional salience-reserved center for sufficiently represented chromatic hue bins. Distances convert LCH hue/chroma into true OKLab channels, so hue is never subtracted as a linear degree value. Output uses original-RGB cluster means with normalized shares, OKLCH coordinates and six-digit HEX values. The implementation is independent of the DOM and AI providers so it can run in browsers, workers, tests and future native wrappers.

## Role assignment and previews

`src/domain/assign.ts` maps extracted swatches into domain-specific role records using OKLCH lightness, chroma and hue. `RoleEditor` lets users override every assignment, while `DomainPreview` renders real Web/UI and Art/Poster outputs from those records. Color.js OKLCH coordinates are interpreted as lightness, chroma and hue; hue is never included in chroma calculations.

## Semantic fallbacks and contrast checks

Single-color inputs receive explicit neutral roles instead of reusing one swatch everywhere. Success and error states use stable semantic fallbacks rather than unreliable hue inference. `src/domain/contrast.ts` evaluates domain-specific role pairs using the WCAG 2.1 algorithm, and the preview reports pair labels, thresholds and measured ratios before export.

## Export adapters

`src/lib/exporters.ts` produces semantic CSS variables and versioned JSON design tokens with domain roles and source palette data. `public/schemas/design-tokens/v1.json` provides the real versioned contract used by JSON exports. `ExportPanel` renders actual Web/Poster previews to PNG at 2× resolution. Downloads run locally without uploading images. The same WCAG report is shown before export; warnings remain visible without blocking user choice.

Role assignments are stored independently per domain so switching Web/Art does not discard manual edits. Automatic muted-text selection excludes colors already assigned to background, surface, primary text and accent where possible.

## Planned source boundaries

- `src/domain/`: typed domain profiles, rules and data contracts
- `src/lib/color/`: deterministic color calculations
- `src/workers/`: image-processing workers
- `src/components/`: shared interface components
- `src/features/`: import, palette, preview, analysis and export features
- `src/worker/`: Hono API and provider adapters
- `tests/`: fixtures and end-to-end workflows

## Core records

- `SourceImage`: source metadata and local processing state
- `Palette`: colors, proportions, roles and locks
- `DesignContext`: domain, target, tone and constraints
- `AnalysisReport`: model evidence, uncertainty and actionable suggestions
- `InspirationQuery`: reference-search conditions
- `ReferenceSet`: source, attribution and comparison results
- `ExportPreset`: output format and target platform

## Provider boundaries

- `AIAnalysisProvider`: structured multimodal analysis; vendor replaceable. Mock and OpenAI-compatible implementations validate reports through `analysisReportSchema`; see `docs/AI_ANALYSIS.md`
- `InspirationProvider`: reference search and attribution; Unsplash first
- `ExportAdapter`: CSS, JSON, PNG and later design-tool formats
- `AmbientTokenGenerator`: future deterministic image-to-theme candidate filtering, contrast checks and standard-theme fallback

## Development modes

`npm run dev` uses `vite.frontend.config.ts` for fast local UI work without starting the Worker. `npm run dev:full` uses the complete Cloudflare Vite integration for API development. Production builds always use the full `vite.config.ts` and Worker output.

## Privacy and secrets

Palette extraction runs locally. Images are sent to an AI provider only after an explicit user action and clear notice. API keys live only in server-side secrets and never in frontend source.

## Platform strategy

One application core supports multiple delivery targets. V1 provides a desktop multi-pane workspace and a mobile task-based responsive workspace. PWA installation is the first installable target. Tauri is the preferred later desktop wrapper; Capacitor is the later Android/iOS wrapper when native camera, file and sharing integrations are required.

Color processing, domain rules, project records and export adapters remain platform-independent. Native packaging must not fork the core product logic.

## Reliability

Local palette editing, previews and exports remain available when AI or stock APIs fail. External providers use timeouts, bounded retries and validated fallbacks. Paid POST endpoints use Cloudflare's approximate regional rate-limit binding before image parsing and provider calls. Analysis/reference UI requests use abort and request-identity guards to prevent stale writes.

Series comparison reuses extracted palettes and roles without rereading image pixels. It supports at most six images and uses deterministic optimal matching plus existing-role medoids for balanced unification; no RGB averaging or AI call is required. Preserve Accents and role locks are explicit export data. Series overview PNG uses a bounded native Canvas renderer rather than cloning the full interactive workspace.
