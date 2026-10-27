# Series Color Consistency — V1 Product Contract

_Status: Approved for implementation on `feat/series-consistency`; not implemented yet._

## Product position

Palette Lab's series mode is an explainable color-system diagnostic and unification workspace for related design works. It is not a multi-image color picker, a photo color-grader or an automatic image-recoloring tool.

## Primary workflow

1. Import and organize two to six related images.
2. Select a primary image and confirm inferred roles.
3. Review shared colors, differences and per-image role inconsistencies.
4. Choose a unification strategy and generate an editable unified palette.
5. Verify Web/Art previews and WCAG results.
6. Export production tokens and an explainable series report.

The existing single-image workspace remains unchanged. Series mode is entered and exited through an explicit mode switch without deleting single-image state.

## User value and differentiation

The feature answers which work deviates, which colors and roles cause the difference, what should be unified and what may remain different. It does not reduce the series to an unexplained aesthetic score.

The required differentiators are cross-image role consistency, explainable evidence and intent-preserving unification. Palette extraction, contrast checks and token export alone are not considered sufficient differentiation.

## Scope

### Included

- Two to six PNG/JPEG/WebP images, reusing existing validation and local preprocessing
- Add, remove, replace, reorder and select a primary image
- Independent palette and role confirmation per image
- Shared, missing and additional colors per image
- Hue, lightness, chroma and area-share differences
- Role-level differences with user correction before unification
- Three strategies: Follow Primary, Balanced and Preserve Accents
- Editable unified roles with existing Web/Art previews and WCAG checks
- CSS variables, versioned JSON tokens, series overview PNG and structured report export
- Optional user-initiated AI interpretation after deterministic analysis; no AI dependency for local results

### Excluded from this phase

- Automatic pixel-level recoloring or generated replacement images
- Photography color grading, lighting correction or Photoshop/Lightroom replacement
- A universal pass/fail aesthetic score
- Large-batch processing or a default pairwise comparison matrix
- Treating intentional variation as an error
- Claiming that pixels alone prove semantic roles

## UX contract

Series mode has three task levels rather than one expanded page:

1. **Series overview:** primary image, thumbnail strip, shared system and notable deviations only.
2. **Image inspection:** current image versus primary, palette/share comparison and independent role correction.
3. **Unified palette:** strategy, unified roles, exceptions, previews, checks and exports.

Each level has one primary task. Mobile uses the same task boundaries rather than compressing all desktop panels. Sorting, primary selection, role edits and strategy state persist while navigating between levels.

## Deterministic model

Core records should remain provider-independent:

- `SeriesImage`: stable ID, source metadata, palette, confirmed roles and role locks
- `SeriesDifference`: per-image color/share/role differences and supporting evidence
- `SeriesStrategy`: follow-primary, balanced or preserve-accents
- `UnifiedPalette`: editable colors and roles plus per-image exceptions
- `SeriesReport`: inputs, corrections, metrics, strategy and export metadata

Metrics must be reproducible and explainable. Any normalized indicator must publish its inputs and must not be presented as a universal measure of beauty. AI may interpret results but may not alter measured colors, shares or differences.

## Risk corrections

### Pixels do not prove roles

Automatic roles are suggestions. Users can correct each image independently; uncertain roles require confirmation. Reports and unified results update after correction.

### Variation is not inherently wrong

Use neutral language such as difference/deviation. Follow Primary and Balanced never silently overwrite locked accents. Preserve Accents unifies foundational roles while retaining intentional per-image accents.

### Feature density

Overview, inspection and unification remain separate. The default view hides detailed pairwise comparisons. Existing single-image workflows and mobile usability are release-blocking regression checks.

## Acceptance tests

1. Two-image series produces deterministic shared/additional/missing color results.
2. Identical images produce no unexpected color or role differences.
3. Reordering does not change computed results; changing the primary image changes only primary-relative presentation and strategy output.
4. Same-color/different-role fixtures remain independently correctable, and reports update after correction.
5. Intentional accent differences remain under Preserve Accents while foundational roles unify.
6. Locked roles and accents are never silently overwritten.
7. Follow Primary and Balanced produce explainable, editable unified palettes rather than simple channel averaging.
8. Every metric shown in the UI has a corresponding deterministic unit test and visible supporting evidence.
9. Switching overview/inspection/unification preserves all series state; leaving series mode preserves single-image state.
10. The 390 px layout has no horizontal overflow and each task level remains operable.
11. Existing 11 single-image browser workflows continue to pass.
12. CSS/JSON/report exports match the edited unified state and use versioned schemas; PNG output is visually reviewed.
13. Local analysis works with AI unavailable; AI is invoked only after explicit user action.
14. No source images are uploaded during deterministic series analysis.

## Implementation slices

1. Domain records, deterministic difference engine and unit fixtures
2. Series state and three-level responsive workflow
3. Unified strategies, exceptions, previews and exports
4. Optional AI interpretation and failure handling
5. Full regression, production verification, stage-gate review and merge

Each slice requires relevant tests, documentation updates and a commit. The feature does not merge to `main` until the complete stage gate passes.
