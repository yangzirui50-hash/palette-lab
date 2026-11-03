# First daily-use repair: contrast evidence and role selections

_Date: 2026-11-03. Baseline: 83c9804._

## Scope and behavior

This is the first delivery unit from the owner's daily-usability review: contrast false positives (F01) and editor/render/export color mismatch (F02).

- A 12px muted label such as #686868 on black has contrast about 3.7686:1. It no longer passes the normal-text rule: secondary text and the preview's small success/error labels require 4.5:1. Decisions use the unrounded ratio.
- Missing or invalid role colors produce explicit unexamined checks, excluded from actual checked/passed counts. An empty report cannot render a successful preview/export summary.
- The parent computes a shared report for preview/export in each single-image or unified-series flow. One ContrastAudit component presents the same summary and expandable per-pair evidence, required threshold, scope and export guidance.
- Exports still preserve the user's selected roles and remain available with warnings. This change does not automatically recolor the scheme, add a new file format or claim complete WCAG compliance.
- Role selectors include case-insensitively deduplicated palette colors, domain/role fallbacks and the current assignment. A fallback can be reselected after a palette-color edit. Missing assignments display an explicit unassigned option.

The existing default success/error colors can now produce additional warnings because they are rendered as small text. On the default dark surface their ratios are approximately 3.445 and 3.686, below 4.5. These warnings are correct; they are not suppressed by weakening the rule. Automatic role optimization is subsequent work.

The normal-text requirement is supported by the [W3C contrast explanation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). This report only describes the explicitly declared color pairs; background images, gradients, all interaction states and broader accessibility requirements are outside its certification scope.

## Validation

- Six newly added contrast tests failed against the baseline before implementation, reproducing muted/status text false positives, missing/invalid count handling and boundary behavior.
- Final unit suite: **155 tests in 17 files passed**, including a server-rendered component contract proving incomplete reports do not claim success in preview/export.
- Final regular browser suite: **33 workflows passed**, including four new regressions for actual 12px warning and JSON download, selector/paint/export consistency, single-color fallbacks in Web and Art, and shared series preview/export evidence.
- TypeScript, ESLint, environment-safety checks and production build passed. Routine dependency comment-annotation warnings were non-fatal.
- An initial browser run stopped on an outdated exact-copy assertion in the series exporter. The assertion now checks the warning, export guidance and failed state separately; the subsequent complete browser run passed, including actual series downloads.
- A concurrent lint run raced Playwright's cleanup of test-results. After the browser run finished, lint and environment checks were rerun sequentially and passed. No product rule was weakened to bypass this infrastructure issue.
- Three opt-in suites (50-image benchmark, external development corpus and independently annotated focus qualification) were skipped in this regular run. Extraction/attention algorithms are unchanged; their earlier results are historical, not rerun results for this unit.

No package or lockfile change was made. AI/API browser workflows used the existing mock environment; the production build restores the real pre-test environment. No real paid-provider call is used by these new tests.

## Remaining work and release boundary

Manual role preservation through re-extraction, unified-series override preservation, source-color fidelity, one shared image pipeline, project recovery/undo and workspace layout are not completed by this unit. Development order is now recorded in ROADMAP.md around those daily tasks rather than prioritizing more focus features first.

The existing development-only minimatch audit finding remains visible in the separate security CI job. It is not fixed or suppressed here. Local success does not prove deployment: remote functional/security checks and the public selector/warning behavior are verified after the authorized push.
