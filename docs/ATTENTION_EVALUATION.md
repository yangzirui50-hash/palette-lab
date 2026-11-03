# Visual focus: model and acceptance

_Updated: 2026-11-03_

## Meaning and algorithm

Color-region location, selected-color hotspots and whole-image focus are distinct measurements. The new whole-image estimate uses source pixels independently of palette extraction. It can return single, multiple, distributed, uniform or empty. A balanced centroid between subjects is not emitted as a subject location. ROI coordinates refer to the cropped region. The UI shows an expandable heatmap and numbered candidates.

`attention.ts` pools opaque pixels into an aspect-preserving grid with at most 64 cells on the long edge, averaging OKLab coordinates. Two center-surround color contrasts use radii of 4%/12% of the short edge and weights 60/40. Global color distinctiveness uses a population-weighted Lab histogram with 0.05 bins. Local/global weights are 55/45. Means use opaque pixels and available image support; there is no center prior or synthetic black padding.

The median response and an absolute 0.008 floor are removed. Peak below 0.018 yields no focus. Eight-connected components above 50% of peak produce candidates, requiring at least 8% of energy and 30% of the leading component's energy. At most three are shown. Active support exceeding 40% of opaque pixels, or no qualifying component, yields a distributed result. These are initial engineering constants, not parameters learned from human eye tracking. Freeze them before held-out evaluation; tune only on development data.

The computation and rendering run in a cancellable local Worker. Palette count/selection cannot change the same source/ROI's focus. Heat is relative model contrast, not fixation probability or aesthetic quality. Faces, text meaning, gaze and viewing intent are not recognized. Fine details can disappear at raster/grid resolution; nearby targets may merge and strong texture or lights may outrank a semantically important subject.

## Automated contracts

- Bright, dark and chromatic targets at nine positions including corners: normalized-coordinate error <0.035.
- Two separated targets across square/portrait/landscape sizes: preserve both and avoid the gap.
- Mirror positions/strength equivariantly; doubling resolution shifts focus <0.025 normalized units.
- Uniform fields, small noise and uniform shapes surrounded by transparency: abstain.
- Repeated texture: no arbitrary single focus.
- Browser: verify numbered markers, visible heatmap and source replacement. Independent development images: verify identical estimates across 4/6/8 palette counts.

These are geometry/implementation contracts, not real-photo attention accuracy.

## Independent annotation protocol

The offline 30-image protocol pilot is prepared by `scripts/prepare-attention-pilot.mjs IMAGE_DIRECTORY OUTPUT_DIRECTORY`. See `ATTENTION_PILOT_GUIDE.txt`. It validates cached development-image hashes and preserves provenance/attribution, then generates separate A/B pages with distinct orders, normalized-box drawing, uncertainty/notes, local saving, identity-checked JSON restore/export and no algorithm overlays or network calls. Browser fixture tests are synthetic tool QA, not human labels.

After two real independent reviewers return their files, `scripts/compare-attention-pilot.mjs PACKET_JSON REVIEW_A_JSON REVIEW_B_JSON` validates identities, images, geometry and completion, and produces a disagreement JSON and side-by-side human-box HTML. Matching maximizes total one-to-one IoU; different state/count, overlap below 0.5 or either reviewer's uncertainty are discussion items, never automatically adjudicated truth. Missing/partial records remain explicit. The IoU threshold is a discussion aid, not an algorithm acceptance threshold. No held-out manifest or accuracy claim is generated.

These images have already been used in development, so the pilot is only a protocol rehearsal. The six original category prefixes are retrieval buckets: some product/portrait entries are still-life paintings or historical portraits. They do not establish modern product-photo/face/text/edge/negative coverage. Actual content and difficulty strata must be manually curated before sampling new development/held-out sets. Independent answers alone cannot make reused images held out.

At least two reviewers mark zero/one/multiple focal regions before seeing predictions. Record disagreements and adjudicate ambiguous scenes separately. Cover faces, text/posters, products, nature, night, texture/no-focus negatives, edge subjects and multiple subjects. Record normalized boxes, source, license and SHA256. Never use the algorithm's own predictions as labels.

