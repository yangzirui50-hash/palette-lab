# Palette Lab — Stage Gate Review, 2026-10-27

## Decision

**PASS for the current personal public-preview scope.** The next feature phase may start. This is not a claim of high-traffic SaaS readiness.

## Initial findings

Two release-blocking issues were found despite all existing tests passing:

1. Public paid AI endpoints had no request-rate protection, creating avoidable upstream quota and cost risk.
2. The main AI request lacked a server timeout, and analysis/reference requests could write stale results after source or domain changes.

A later production request also exposed weak handling of malformed or schema-incompatible model responses.

## Remediations

- Added the native Cloudflare `AI_RATE_LIMITER` binding: six requests per 60 seconds per route and client IP.
- Rate checks run before JSON/image processing and paid provider calls; rejection returns HTTP 429 with `Retry-After: 60`.
- Added a 90-second main-analysis provider timeout.
- Added typed, credential-safe diagnostics for provider status, timeout, network, empty response, invalid JSON and invalid schema.
- Added at most one retry after one second for network/5xx/empty/malformed/schema failures. Authentication and 429 responses are not retried blindly.
- Added abort and request-identity guards to analysis and reference UI requests to prevent stale result writes.

## Verification evidence

- 30 unit tests pass, including rate-limit and malformed-response retry coverage.
- 11 real-browser workflows pass.
- Environment safety, ESLint, production build and `npm audit` with 0 known vulnerabilities pass.
- Production DeepSeek returned HTTP 200 after the reliability update.
- Production invalid-request pressure checks initially returned HTTP 400 without paid calls; after regional count synchronization, the limiter returned HTTP 429 with `Retry-After: 60`.
- Real API keys remain local or in Cloudflare server-side secrets and are absent from Git.

## Scope and residual risk

- Cloudflare native rate limits are approximate and regional, not a strict global quota. This is acceptable for the current personal preview but must be revisited before substantial public traffic.
- Model output remains nondeterministic; after the bounded retry, failures must still show an honest error rather than mock content.
- Unsplash real search remains deferred until owner application approval and is not part of this pass decision.
- Multi-image consistency and Ambient mode are future features, not defects in the current scope.

## Stage-gate result

All current-scope blocking findings are remediated and reverified. Repository history is synchronized with remote `main`; the next phase may proceed from this stable baseline.
