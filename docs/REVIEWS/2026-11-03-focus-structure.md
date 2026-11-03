# Structural evidence prototype review

## Result

`fix/focus-structure-prototype` starts from published daily reliability `ed7d32f` and reuses focus candidate `89edc22` through isolated cherry-pick `f410994`. Model `1.2.0-prototype` is a review candidate, not a production release or perceived-focus accuracy improvement claim.

The unit replaces arbitrary nearest-supported-cell projections with measured connected response support. It removes projected dots from hollow/extended shapes without erasing compact edge targets. SVG row runs preserve actual support holes rather than filling bounding rectangles. Connected parent regions are drawn once while independent strong responses can retain supported positions. Multiple positions are explicitly not semantic subject counts or human priority.

`scope: 'contrast-only'` travels through the Worker and DOM. Low contrast does not assert semantic no-focus. The legacy independent point/state qualification harness skips this scope even if an annotation path is supplied; a future perceived-focus evaluator must match subject, relation, extended-region and no-dominant outputs. See [the output contract](../FOCUS_OUTPUT_CONTRACT.md).

## Development evidence

All 30 hash-verified development images retain exactly the preceding contrast grid, peak and heat values. Output changes from 11 single / 8 multiple / 11 uncertain to 8 single / 6 multiple / 5 region-only / 11 uncertain. Eight images lose one point each, from 29 to 21 total positions, while retaining response support. This is a mechanical delta, not eight corrected images. Semantic misses, extra centers, duplicate subjects, priority and color-relationship issues remain unresolved. No verbal comment has been converted into a box, probability or accuracy denominator.

Raw feedback, interpretations, immutable prior comparisons, the new 30-card report, image bytes, output JSON and experiment assets remain in the external workspace archive. Neither comments nor model files enter Git. No file/hash/category-specific algorithm rules were added.

## Feasibility experiment not adopted

An external local probe used the official MediaPipe Tasks Vision 1.2.0 package, verified against registry SHA512, and SHA256-frozen short/full-range face models. Every image used the same thresholds (detection 0.5, suppression 0.3), CPU delegate, four orientations and either the whole image or the whole image plus four overlapping 60% crops. The two schedules comprise 240 and 1200 inference passes; these are repeated views of 30 images, not independent samples.

Face-location evidence can supplement some portraits and rotated subjects, but fixed cropping/rotation also produces non-face detections in architecture, water, still life and abstract imagery. Some secondary figures remain missing. Detection scores do not establish primary attention. No detector was added as an app dependency or priority rule. The probe blocked all off-origin browser requests, including a runtime attempt to contact its logging endpoint. Timings are operational observations, not controlled speed or accuracy claims.

Official references: [capabilities/models](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector), [browser usage and synchronous inference](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js), [short-range model card/license](https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20(Short%20Range).pdf). Worker isolation, model reliability and resource/network behavior require separate evaluation before adoption.

## Verification

- 230 unit tests in 26 files and seven pilot CLI/server tests passed.
- Complete browser run: 73 passed, comprising 70 regular workflows, the 50-image operational benchmark, the 30-image count/view matrix and the 30-image structural probe. One independent-human qualification test was skipped. The matrix contains 90 count settings across two views, not 90 independent images.
- Final scope guard and accessible heatmap wording: nine focused browser tests passed and the semantic qualification guard skipped the incompatible harness even with an annotation-path parameter. No annotation file or human box was generated for that guard check.
- Type, lint, environment safety, production build and built-Worker checks passed. Built checks cover neon position, count/export, domain stability, reload, phone width and outline support without a projected border dot. Exact final assets/logs remain outside Git.
- The standalone report loads 60 embedded comparison/experiment images, 30 quotes and 30 author/source/license credits at 1280px and 390px, without external asset requests or browser errors.

The first bridge UI assertion assumed a painted gray connector necessarily qualified as measured weak support. Actual normalized heat had a gap and correctly retained two masks. The assertion was corrected to the measured-support contract; the raw-grid test still verifies grouping through a qualifying bridge. Original failure evidence was preserved. No threshold was changed to make the example pass.

## Next decision

Obtain a narrow presentation judgment on supported ranges versus forced dots in four changed examples. This does not repeat all 30 annotations or accept semantic accuracy. Presentation approval alone must not globally merge the prototype. Next evaluate semantic evidence and relation/contour extraction against dedicated failure strata and new independent images, keeping color/role workflows stable. The thousand-image task remains downstream of an evaluator matching the output contract.
