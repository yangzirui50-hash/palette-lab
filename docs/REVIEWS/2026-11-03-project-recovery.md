# Fourth daily-use repair: recover the workspace and retain its evidence

_Date: 2026-11-03. Baseline: 6c4c301._

## Result and scope

F05 (refresh loses the project) and F09 (ROI browsing clears the AI report) are addressed together around an explicit project record. Recovering only roles would leave their source image, count, series reference or report inputs ambiguous. The record now retains source Files and extracted evidence, single/series manual state, primary/order/locks/strategies, ROI and captured-input reports. The app reads and validates storage before mounting the editable workspace.

Successful local saves recover after reload. Writes are queued and revision-checked; another window's newer record is not silently overwritten. Unknown/corrupt records are protected, and quota failure leaves live editing and project backup usable. Save status describes the actual displayed draft versus completed storage. Project backups contain source bytes and SHA-256, with full format, structure, digest, decoding and dimension validation before replacement. Opening a failed backup does not clear the current work.

Undo/redo retains 30 in-page edits and shared source File references. Replacing a source, adding/removing/reordering a series, changing its primary and starting/opening a project are atomic changes. URLs are regenerated from current Files and released outside history; undo therefore does not resurrect expired blob URLs. Undo history itself is not persisted across reload. Analysis stores up to 20 report snapshots, preserves their source/context, and labels historical inputs instead of deleting reports or making another paid request.

## Verification

- 188 unit tests in 19 files pass, including ten new model/history contracts.
- Complete regular browser run: 52 workflows pass; three image/annotation opt-ins are skipped because the image algorithm is unchanged from the preceding unit's separate 50/30 run.
- Eleven new recovery workflows pass, including fresh-context backup, real reload, failure paths, empty-state undo and concurrent-window protection. They are rerun after the final transient-feedback cleanup; no page errors are tolerated.
- Type checking, lint, environment safety and production build pass. The build reports a visible >500kB main-chunk warning; it is not suppressed. Current main size is about 531kB / 171kB gzip.
- Production-build smoke passes with actual saving/reload, reordered primary/locked series, SHA-verified backup into a new context, explicit offline report fixture restoration and 390px overflow check. It makes no API requests. Public smoke is recorded separately after synchronization.

## Issues found during implementation and reflection

The first cross-context backup test restored the series data but exposed a lazy-mount condition that prevented the imported series from showing. The display now derives activation from the restored mode/images as well as prior local activation. A second audit caught an initial-render write guard that would also skip saving an undo back to the original empty object; a dedicated save/reload regression now prevents that saved image from reappearing. These are lifecycle failures that a model-schema unit test alone would miss.

Persistence is a user-visible transaction boundary, not simply a storage call. Tests must prove what reappears after a fresh context/reload and what remains after failure, while preserving the original file bytes. A token export, successful promise or screenshot is insufficient acceptance. Report retention likewise needs captured inputs and an explicit stale state, rather than pretending a prior conclusion applies to changed roles.

Local saving is not a cloud backup or a guarantee for an unfinished write. Clearing browser storage removes its current record; users can explicitly export a portable project. Unsupported future record versions are protected instead of automatically downgraded. Real-device Safari/Firefox qualification and independent human focus labels remain unexecuted.

## Next delivery

Continue with local ROI colors usable in roles, explicit HEX edits, useful palette-card output and nearby preview/export with phone navigation. Keep source-measured shares separate from retained/custom candidates. Separate stable validation code for caching if measured delivery or bundle growth warrants it. Then prepare the independent human focus pilot and worst-case visual-review packet; the 1000-image run remains behind that gate.
