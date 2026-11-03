# Palette Lab — Product Contract

## Product promise

Palette Lab turns image color into editable, testable and exportable design decisions. It is a color-system workspace, not a generic image-captioning agent.

## Target users

- Developers building visual interfaces
- Independent designers and AI-art creators
- Students learning practical design systems
- Worldbuilding projects that need visual consistency

## V1 domains

### Web / UI

Priorities: semantic color roles, readable text, interaction states, responsive previews and implementation-ready tokens.

### Art / Poster

Priorities: visual hierarchy, emotional direction, color proportion, image-text relationships and exportable palette cards.

The domains share the color engine but use separate rules, previews, exports and AI prompts.

## V1 scope

- Local image import and preprocessing
- Deterministic global and regional palette extraction
- Color-role editing and color locking
- Faithful, balanced and expressive palette variants
- Web/UI and Art/Poster preview templates
- Contrast and basic usage checks
- CSS, JSON and PNG export
- Local-only operation without an AI key

## Explicit non-goals for V1

- Accounts, cloud database and collaboration
- Generic AI chat
- Pixel-perfect semantic segmentation
- Multiple stock-image providers
- Automatic aesthetic scoring presented as objective truth

## Acceptance criteria

1. The primary workflow works without network access after the app has loaded.
2. Imported images are not uploaded by default.
3. Users can move from image to useful export without reading an AI report.
4. Web/UI and Art/Poster produce visibly different recommendations and previews.
5. All generated colors remain editable and exportable.
6. Layout works at desktop, tablet and phone widths without horizontal overflow.
7. Deterministic color functions have automated tests.
8. Contrast audits distinguish passed, failed and unexamined pairs. Missing or invalid colors cannot count as passed checks; small text uses the normal-text threshold.
9. Every assigned role color remains selectable, including fallback and current colors outside the extracted palette. The editor, preview and exported roles must agree.
10. Re-extraction preserves manual role choices for the current image while refreshing untouched suggestions. Unified-series drafts are independent by domain and strategy; resetting one draft does not clear the others. After a successful local save, source images and these choices recover after reload.
11. Uniform decoded source colors retain their RGB values. Single/series analysis uses the same preprocessing contract and records its version in JSON exports. Palette shares from sampled/resized evidence remain estimates.
12. A supported batch with corrupt items retains successful images, names each failed item and allows a later retry without clearing the current draft.
13. Project backups preserve current source images, evidence and edits across browser contexts, with version, structure, image integrity and dimensions checked before replacement. Storage failure leaves editing/backup available; unreadable records and newer concurrent-window changes are not silently overwritten.
14. Deliberate edits have a bounded 30-step in-page undo/redo history. Analysis snapshots retain the inputs they describe and survive ROI/role browsing; changed inputs are explicitly marked, without automatic paid re-analysis. Undo history itself does not survive reload.

## Product north star

A user can turn visual inspiration into a usable, explainable design color system while retaining control over every decision.

## Focus evidence acceptance (2026-11-03)

The visual-center feature must distinguish selected-color location from whole-image focus. It must support multiple candidates, no-focus results, original-source ROI detail and palette-count invariance. Local processing and editable color roles remain core requirements. Human attention accuracy is gated on independent annotations; see `ATTENTION_EVALUATION.md`.