The optional `attention-annotated.spec.ts` reads `ATTENTION_MANIFEST` and writes `test-results/attention-annotated-report.json`. Initial qualification requires >=100 images, >=20 negatives and >=5 categories. Smaller pilots produce metrics but fail qualification. Freeze these proposed engineering gates before the held-out run:

| Measure | Gate | Purpose |
|---|---|---|
| At least one top-3 candidate within an annotated region | >=90% positive images | Find a useful focus |
| Annotated region recall | >=80% | Preserve secondary foci |
| Candidate precision | >=80% | Penalize extra false foci |
| Median / p90 center error | <=8% / <=15% image diagonal | Localize with aspect ratio respected |
| Explicit-focus false positive rate on negatives | <=5% | Permit no-focus answers |
| Single/multiple/distributed/uniform state accuracy | >=85% | Assess structure |

Report category and edge/center strata, sample sizes, failed examples and center-only baseline hit rate. Box centers approximate broad/irregular focal regions: interpret center errors alongside region hits. Raw per-image output supports stratified review. Aggregate passing does not prove each category passes.

No independently annotated focus dataset is available in this change. These human-quality gates are **not run**. Human region agreement is also weaker than eye tracking. Any future fixation claim needs licensed eye-tracking data and NSS, CC, SIM and a center-bias-aware metric such as shuffled AUC. Follow the required map representations in the [MIT/Tübingen definitions](https://saliency.tuebingen.ai/results.html), [Bylinskii et al.](https://arxiv.org/abs/1604.03605) and [Kümmerer et al.](https://openaccess.thecvf.com/content_ECCV_2018/papers/Matthias_Kummerer_Saliency_Benchmarking_Made_ECCV_2018_paper.pdf).

## Cost-effective 1000-image allocation

Proposed unique-image allocation: 100 controlled geometry/color/alpha/noise challenges, 400 independent development images and 500 frozen held-out images. The current 30 licensed source images belong to development and cannot later be held out. Count unique bytes, not repeated runs.

Within the 500 held-out images, annotate focal regions on 200 balanced images, including >=40 no-focus/distributed negatives. Run color, coverage, state and performance checks on all 500. Human-review difficult color/ROI cases with targeted masks rather than densely labeling every image. Start with a 30-image two-reviewer pilot to settle ambiguity, then freeze the protocol. These future 1000-image and annotation stages are not complete.

## Annotation format

```json
{
  "split": "held-out",
  "annotationMethod": "independent-human-regions",
  "annotators": ["reviewer-a", "reviewer-b"],
  "entries": [{
    "file": "licensed-image.jpg", "sha256": "64 hex characters",
    "source": "https://source.example/image", "license": "licensed source",
    "category": "portrait", "state": "single",
    "targets": [{"x": 0.1, "y": 0.2, "width": 0.2, "height": 0.3}]
  }]
}
```

Images reside beside the manifest; negative states have no target boxes. This is a format example, not a scored dataset. Set `ATTENTION_MANIFEST` to its absolute path and run `npm run test:e2e`.

## Efficient execution schedule

Every code change runs unit/static checks and the regular browser suite. Algorithm changes additionally run the 50-image regression benchmark and the external 30-image 4/6/8-color matrix. Expand development data by failure category rather than repeating successes. Run the frozen 500-image held-out evaluation only after the candidate and thresholds are fixed; reserve the annotated subset for quality qualification. Record images, configurations and reruns separately, so three color counts do not become three independent images.

On this machine the 30-image multi-count matrix took about 247 seconds. A thousand-image matrix at comparable size/settings would be roughly two hours before annotation and failure review; that is an extrapolation, not an executed run or guarantee. First use the small suites to eliminate pipeline bugs. The two-reviewer 30-image pilot should settle whether the proposed labels and gates are usable before paying for the larger annotated set.
