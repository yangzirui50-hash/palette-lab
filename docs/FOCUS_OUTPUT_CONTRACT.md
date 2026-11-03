# Visual-focus evidence contract

## Scope and acceptance

Version `1.2.0-prototype` is a local review candidate. It includes published daily-operation fixes and candidate 1.1.0 as its starting point. It is not human-attention qualification or a production release.

Keep three layers separate:

1. **Measured contrast**: unchanged palette-independent heat, opaque support and connected response regions.
2. **Geometric presentation**: compact supported positions, extended support, hollow outlines and frame-like support. These shapes say where measured response exists, not what an object is.
3. **Perceived focus**: named subjects, subject groups, primary/secondary relations, meaningful contours/color relationships, balanced/no dominant attention, or genuinely insufficient evidence. This layer remains unassessed by the current algorithm. Neither multiple responses nor low contrast establishes it.

Human comments and model-viewing context stay in the private external review archive. Do not commit names, verbatim feedback or invented human coordinates. Do not tune by image name, image hash, category shortcuts or per-case coordinates.

## Current response contract

`AttentionEvidence` retains `heat`, `version`, numerical diagnostics and the legacy `state` values for compatibility, and adds `regions` and machine-readable `scope: 'contrast-only'`. It is an ephemeral Worker result, not a change to saved projects, report tokens or AI payloads. The legacy independent point/state qualification harness explicitly skips this scope even when annotation files are provided: it cannot silently score contrast states as semantic focus states. A future qualification harness must match the new output types before claiming perceived-focus acceptance.

| State | Meaning permitted in the UI | Meaning not established |
| --- | --- | --- |
| `empty` | No opaque pixels | Aesthetic judgment |
| `uniform` | Contrast below the absolute floor | No semantic focus |
| `distributed` | Broad measured contrast support | Evenly distributed human attention |
| `uncertain` | No qualifying stable response | No meaningful subject |
| `single` / `multiple` | Supported compact contrast positions | One/multiple semantic subjects, human priority |
| `regions` | Measured region/outline without a compact position | Full object/contour recognition |

Each response region carries sorted row-major support cells, normalized bounds, contrast-energy share, geometric kind and the count of qualifying cores connected through measured weak support. Cells are not an object mask. Bounds are metadata and must not be drawn as filled objects. Alpha gaps and zero-support holes remain unfilled.

A point is only emitted when its weighted centroid is supported and its selected component has compact geometry. No nearest-cell projection is allowed. Frame-like support is preserved rather than suppressed: a frame may be decoration, signage or meaningful lighting. No blanket edge penalty is allowed.

Geometry is deterministic and palette-count independent. `outline` means the weighted center lies outside measured support; `extended` means support spans more than 55% of an axis with less than 50% bounding-box occupancy; `frame` additionally requires at least 85% extent in both axes and at least 65% measured support on each outer edge. These are engineering shape rules, not fitted human-attention thresholds. They require counterexamples and do not establish semantic correctness.

Connected parents are shown once, with independent strong positions retained when appropriate. Connectivity is not an object-identity inference; distant parts of one person can remain separate, and two objects can be connected by weak response. Model order is energy order, not attention rank. At most three parent regions and three supported compact positions are shown; omissions are disclosed.

## Required regression evidence

- Hollow symmetric and asymmetric outlines: preserve support and holes, emit no arbitrary point.
- Compact targets at all edges/corners: retain supported positions; do not erase meaningful edge subjects.
- Two independently strong targets with a weak bridge: preserve two supported positions and expose their shared response parent, without claiming subject identity.
- Transparent gaps, unequal opaque weights, mirror transformations and resolution changes: preserve support invariants and avoid false location priors.
- Fragmented / broad / low-contrast / empty inputs: keep distinct reasons; never silently translate them into a semantic no-focus verdict.
- Real Worker/UI flow: upload, mask display, coordinate scope, responsive layout, source replacement and color-count independence.

The existing 30-image review is a **development diagnostic set**, not a blind holdout or an accuracy denominator. Before/after reports preserve every changed point, including losses in compact output, and retain unresolved semantic errors. A new mask or fewer points is not automatically a success.

## Development and release sequence

1. Freeze this evidence/presentation distinction and verify geometry with synthetic counterexamples.
2. Run all 30 development images unchanged and inspect added/removed positions, response masks and unresolved subject errors. Keep raw feedback separate from assistant interpretation.
3. Evaluate a local semantic-evidence adapter separately. Detecting a face/person is evidence, not a rule to make it primary. Evaluate portraits, paintings, subjects dominated by color relationships, multiple people and action/story context. Measure model bytes, runtime, failure behavior and licensing before adding a dependency.
4. Extend perceived-focus output only when evidence can support it. Retain `unassessed` for unsupported subject ranking, full contours and no-dominant judgments.
5. Review an actual comparative prototype when subjective tradeoffs remain. An evidence-only engineering pass must not be reported as visual-focus acceptance.
6. After the output contract and failure strata stabilize, evaluate independent images with explicit annotations appropriate to each output kind. Report subject coverage, unsupported points, duplicate response/subject distinctions, ordering and scope separately. Never synthesize human boxes from verbal descriptions. Scale to the thousand-image operational/quality task only after these metrics are meaningful.

Stop for user judgment only with concrete before/after evidence and a specific unresolved preference. Routine implementation, safe branch work, regression and documentation proceed autonomously.
