# Second daily-use repair: preserve deliberate role choices

_Date: 2026-11-03. Baseline: a427497._

## Scope and behavior

This delivery addresses F03/F04 from the daily-use review: single-image re-extraction overwrote manual choices, and changes to series context erased the unified draft.

- Single-image drafts store explicit overrides by domain. Re-extraction changes untouched suggestions while keeping manual choices, including colors absent from the new palette. Failed imports preserve the existing draft. A successful explicit image replacement starts a fresh draft.
- Unified-series drafts are independent per domain and strategy. Each domain also remembers its last selected strategy. Reordering, primary changes, source-role edits and partial removal retain drafts; removing all images starts a fresh series.
- Unified roles are resolved before palette and per-image exceptions are generated. A global manual change can differ from a locked source role, including the primary image; that source color is retained as an explicit per-image exception. Actual preview, effective unified palette and downloaded JSON now describe the same base scheme.
- Only deliberate overrides are stored. Unedited suggestions can update with the source or primary, rather than freezing the whole automatic role table after one edit.
- Role options include current, fallback and source-image colors. A formerly automatic source color remains available after changing the global base.
- Manual markers and a scoped **恢复自动分配** action make the current draft state visible. Reset affects only the active domain/strategy.

## Validation

Before implementation, the single-image regression reproduced an edited blue background reverting to the extracted dark background after reducing the count. Three new unification tests also failed against the baseline, reproducing lost overrides and stale exception calculations.

Final local results: **159 unit tests in 17 files passed; 37 regular browser workflows passed; 3 opt-in suites skipped**. Type checking, lint, environment safety and production build passed. The new browser cases exercise rapid 6-to-2 count changes, both domains, scoped reset, failed/successful imports, strategy/domain return, primary/reordering, partial/all removal, 390px overflow and real downloads. The domain cases check absent-source colors with zero measured share, untouched-suggestion updates and source-lock exceptions. A separate production-build smoke check and public-release check identify actual deployed assets rather than inferring deployment from a successful local build.

The regular suite includes mocked API workflows. New manual-draft tests and release checks use local image processing and downloads, without paid-provider requests. Extraction and attention algorithms are unchanged; the optional 50-image benchmark, external development corpus and human-focus qualification are not rerun for this unit. No dependency or lockfile change is made.

The local production-build smoke check passed with no page errors or API requests: the retained color was absent from the two-color extraction yet remained painted and exported; domain/strategy restoration, primary/reordering, scoped reset and downloaded lock exceptions passed. The 390px role editor had no horizontal overflow. The mobile editor and series preview/export were also visually inspected. Public acceptance is recorded in the release evidence after synchronization.

## Remaining work and release boundary

Drafts remain in-memory page state. Reload recovery, autosave, undo/redo and project files are not implemented. Source RGB fidelity, a shared single/series processing pipeline, partial batch success and task-oriented layout remain separate units. The 1000-image run stays after those foundational fixes and a defined evaluation dataset.

The existing development-only minimatch advisory remains visible in the separate security CI job. Functional verification and actual public behavior must be reported separately from that security failure; this delivery does not suppress the audit or claim a clean dependency review.
