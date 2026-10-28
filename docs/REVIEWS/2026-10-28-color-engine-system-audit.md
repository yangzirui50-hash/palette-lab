# Color Engine System Audit — 2026-10-28

## Scope and conclusion

Reviewed global extraction, salient-color protection, OKLCH clustering, spatial assignment, connected-region overlays, scattered-color heatmaps, ROI state and automated coverage. The owner's night-city image was used as an adversarial case, alongside targeted synthetic experiments.

The failures are systemic rather than a single red-color calibration issue. Passing 61 unit tests and 16 browser workflows proves only the covered examples; it does not establish general color-engine reliability. The previous distribution-mode acceptance was too optimistic and is superseded by this review.

## Critical findings

### 1. Hue is averaged as a linear number during clustering

`extract.ts` averages OKLCH hue channels directly. Angles near 350° and 10° are adjacent reds but can be averaged toward the opposite hue. A targeted wraparound-gradient experiment produced two swatches whose stored OKLCH differed from the OKLCH recomputed from their displayed RGB by approximately 102° and 138° in the hue component.

Impact: unstable color families, incorrect salience, misleading roles, inconsistent exports and wrong downstream assignment. Distance calculations elsewhere using OKLab do not fix the clustering mean itself.

Required correction: average hue through OKLab/vector components, then return to OKLCH; recompute final OKLCH from the actual emitted RGB so every module sees one consistent swatch.

### 2. Spatial assignment forces every pixel into a palette color

The dark-red hair sample `#5C1921` is closer to `#343543` than to the other extracted swatches in OKLab. Because no true red representative exists and there is no confidence/unassigned state, red hair is visibly highlighted under a blue-gray selection.

Impact: mathematically nearest does not imply perceptually valid. Region maps and distribution heatmaps both inherit this error.

Required correction: preserve multiple chromatic families before spatial analysis, use hue-aware assignment where appropriate, and expose low-confidence/unassigned pixels instead of forcing a match.

### 3. Distribution convolution creates artificial edge enhancement

The Gaussian implementation repeats clamped edge samples. For an identical isolated light, measured heat peaks were:

- Center: 0.16423
- Edge: 0.27724
- Corner: 0.52214

The corner peak is about 3.18 times the center peak without any additional visual evidence.

Impact: salient centers, hotspot counts and energy shares can vary merely because a light approaches an edge.

Required correction: normalize convolution by available evidence or use a zero-padded, explicitly defined boundary model; add center/edge/corner invariance tests.

## High-priority findings

### 4. Salient-color protection is structurally incomplete

Only one salient hue-bin center is seeded. Red hues on both sides of 0° can be split into separate bins, while multiple small chromatic families compete for limited clusters and may be absorbed during later iterations.

Required correction: protect eligible families across hue and lightness, merge wraparound bins, and verify that protection survives the complete clustering process rather than only initialization.

### 5. Analysis is based on a 320 px thumbnail

A 5404 × 3040 source is reduced to roughly 320 × 180 before palette extraction. Small lights, outlines and chromatic details can be blended away before measurement. Regular-stride sampling can additionally alias periodic content such as windows, fences or grids.

Required correction: use a resolution-aware, multi-scale sampling strategy and avoid periodic-only sample selection. Keep display performance separate from measurement fidelity.

### 6. Distribution metrics are not yet stable comparison metrics

Fixed pixel-radius contrast, a bounded 40-cell grid and relative peak thresholds make results resolution- and composition-dependent. Hotspot circles summarize density but do not describe object boundaries. The current glow-heavy visualization also lacks an actionable workflow.

Required correction: define resolution-normalized contracts, separate within-image relative evidence from cross-image comparable metrics, and let users open a hotspot as a local analysis scope with its own palette.

### 7. Spatial state and computation need lifecycle hardening

Distribution and region assignments are recomputed for every ROI pointer update, and overlay generation repeats analysis. ROI is not explicitly reset when the source image changes, so a previous normalized rectangle can be applied to a new image. Errors can leave stale visual evidence visible.

Required correction: separate draft and committed ROI, share one analysis result between metrics and overlays, reset scope on source change, and invalidate stale evidence explicitly.

## Test blind spots

Current tests do not independently cover:

- Hue-wraparound clustering and RGB/OKLCH output consistency
- Multiple simultaneous small chromatic families
- Dark saturated pixels assigned to a perceptually unrelated swatch
- Pixel-level proof that a red region cannot appear in a blue selection
- Center/edge/corner distribution invariance
- Resolution and downsampling stability
- Periodic-pattern sampling aliases
- ROI reset, stale-error and drag-performance behavior
- Real-world photographic complexity versus self-generated fixtures

The neon fixture verifies the implementation's own assumptions; it is not independent evidence of general performance.

## Remediation order

1. Correct hue mathematics and swatch consistency; add adversarial unit tests.
2. Replace forced-only assignment with confidence-aware evidence and preserve multiple chromatic families.
3. Fix distribution boundary bias and define resolution-normalized metrics.
4. Unify analysis results, harden ROI lifecycle and add real-image regression cases.
5. Make hotspots actionable through local-palette analysis, then resume edge-aware region refinement.

No current local commit should be described as production-validated for general images until these gates pass.

## Follow-up verification

- Hue now updates through OKLab vectors; emitted RGB and OKLCH are consistent in wraparound-gradient tests.
- Multiple salient families use constrained centers so they cannot drift back into muted neutrals during later iterations.
- Hue-compatible reassignment handles lower-chroma conflicts; pixels without a compatible candidate remain explicitly unassigned.
- The permanent night-city browser regression proves a red representative survives and zero red-like pixels enter the deep-blue selection.
- Distribution uses an average-density boundary after zero padding was independently found to create a uniform-field center hotspot. Both uniform-field and edge/corner tests now pass.
- Stale overlays are keyed out while new work loads, ROI dragging commits analysis only on release, and source changes reset the spatial panel.
- Current gate: 66 unit tests and 17 browser workflows, ESLint and production build pass locally.
- Remaining open work: higher-resolution and alias-resistant sampling, cross-image distribution contracts, actionable hotspots and continuous-region edge refinement.
