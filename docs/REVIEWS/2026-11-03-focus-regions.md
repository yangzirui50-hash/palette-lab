# Focus-region candidate 1.1.0

_Baseline: ad1a0f8. Review branch: fix/focus-region-evidence._

## Concrete failure

The neon-sign development image had strong contrast (peak about 0.665) and only about 0.54% strong support. Its largest separate high-response component had about 3.09% of total energy, below the 8% gate. No components qualified, and the original branch labeled that failure distributed even though broad support was not the cause. Existing color/pipeline tests could pass while this user-visible interpretation failed.

## Candidate and rationale

Keep the heat, rasterization and energy gates fixed; compare only region selection. Shadow support fractions of 0.50/0.35/0.25/0.20/0.15 showed increasingly many localized outputs. The lowest support fraction produced localized outputs on all 30 development photos; coverage alone is insufficient reason to prefer it. Use 0.35 as a conservative candidate, preserve original independently qualified strong cores across weak bridges, reject zero/transparent crossings and require measured locations. A symmetric ambiguous hole abstains; a uniquely supported irregular-region position may be projected.

Actual source decoding confirms all 30 heat arrays and peaks are unchanged. The candidate gives 11 single, 8 multiple and 11 uncertain results, versus the baseline's 7 single, 2 multiple and 21 distributed results. These are output distributions, not accuracy. The neon candidate is at approximately 85.3% across and 45.2% down, on the vertical sign; its measured envelope does not claim to capture the entire sign assembly or a person's full attention region. Uncertain cases remain visible.

## Verification and review boundaries

220 unit tests pass, including nine region-selection contracts and three reporting contracts. Targeted browser tests pass for fragmented abstention, independent targets through a faint bridge and the preceding focus/ROI/overlay workflows. Complete workflow, 50-image benchmark, 30-image count/view matrix and production-build evidence are recorded separately in the dated output folder. Counts and time are not combined into human accuracy.

Final acceptance after the count-intent correction: 64 regular browser workflows, 50/50 benchmark images and 30/30 development images across 90 count settings pass (66 browser tests passed, one human-annotation opt-in skipped). All 90 coverage percentages match the previous source-pipeline baseline. Benchmark mean is 1005.92ms, p95 1546ms; there is no controlled speedup claim. Seven pilot CLI/server tests, type/lint/environment safety and full production build pass. Main JS is about 448kB/147kB gzip, with the stable 98kB validation chunk; Worker is about 106kB. Build and live-source output are checked separately.

The original human export remains unchanged outside Git; provisional choices and verbal observations are not converted into coordinates, confirmation or held-out labels. A self-contained 30-case before/after contact report exposes all candidate changes and remaining abstentions. No real AI request is needed. The independent annotated qualification and thousand-image run remain unexecuted.

## Reflection

The initial projection experiment suppressed irregular measured regions when their centroid fell in a gap. A supported-position projection with explicit symmetry abstention avoids both empty markers and arbitrary scan-order choices. A second contract exposed the need to protect independently strong targets from weak-bridge collapse; hysteresis alone would not guarantee it. Synthetic geometry is necessary for those invariants, while real-image/semantic interpretation still needs human review.

The first complete browser run passed all 63 regular flows and the 50-image benchmark, but the 30-image matrix exposed a count-intent race on nature-40620188: four requested colors still produced five. A deterministic MutationObserver-driven input interleaving reproduced three decrement clicks ending at four rather than three. Source-completion effects had written an older processed count into the newer request cursor. Count intent now changes through user input and explicit project history/replacement; ordinary analysis completion updates evidence without resetting the cursor. The before-fix failure and focused recovery checks are preserved, and the full matrix is rerun rather than labeling its first failure a pass.

The next human decision is small and concrete: inspect the neon before/after and say whether the marker matches the intended focus, and whether the narrower response envelope is useful. That does not settle general accuracy. Review the remaining 30-case changes, curate actual-content strata and obtain independent labels before semantic claims or scale qualification. Candidate code and evidence are ready for review; production is not silently replaced while that interpretation is pending.
