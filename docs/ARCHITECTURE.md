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

- `AIAnalysisProvider`: structured multimodal analysis; vendor replaceable
- `InspirationProvider`: reference search and attribution; Unsplash first
- `ExportAdapter`: CSS, JSON, PNG and later design-tool formats

## Privacy and secrets

Palette extraction runs locally. Images are sent to an AI provider only after an explicit user action and clear notice. API keys live only in server-side secrets and never in frontend source.

## Platform strategy

One application core supports multiple delivery targets. V1 provides a desktop multi-pane workspace and a mobile task-based responsive workspace. PWA installation is the first installable target. Tauri is the preferred later desktop wrapper; Capacitor is the later Android/iOS wrapper when native camera, file and sharing integrations are required.

Color processing, domain rules, project records and export adapters remain platform-independent. Native packaging must not fork the core product logic.

## Reliability

Local palette editing, previews and exports remain available when AI or stock APIs fail. External providers use timeouts, bounded retries, caching and validated fallbacks.
