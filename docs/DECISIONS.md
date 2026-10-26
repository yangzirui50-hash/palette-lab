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
