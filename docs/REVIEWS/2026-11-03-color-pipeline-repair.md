# Color pipeline and visual focus repair review

_Date: 2026-11-03. Baseline: a4376fd. Candidate: this repair commit._

## Findings and changes

- Default spatial denoising could relabel isolated red pixels blue, and feathering could reveal those pixels in the blue highlight. The new guard checks original hue and limits additional OKLab error; the soft mask is intersected with the hard assignment. Tests inspect actual rendered pixels as well as labels with denoising enabled.
- Rapid import/count updates could show a requested count of 7/8 with only six results. Synchronous refs, cancellable jobs and response IDs retain the latest request. Pending imports hide prior analysis controls; source replacement and same-file re-import reset ROI.
- ROI used to crop a downscaled thumbnail. It now crops native pixels first, then limits the analysis raster, and adds a local detail image while preserving full-image context.
- Accent-reserved centers could crowd broad light/neutral regions out of small palettes. A per-image candidate comparison accepts coverage alternatives only when both sampled reconstruction error and sampled reliable coverage do not regress. It is a sample-level guard, not a universal full-image guarantee.
- Main-thread raster/analysis/render work moves to a module Worker. ImageBitmap reduction initially exposed aliasing differences from HTMLImage's decoder path. High-quality reduction is now used for >=2x downscaling; smaller reductions retain low filtering to preserve crisp graphic boundaries. This preprocessing change is included in end-to-end comparisons.
- The old selected-color heatmap did not establish the whole image's visual center. A separate palette-independent contrast model now reports multiple candidates, no-focus or distributed outcomes, with explicit semantic limits. The selected-color label now says color hotspot position.

## Evidence and interpretation

The development corpus has 30 licensed Wikimedia source images, five each in night, nature, portrait, product, art and design. They are photographs, paintings and graphics; product is largely still-life art, and portrait is mixed-media. This does not establish reflective-product or photographic-portrait generalization. Sources, authors, license links and SHA256 are committed in docs/fixtures; source images remain external. The set was used for diagnosis and is not held out.

Color comparisons evaluate all 30 at 4/6/8 colors. Unassigned share and reconstruction distance measure different properties: forcing a pixel into an incorrect color could lower rejection while making the result worse. The denoising diagnostic counts reassignments that increase original-pixel OKLab error by >0.02; it is a proxy, not human-labeled semantic accuracy. Detailed before/after metrics and worst cases accompany the local validation artifacts.

The prior 50-image suite has two owner-provided art/anime scenes and 48 generated examples, rather than 50 independent photographs. Current reporter category names reflect this. Repeated successful uploads are functional/scale evidence, not an image-understanding score.

## Focus acceptance

`docs/ATTENTION_EVALUATION.md` documents implemented formulas/thresholds, 49 synthetic geometry/abstention/invariance contracts, actual browser markers and the independent human-region protocol. The optional evaluator records region recall, candidate precision, top-3 hit rate, aspect-aware diagonal error, negative false-focus rate, state accuracy and center-only baseline. No independent human labels are available; that qualification is explicitly not run. No eye-tracking accuracy or aesthetic score is claimed.

The proposed 1000-image allocation is 100 controlled challenges, 400 development and 500 frozen held-out images. Annotate focal regions on a balanced 200-image held-out subset (including >=40 negatives); run pipeline/state/performance checks on all 500. Begin with a 30-image two-reviewer annotation pilot to resolve disagreements. This allocation is a next-stage plan, not an executed thousand-image result.

## Security and deployment limits

No dependency was added or lockfile changed. The baseline GitHub CI failed npm audit for moderate development-only minimatch advisory GHSA-g3hv-75wg-m249. The registry advisory flags versions below 11.0.1, including the locked legacy dependency chains. Applicability and a compatible parent-chain upgrade need review; overriding legacy major APIs blindly is not justified. The unchanged audit runs in its own CI job so it does not prevent functional checks from running, and its failure remains visible. It has not been suppressed or declared fixed. See the [GitHub advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

Firefox/WebKit, real mobile devices, independent human focus qualification and universal real-world color/semantic accuracy remain unverified. GitHub synchronization and production deployment are separate checks; a successful push alone is not proof that the public app updated.

## Final local measurements

- TypeScript and ESLint passed; 147 unit tests passed in 16 files, including 49 focus contracts. Environment safety passed. New dependencies: zero; lockfile changes: zero.
- The 50-image browser benchmark passed 50/50 in 55.084 s (mean 1.100 s, p95 1.601 s) on this machine. Historical November 1 total was 73.290 s; this is a local observation, not a portable speed guarantee.
- External development corpus passed 30/30, with 90 image/color-count combinations and both spatial views, no runtime errors and stable focus candidates across palette counts. Total measured case time: 246.870 s. These runs are separate from regular browser counts.
- The final 30-image default-six-color mean unassigned share changed from 10.155% to 8.652%; mean nearest-color OKLab error from 0.054517 to 0.049406. At four colors, rejection changed 18.442% to 15.587%; at eight, 6.867% to 5.889%. Denoise reassignments increasing OKLab error by >0.02 changed from 27,481 to zero at six colors (a defined proxy, not semantic ground truth).
- Averages hide failures: nature-73750624.jpg at six colors still rose from 23.631% to 35.461% unassigned, and design-63794325.jpg at four colors from 6.810% to 10.519%. Changed resampling and strict chroma/hue acceptance contribute; this is not a universal coverage win. Lowering rejection alone is not a safe correction without labels. Keep these examples in development and investigate perceptual threshold stability separately.
- The controlled red pixel remains red after denoising and is excluded from the blue overlay. Three rapid double-count changes showed requested=actual=8. Native ROI detail and explicit re-import reset passed.
- Standalone main-thread monitoring of Shibuya, falls and astronaut observed zero >50 ms long tasks, versus approximately 1 s analysis stalls in the baseline. Upload-to-ready took 2.027/2.036/2.536 s, versus baseline 1.491/1.377/1.738 s: smoother interaction has a measurable total-wait tradeoff.
- Qualitative focus inspection is not a human-accuracy pass: astronaut and Shibuya returned distributed structure; the falls image chose the bright foreground stream (x67.8%, y87.3%) rather than establishing the waterfall as the semantic subject. This demonstrates the unresolved semantic gap and supports the independent annotation gate.

## Completed local acceptance

After updating assertions for the more precise area/hotspot labels, all 29 regular browser workflows passed (three opt-in suites skipped in that regular run). The two opt-in image suites had already passed separately: 50/50 fixtures and 30/30 independent development sources. Independently annotated human focus qualification remains not run. Final TypeScript/Vite production build passed and emitted the separate analysis Worker asset. The routine third-party Rollup comment-annotation warnings did not fail the build. Production and remote CI are checked after synchronization and are not inferred from local success.
