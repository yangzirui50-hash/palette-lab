# Preserve readable hierarchy; reject unproven automatic extra calls

The owner accepted the subject/part/priority text hierarchy as clearer than the earlier point presentation. This accepts readability only. Existing per-image preferences remain unchanged; there is no ranking, bounds or production-release approval. Exact feedback stays outside Git.

## Frozen comparison

The external experiment reused twelve previously inspected development images and added four licensed Commons files selected before model calls: two photographs and two paintings. A search intended to obtain a photographic portrait returned a painting; this content mismatch was explicitly recorded before requests rather than counted as portrait-photo coverage. Fresh-to-project does not mean unseen in model training, independently annotated or held out after future tuning.

Every request used the same encoded image and fixed full-source measurements. Human answers, case IDs, filenames, source titles and category labels were not sent to DeepSeek. The frozen semantic prompt was unchanged across the current and deeper-thinking arms. A second arm added a generic audit instruction and the fallible baseline draft. No per-case target, expected rank or recursive review was supplied.

- Baseline: saved `/api/focus` results for twelve known images; one non-thinking attempt for each of four fresh images, capped at 4096 output tokens.
- Deeper single pass: thinking enabled, high effort, 8192 output tokens, one attempt per image.
- Bounded review: one non-thinking 4096-token attempt per valid baseline draft, reusing the image and facts. No review when no valid baseline exists.

The experiment allowed no retry, unlike the product's at-most-two-attempt format/error handling. It had 36 planned image/arm records and **35 actual HTTP requests**: one review was skipped because the fresh baseline failed. Earlier runner console wording called all records `newCalls`; the audited summary separates the skipped record from paid requests. No failed record was repaired or silently replaced for the comparison.

## Observed outcomes

| Arm | HTTP requests | Strict-valid results | Median observed response | Peak/cache-miss estimate |
|---|---:|---:|---:|---:|
| Baseline, four fresh images only | 4 | 3 | 3.9 s | USD 0.00601 |
| Deeper single pass | 16 | 11 | 35.6 s | USD 0.12834 |
| Bounded review | 15 | 15 | 3.1 s extra | USD 0.02596 |

Timing is an operational observation across different request sizes and sampling times, not a controlled speed guarantee. Review cost/time must be added to an initial judgment. Estimates use USD 0.3/M input and USD 1.2/M output at the documented peak/cache-miss rates, not actual invoices. [Thinking parameters](https://api-docs.deepseek.com/guides/thinking_mode/), [vision](https://api-docs.deepseek.com/guides/vision/), [pricing](https://api-docs.deepseek.com/quick_start/pricing/).

A mechanical comparison found the same dominance label and the same `(targetId, tier)` edges in all fifteen valid reviews. Reasons and wording sometimes changed. This is evidence of retaining the draft's ordering, not fifteen correct predictions or a general claim that review cannot work.

The deeper arm reduced forced primary labels in some diffuse nature/abstract cases and preserved some clear face/pair subjects. It also regressed a luminous contour into the whole building, retained a disputed pair tie, and failed on important color/light ranking cases. Three responses used an object where the dominance string was required; two were truncated at the output limit. The fresh baseline also returned a non-enum dominance string. Strict rejection was retained. Raising the limit or accepting approximate schemas would not establish semantic correctness.

No contender demonstrated a coherent improvement sufficient to replace the current default. Do not enable either automatic high-effort thinking or an automatic self-review call. All sources, prompt/schema snapshots, final visible responses, raw failures, usage and comparison pages are preserved externally; hidden reasoning and credentials were not persisted. No new model, package or detector was installed.

## Independent report reliability repair

The original report prompt's phrase “actionable action” had produced mixed `actionable`/`action` recommendation fields. The provider now names the three exact fields and maps a string `actionable` only when the explicit `action` is absent, then validates the complete report. It never overwrites an existing action or lets a valid-looking alias hide an invalid explicit value.

244 unit tests and four relevant browser workflows pass, as do type checking, lint, production build and environment safety. The exact captured mixed-key failure succeeds in one local replay with no paid request. Two real `/api/analysis` Hono-handler invocations in Node return 200 on their first attempts. This is source-handler verification, not a deployed Cloudflare acceptance check. An initial replay assertion incorrectly replaced already valid action fields with undefined; that false check is archived separately, was corrected without changing application code, and is not counted as a provider failure.

The new comparison costs an estimated USD 0.16031 over 35 requests. The report probes add two requests and USD 0.00984. Together this iteration made 37 HTTP requests, estimated USD 0.17014. Including the preceding 54 requests, the cumulative archive contains 91 requests, estimated USD 0.24848, reusing many of the same images rather than 91 independent samples.

## Next gate

Keep the accepted presentation and the current bounded default. The four fresh images are ready for brief owner feedback with model answers collapsed initially; the twelve old comments do not need to be recollected. The page verifies all sixteen original digests, loads on desktop/phone, makes no external asset requests and has no default overlay. No overall attention accuracy is reported.

Use the fresh judgments to distinguish actual rank improvements from agreement with repeatedly inspected examples. The next engineering issue is precise output-structure guidance without inventing semantic corrections; the next ranking experiment must avoid simply anchoring on a fallible draft. Any stronger reasoning or localization component needs a demonstrated benefit before extra default calls or dependencies are accepted. Semantic advice still does not automatically select better role colors. The thousand-image task remains downstream of a matching evaluator and adequate human evidence. Production main is unchanged.
