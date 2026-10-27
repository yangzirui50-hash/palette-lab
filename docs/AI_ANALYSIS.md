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

Invalid provider output is rejected instead of being rendered as trusted content.

## Providers

### Mock

Used by unit and browser tests. Deterministic and clearly labeled `provider: mock`. It validates the complete request/report workflow without claiming a real model call.

### OpenAI-compatible

Uses `AI_API_KEY`, `AI_MODEL` and optional `AI_BASE_URL`. The key is read only by the Worker. Responses must contain valid JSON and pass the same schema validation.

## Provider registry

`src/worker/providers/registry.ts` records each provider's protocol, default model, endpoint, vision support, structured-output support and implementation status. `GET /api/providers` exposes capability metadata without credentials. `GET /api/health` reports only the active provider and whether configuration is complete.

DeepSeek is configured locally with `AI_PROVIDER=deepseek`, `AI_MODEL=deepseek-flash` and `AI_BASE_URL=https://api.deepseek.com/chat/completions`. The API key remains empty until the owner creates one. Other supported entries include Kimi, OpenAI and OpenRouter; Cloudflare remains an explicit custom-provider option for a later adapter.

## Local configuration

Copy `.dev.vars.example` to `.dev.vars`. Use `AI_PROVIDER=mock` for development tests. For a real provider, remove the mock setting and supply the real key and model. Never commit real secrets.

## Production configuration

Use Cloudflare secrets for `AI_API_KEY` and `AI_MODEL`; configure `AI_BASE_URL` only when a compatible endpoint differs from the default. Production builds restore the pre-test environment before bundling.

`npm run test:e2e` uses `scripts/run-e2e.mjs` to restore the real local environment immediately after Playwright exits, whether tests succeed or fail. Mock configuration must never overwrite the owner's working configuration after a test run.

## Failure behavior

- Missing configuration: HTTP 501 with an explicit offline-safe message
- Invalid request: HTTP 400
- Provider failure: HTTP 502 with a generic retry message and no secret leakage
- Offline palette editing, previews and exports continue to work
