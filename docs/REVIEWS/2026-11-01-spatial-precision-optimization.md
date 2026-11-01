# Spatial Precision Optimization Review — 2026-11-01

## Changes

- Increased global palette and spatial analysis maximum edge from 320 to 512 pixels to reduce downsampling color blending.
- Changed connected-region traversal from four-neighbor to eight-neighbor connectivity so diagonal strokes remain continuous.
- Reduced highlight feathering from 1 px to 0.65 px to limit neighboring-color bleed.
- Reused compatible completed analysis where possible, but measured no meaningful performance improvement and do not claim it as an optimization win.

## Verification

- 72 unit tests and 20 regular browser workflows pass, plus the opt-in 50-image benchmark.
- Diagonal-stroke coverage proves two diagonal pixels remain one component.
- The permanent night-city assertion still reports zero red-like pixels in the deep-blue selection.
- Final night screenshot has no visible red contamination and places the dominant deep-blue area at upper-left instead of a misleading average center.

## Fifty-image comparison

| Metric | 320 px baseline | 512 px optimization |
|---|---:|---:|
| Passed | 50/50 | 50/50 |
| Total time | 56.711 s | 73.290 s |
| Mean per image | 1.030 s | 1.463 s |
| Median | 1.091 s | 1.452 s |
| 95th percentile | 1.389 s | 2.373 s |

The mean increased about 42%. Higher precision has a real performance cost; it is not presented as a free improvement.

## Color evidence changes

- Person unassigned share decreased from 0.6% to 0.4%.
- Neon unassigned share decreased from 12.2% to 9.9%.
- Night-city unassigned share increased from 16.0% to 22.9%: additional real detail is visible, but a six-color palette cannot reliably represent all of it. This is explicit uncertainty, not forced incorrect assignment.
- The night palette now retains distinct red, blue and warm-light families, and the cross-color regression remains at zero.

## Remaining limits

- Two real images and 48 synthetic fixtures do not establish universal real-world quality.
- Higher unassigned rates on complex images need per-image review rather than automatic threshold relaxation.
- Eight-neighbor connectivity improves diagonal continuity but still does not provide semantic object segmentation.
- Full-resolution analysis, actionable hotspots and broader independent real-image coverage remain future stages.
