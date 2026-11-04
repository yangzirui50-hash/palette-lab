# Whole-image interpretation delivery — 2026-11-04

The owner selected whole-image reading first, with local cues on demand, after reviewing the N03/N04 dual-reading prototype. The original thirty plus four judgments remain valid development evidence outside Git. No additional labeling is required to implement this choice.

## Implemented behavior

The actual workspace shows clean source imagery and organization/character paragraphs. Relations, local cues and uncertainties start closed. The previous focus task remains explicitly available in a separate closed section. Local cues have no implied ranking. Reading never repaints the source or changes roles automatically.

An explicit click sends the maximum-1024px source image with fixed full-source measurements through `/api/reading`. Its own task/schema and prompt/input metadata distinguish it from focus. Source-owned history keeps ten records; old backups default this field to empty. Import/export, reload and undo preserve both independent histories. Palette/domain/role/ROI edits and disclosure reuse cached readings. Abort/request/source guards reject stale results; failed refresh retains the last valid record.

The selected prompt matches the approved prototype by SHA-256. A shared transport preserves independent schemas/token caps and the existing two-attempt structure-repair limit. There is no automatic extra reasoning pass, local detector, added runtime dependency or hidden-reasoning persistence.

## Verification and limits

- Existing dependency tree: 253 units in 30 files, lint/type/build/environment safety and 80 regular browser workflows; four opt-in suites skipped.
- Relevant reading/focus browser subset: ten passed. An initial two-test failure came from distinct tests sharing a six-per-minute fixture bucket. Reserved test-user identities now keep the real limiter enabled; route tests retain its 429 check. Initial failure artifacts were preserved externally.
- Genuine integrated Hono handler in Node: eight cases, all HTTP 200, nine upstream calls because one needed structural retry. IDs/files/human judgments were not sent to the provider. This is not deployed Cloudflare acceptance.
- Separate built-client loopback browser: one genuine DeepSeek request, no page errors, 1440px desktop and 390px phone, no horizontal overflow. Editing/reload/disclosure reused the saved response with no additional AI call.

Raw requests, outputs, original images, human comments and screenshots remain outside Git. These are development/transport checks rather than independent gaze, localization or semantic-accuracy measurements. A thousand-image campaign remains downstream of task-specific criteria and operational stability. Publication/security status is recorded in STATUS; this feature's local verification does not imply production deployment.
