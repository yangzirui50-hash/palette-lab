# Fifth daily-use repair: complete the edit-to-delivery path

_Date: 2026-11-03. Baseline: d6a245a._

Local native-ROI colors now enter a recoverable working palette and can be assigned to roles. Explicit three/six-digit HEX works in single-image and series editors. Source palette shares remain unchanged; manual/ROI candidates carry zero global area and ROI candidates preserve separately labeled local sampled shares. Candidate creation and role edits use project undo/recovery, while uncommitted text drafts stay scoped to their editor context.

Wide screens place role editing alongside scene preview/export. Five task jumps remain accessible on phones. A local 1200×720 palette-card PNG separates source colors/approximate proportions from applied roles; current preview PNG and JSON/CSS exports remain available. The card does not include the original photograph or filename.

## Reflection and corrections found by composed tests

The first ROI-to-poster test exposed two pre-existing coordination failures: undo cleared evidence without rerunning an unchanged analysis, and ROI evidence was deliberately discarded at the parent callback. Evidence now carries source File/palette/ROI identity and reaches the consumer with explicit scope. Local positions map to source coordinates, while area stays local. This avoids a small selected patch being positioned as though it filled the original photo. A zero-pixel fallback region is not used as measured placement.

Report recovery also needed a stronger invariant: selecting an older report in the UI originally left reference generation bound to the hidden newest report. Both now use the same selected snapshot, with an explicit historical-report/current-palette explanation. The test checks the actual outgoing request, not only the displayed heading.

These failures show why isolated schema, component and image tests are insufficient. Acceptance must trace one choice through actual evidence, editing, undo, reload, preview and downloads, including the request body when another service depends on it. Browser bootstrap must finish before direct DOM injection, and ROI tests must measure the visible, scrolled image rather than obsolete page coordinates.

## Delivery and validation boundaries

208 unit tests in 23 files and 58 regular browser workflows pass, with three image/annotation opt-ins skipped. The six new browser workflows include actual file downloads/pixels, source-share preservation, undo/reload, local position/scope, report request bodies and responsive task navigation. Type checking, lint, environment safety and the complete production build pass.

Stable validation code is separately cached: main client about 446kB/147kB gzip, validation about 98kB/28kB gzip. The >500kB warning is resolved by a real boundary rather than changing its threshold. This does not claim fewer total initial bytes or better measured loading speed. Image Worker hash remains unchanged; no extraction/attention algorithm tuning was performed in this unit. The preceding 50/30 operational image results remain separate, not rerun or relabeled as human accuracy.

Local and public release evidence is recorded in the dated external output folder. Independent labels, real-device Safari/Firefox and the large held-out run remain unexecuted. Existing moderate development-only minimatch audit failure remains visible and is not suppressed.

## Revised next action

Prepare a blind two-reviewer 30-image pilot with original photos, explicit state definitions, normalized boxes, uncertainty/notes, local saving/export, provenance hashes and a disagreement report. Reusing current development photos is cost-effective for protocol rehearsal, but those bytes cannot become held-out data. Do not show algorithm overlays during annotation or manufacture labels. Review uncertain/disagreeing cases and the known four-color portrait coverage regression before freezing standards and expanding the dataset. The 1000-image stage stays behind this evidence gate.
