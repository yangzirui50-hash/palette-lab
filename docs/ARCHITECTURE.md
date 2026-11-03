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

`src/lib/color/extract.ts` accepts typed RGB pixels and returns deterministic palette swatches. It samples large inputs, builds a grouped histogram and clusters weighted samples in OKLab space, with an additional salience-reserved center for sufficiently represented chromatic hue bins. Histogram keys group samples but do not replace their RGB values: weighted source-channel sums retain original means. When the sampled input has no more unique colors than requested, exact source colors bypass grouping. Distances convert LCH hue/chroma into true OKLab channels, so hue is never subtracted as a linear degree value. Normal output uses source-RGB cluster means; protected accent centers remain perceptual representatives. Shares are normalized sampled estimates, not exact original-image area. The implementation is independent of the DOM and AI providers so it can run in browsers, workers, tests and future native wrappers.

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

Spatial analysis assigns thumbnail pixels to palette regions in OKLab space and reports centroid, center/edge distribution and connected components. Region highlighting runs locally. The optional validated `spatial` request field passes the same evidence to DeepSeek so semantic analysis can distinguish background, central subjects and small accents without relying on area alone.

## 2026-11-03: local analysis worker

`src/lib/color/analysisClient.ts` owns a cancellable module Worker in `src/lib/color/analysis.worker.ts`. Source raster loading, palette clustering, assignments, distribution/focus analysis and overlay encoding run there. Response IDs and source/ROI keys reject stale work; switching render modes reuses cached frame/evidence. Home count changes read synchronous refs. Previous analysis controls are hidden during a pending import.

`raster.ts` uses high-quality ImageBitmap resampling and crops the native source before reducing a local ROI. It supports OffscreenCanvas in the Worker and Canvas in browser regression tests. Region feathers are clipped inward to the hard assignment mask. Palette extraction compares constrained-accent and coverage candidates and accepts a coverage alternative only when neither weighted sampled error nor sampled rejection gets worse. This sample-level guard is not a guarantee on all decoded pixels.

`attention.ts` adds palette-independent whole-image/local focus candidates without a center prior or semantic claim. See `ATTENTION_EVALUATION.md` for formulas, thresholds, tests and the unexecuted human-annotation gate.

## Shared contrast evidence and role selections

`getContrastReport` emits per-pair evidence (`passed`, `failed`, `unexamined`), full-precision ratios, thresholds and actual checked/passed/total counts. Six-digit HEX validation excludes invalid or missing assignments from checked counts. Normal-size secondary text and the preview's small success/error labels use 4.5:1. The report covers only declared color pairs; it is not a complete accessibility certification.

Home computes one report for the active role assignments and passes it to both DomainPreview and ExportPanel. SeriesWorkspace does the same for the unified preview/export. `ContrastAudit` renders those reports consistently, with expandable evidence and a clear warning when exporting a problematic or incomplete scheme. Export formats continue to preserve the current role values; the audit does not automatically recolor or block exports.

RoleEditor deduplicates palette options case-insensitively, includes role-specific fallback colors and retains any current assignment outside the palette. Missing assignments have an explicit unassigned option. Retained manual colors remain selectable after recomputation.

## Page-scoped manual role drafts

Home stores only deliberate role overrides by domain and derives effective assignments from the latest automatic suggestions plus those overrides. The derived object is memoized so unrelated renders do not change its identity. A count-triggered re-extraction preserves overrides; a successful explicit source replacement starts a fresh draft. Failed imports do not clear the existing choices.

SeriesWorkspace stores unified overrides by domain and strategy and remembers each domain's last selected strategy. Reordering, changing the primary, editing source roles or temporarily retaining only one image does not delete those drafts. Removing the final image starts a new series context and clears the drafts and strategy selections. `generateUnifiedSeriesPalette` accepts optional overrides before deriving effective roles, palette and locked-image exceptions, keeping preview and exported metadata aligned. Colors absent from remaining source palettes have zero measured source share rather than fabricated area. The role chooser includes source-image candidates as well as the effective unified palette.

RoleEditor marks deliberate choices and exposes an explicit reset for the active domain/draft. Reset refreshes its suggestions without altering other domains or strategies. These records are in-memory page state; project persistence, undo/redo and reload recovery remain separate milestones.

## Shared, versioned palette pipeline

Both Home and SeriesWorkspace send palette tasks through ColorAnalysisClient to the same Worker and `analyzeImagePalette` entry. File validation, ImageBitmap decoding, high-quality raster reduction, alpha cutoff, sampling and extraction are therefore shared. The obsolete HTMLImage/canvas series extraction path is removed. `pipelineConfig.ts` records processing version 2.0.0 and its settings; successful source records carry immutable analysis metadata. Single JSON exports include `analysis`; series tokens/reports include per-source `sourceAnalysis`. These additive optional fields have public schemas and do not expose image bytes. A count re-extraction refreshes the source metadata alongside its palette.

Series batches are processed sequentially in the Worker with progress and per-file failures. One corrupt file does not roll back earlier successes or prevent later files from being attempted. Existing roles/drafts remain intact; a later import can retry a repaired file. A synchronous import guard prevents overlapping drops, and source/primary selection uses current state at commit time. Unmount cancels work and releases object URLs. A selected batch exceeding the remaining six-image capacity is rejected explicitly before processing.
