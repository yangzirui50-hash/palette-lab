# AI Analysis — Provider and Data Contract

## Responsibilities

Deterministic palette computation, role assignment and WCAG checks remain outside the model. The multimodal provider interprets image content, composition and design direction. Model output is advisory and includes uncertainties.

## Request

`POST /api/analysis`

- `image`: JPEG/PNG/WebP data URL, bounded to 6 MB after client compression
- `domain`: `web-ui` or `art-poster`
- `palette`: up to 8 HEX/share records
- `assignments`: role-to-HEX map

The client creates a maximum 1024px JPEG copy only after explicit user action. Original files are not sent automatically.

## Report

Validated by `analysisReportSchema`:

- Summary, subjects, scene, composition and lighting
- Style tags and suitable use cases
- Palette-role rationales
- Actionable recommendations with rationale
- Uncertainties
- Provider and model metadata

Invalid provider output is rejected instead of being rendered as trusted content. Each recommendation has the exact string fields `title`, `rationale` and `action`. The provider prompt names these fields explicitly. For an observed legacy compatible-provider reply, a string `actionable` is accepted as an alias only when `action` is absent; the normalized record still passes the complete report schema. Existing `action` values are never replaced by the alias, and an invalid explicit value still fails validation. This bounded compatibility conversion does not invent advice or accept a malformed report.

## Independent semantic-focus candidate

`POST /api/focus` is an explicitly requested task separate from the aesthetics report. It receives a maximum-1024px image copy and fixed full-source measurements (six representative colors, maximum-512px spatial raster), independent of edited roles, palette count, application domain and ROI browsing. The versioned semantic graph represents subjects/parts/groups/contours/color relationships and primary/secondary/weak priorities, with ranked/shared/distributed/no-dominant/uncertain outcomes. Runtime validation checks references, hierarchy cycles, bounds and contradictory primary labels.

The default DeepSeek focus task disables thinking and caps output at 4096 tokens, with at most two attempts and no automatic 401/429 retry. A provider-specific image detail option is sent only to DeepSeek. Up to ten source-owned records persist in project state and backups. Source replacement aborts the client request and rejects stale results; this does not guarantee that an already dispatched server/provider request incurs no charge. Refresh is explicit, failed refresh retains a valid prior record, and ordinary editing does not trigger another focus call.

The presentation review accepted the text hierarchy, not the model's ranking or boxes. No automatic deeper-thinking or self-review call is enabled by the external comparison experiment. Semantic results currently advise the user; they do not automatically change role colors or repair the independent aesthetics report. See `REVIEWS/2026-11-03-semantic-focus.md` and the subsequent priority comparison record.

## Providers

### Mock

Used by unit and browser tests. Deterministic and clearly labeled `provider: mock`. It validates the complete request/report workflow without claiming a real model call.

### OpenAI-compatible

Uses `AI_API_KEY`, `AI_MODEL` and optional `AI_BASE_URL`. The key is read only by the Worker. Responses must contain valid JSON and pass the same schema validation.

## Provider registry

`src/worker/providers/registry.ts` records each provider's protocol, default model, endpoint, vision support, structured-output support and implementation status. `GET /api/providers` exposes capability metadata without credentials. `GET /api/health` reports only the active provider and whether configuration is complete.

DeepSeek is configured locally with `AI_PROVIDER=deepseek`, `AI_MODEL=deepseek-flash` and `AI_BASE_URL=https://api.deepseek.com/chat/completions`. Other supported entries include Kimi, OpenAI and OpenRouter; Cloudflare remains an explicit custom-provider option for a later adapter.

The real DeepSeek Flash workflow was verified on 2026-10-27 with HTTP 200. `scripts/verify-real-provider.mjs` starts an isolated local Worker, submits the self-generated image fixture, reports provider/model/summary metadata, and redacts credentials from error output. The real `.dev.vars` file is never committed.

## Local configuration

Copy `.dev.vars.example` to `.dev.vars`. Use `AI_PROVIDER=mock` for development tests. For a real provider, remove the mock setting and supply the real key and model. Never commit real secrets.

## Production configuration

Use Cloudflare secrets for `AI_API_KEY` and `AI_MODEL`; configure `AI_BASE_URL` only when a compatible endpoint differs from the default. Production builds restore the pre-test environment before bundling.

`npm run test:e2e` uses `scripts/run-e2e.mjs` to restore the real local environment immediately after Playwright exits, whether tests succeed or fail. Mock configuration must never overwrite the owner's working configuration after a test run.

A previous restore implementation removed `.dev.vars` when no backup existed. This was corrected: restoration now requires a backup, and only files containing the explicit `PALETTE_LAB_TEST_ENV=1` marker may be deleted. `npm run test:env` covers preservation, restoration and safe mock cleanup in CI.

## Failure behavior

- Missing configuration: HTTP 501 with an explicit offline-safe message
- Invalid request: HTTP 400
- Provider failure: HTTP 502 with a generic retry message and no secret leakage
- Offline palette editing, previews and exports continue to work
