# Multi-image Color Test Corpus

_Last verified: 2026-10-28_

## Purpose

The corpus checks shared contracts across different images rather than tuning behavior for one owner-reported example. No fixture receives application-side, image-specific thresholds or branches.

## Permanent fixtures

### Owner-provided imagery

- `night-city-test.png`: complex night photography/illustration with red hair, red balloons, dark blues and scattered lights. Assertions require a red representative, zero red-like pixels in the deep-blue selection, real overlay switching and ROI reset after changing source.
- `person-test.png`: anime portrait with red hair, near-white face/arms and peach shadows. Assertions cover complete all-region display, independent face ROI extraction, dominant local selection and unchanged global palette.

### Deterministic synthetic imagery

- `palette-test.png`: exact fields for baseline shares and browser workflows.
- `neon-test.png`: dense colored lights for distribution hotspots and mobile switching.
- `product-reflection-test.png`: smooth reflective product and adjacent tones.
- `landscape-test.png`: related blue/green families and a small bright sun.
- `ui-test.png`: flat interface surfaces, text and small semantic accents.
- `poster-test.png`: sharp editorial boundaries and typography.
- `monochrome-test.png`: neutral-only fields.
- `transparent-test.png`: opaque, transparent and partially transparent regions.
- `periodic-test.png`: saturated red-blue stripes that exposed periodic sampling alias.
- `tiny-test.png`: 16 × 16 input and small-dimension handling.

## Sequential workflow

`color-corpus.spec.ts` uploads person, product, landscape, UI, poster, monochrome, transparent and tiny images in one browser session. Every image must produce a non-empty normalized palette, valid unassigned text, finite visual-significance evidence, both spatial visualizations, no stale ROI and no runtime error.

Separate workflows check periodic red/blue family preservation, person ROI behavior and the night-city pixel-level cross-color assertion. Existing workflows cover exports, series, AI mocks and mobile layout.

## Timed 50-image benchmark

`benchmark-50.spec.ts` is an opt-in `BENCHMARK=1` workflow covering the permanent fixtures plus 39 additional deterministic images. The 320 px baseline passed 50/50 in 56.711 seconds; the 512 px precision update passed 50/50 in 73.290 seconds with a 1.463-second mean and 2.373-second 95th percentile. Only two images are real; this benchmark measures stability and timing, not broad real-world quality. See `docs/REVIEWS/2026-11-01-benchmark-50.md` and `docs/REVIEWS/2026-11-01-spatial-precision-optimization.md`.

## Current gate

- 72 unit tests
- 20 real-browser workflows
- ESLint and production build

## Limits

Synthetic fixtures cover algorithmic mechanisms but do not prove universal real-world quality. More independent real photography, portraits, products and complex scenes are still required before making a broad production-generalization claim. Higher-resolution fidelity and actionable hotspots remain separate acceptance stages.
