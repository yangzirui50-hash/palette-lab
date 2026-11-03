# Prepare the human evidence gate before scaling

_Date: 2026-11-03. Application release: 2bb529f._

The fifth repair's 208 unit tests, 58 regular browser workflows, local production-build smoke and public smoke pass. GitHub functional verification succeeds. The public check imports original colors, recovers custom roles/candidates, downloads palette cards/JSON and verifies phone/series flows without API calls or browser/network errors. Public JS may have a different build hash from the local artifact; acceptance records the actual deployed assets rather than assuming identical names.

## Revised diagnosis

Daily-use lifecycle and delivery failures were higher value repairs than blindly repeating 1000 uploads. Their composed regressions exposed wrong colors, lost edits, lost projects, stale dependent reports and discarded ROI evidence. Those are now repaired, but automated operational passes still do not establish whether an estimated focus is meaningful to a person. Further tuning against the same small corpus could improve an average while overfitting semantics or hiding failures.

A provenance audit adds a second caution: the six five-image category groups came from retrieval and include paintings/historical portraits. They cannot be treated as rigorously balanced modern-photo, UI, text, edge-subject or negative strata. The earlier four-color portrait +3.5-point unassigned-area regression remains a visual-review item; color abstention is not an attention-accuracy measure.

## Concrete next step prepared

An offline 30-image two-reviewer packet retains original licensed bytes, hashes and attribution. Separate A/B pages show no predictions and use distinct orders. They support normalized boxes, single/multiple/distributed/uniform states, uncertainty/notes, explicit per-image confirmation, local recovery and identity-checked portable progress. Human answers have not been created. Tool QA uses clearly synthetic records, separately from the real packet.

The comparison CLI validates both files and original bytes, rejects duplicate reviewers/rows, impossible geometry and false completion, preserves missing cases and uses one-to-one region matching. Its JSON and HTML list disagreements rather than synthesizing labels or producing a qualifying manifest. IoU 0.5 only identifies cases to discuss; agreement does not prove correctness. The existing focus acceptance runner continues to require a separate held-out dataset and must not be fed this pilot disguised as one.

Six synthetic Node tests and two synthetic browser workflows pass. The actual packet's 30 source images load locally without errors or network requests; no human annotations are generated. Type/lint pass. The separate 12.6MB transfer ZIP contains only the A/B pages, original images, provenance and guide; it excludes QA records and algorithm evidence. A separate post-blind color-review page retains the known portrait case and current 4/6/8-color outputs, so it need not contaminate annotation.

The human action is now specific: two people independently mark the images and return their JSON files. First review five images if the wording is unclear, revise the protocol if needed, and preserve protocol versions. After disagreement review, freeze definitions/algorithm, curate new actual-content strata and only then start independent qualification and the proposed 1000-image allocation. Do not turn four/six/eight-color reruns into independent image counts.

The first five images are shared across A/B but independently ordered; the remaining images also have distinct orders. This makes the small first checkpoint comparable without requiring all 30 labels before discovering ambiguous instructions. The original retrieval buckets select starters for variety only, not a claim of semantic category balance.

## Dependency audit reflection

The security job remains active and fails for the development minimatch chain. [The upstream advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) lists versions below 11.0.1 affected and 11.0.1 patched. Current locked consumers include minimatch 3.1.5 and 9.0.9; legacy ESLint code imports the default function shape. A forced cross-major override is not demonstrated compatible and is not applied to make CI green. Dependency/toolchain migration requires its own compatibility review; no audit threshold is weakened and no new dependencies are added here.
