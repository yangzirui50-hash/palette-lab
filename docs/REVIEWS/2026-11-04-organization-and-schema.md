# Exact output guidance and a separate whole-image reading prototype

Four additional verbal judgments have been received and preserved privately. They distinguish clear hierarchy, form/line organization, gesture/atmosphere, and a coherent field without a unique center. All four are now development comments. They are not independent held-out qualification, fixation measurements or bounding-box annotations. The already accepted readable text presentation remains the product baseline.

## Shipped-to-review code boundary

The branch adopts a server-only JSON Schema description derived from the same Zod result schema used for validation. The semantic guide, result shape, color engine and accepted UI remain unchanged. Prompt metadata is `semantic-focus-2-schema-1`; old records remain valid and are not automatically reanalyzed.

An invalid JSON/schema attempt now supplies its bounded previous visible answer and up to eight validation issues to the existing second attempt. Valid first answers do not trigger review. The cap remains two attempts, each with 4096 output tokens; 401/429 behavior is unchanged. The adapter does not guess a dominance label, select a primary target, invent an entity or convert bad model ranks to a preferred human answer. Hidden reasoning is not forwarded. This is structural recovery, not an attention-accuracy correction. A repair request can have additional input tokens; no billing reduction is promised.

Schema serialization stays in the provider module. The client asset names/sizes remain those of the preceding build, including the color Worker and validation chunk. No package or local model was added, and no semantic judgment automatically changes role colors.

## Frozen experiments

The study used 26 development images: sixteen reused examples and ten additional semantic-API cases from the already verbally reviewed original corpus. The latter were not a new blind or held-out set. Every request used the same compressed source and independent fixed measurements; no case IDs, filenames, human answers or per-image rules were sent. All prompts, schema modules, input digests, final visible outputs, failures and usage remain outside Git.

| Arm | New calls | Strict-valid | Observed median | Peak/cache-miss estimate |
|---|---:|---:|---:|---:|
| Original semantic guide + exact JSON Schema | 26 | 25 | 3.90 s | USD 0.04315 |
| Same with relationship/composition kinds | 26 | 25 | 3.76 s | USD 0.04438 |
| Design-reference interpretation, still requiring overall ranks | 26 | 26 | 4.42 s | USD 0.04719 |
| Separate whole-image reading and unranked local cues | 8 | 8 | 3.37 s | USD 0.00905 |

The first two arms were frozen together. The later two are explicitly different product-output prototypes, frozen separately before their calls. They cannot be scored as like-for-like attention-ranking improvements. Timings are observed operations across differing prompts/output lengths, not controlled speed guarantees. Estimates use the previously verified official peak/cache-miss rates, not invoices. No higher-effort or automatic self-review call was introduced.

Exact structure guidance still produced one contradictory ranked/two-primary output. On the reused sixteen-image subset, its strict-valid count is the same as the preceding baseline's, with different failed cases. It does not establish a higher format success rate. It is adopted as a precise contract plus a tested repair path, not as a numerical reliability or semantic-quality claim.

The expanded-kind arm failed a new non-spatial constraint when the model put a box on a smile relationship. That additional policy contributes to its failure count and is not equivalent to the base schema's requirements. The arm did not consistently improve priority judgments and is not adopted. A later reference-reading prototype allowed localized relationships and made whole-image composition explicitly non-spatial, but retained disputed object-first ranks. It also is not adopted as a ranker. These results preserve the actual remaining disagreements rather than tuning individual image exceptions.

The eight-image final prototype changes the contract: it describes overall organization/visual character and observable relations, then lists optional **unranked** local cues. This can describe a coherent field, action or atmosphere while retaining locally conspicuous details. It deliberately does not return a single total hierarchy or prove a viewer's preferred focus. It is a concrete product interpretation for owner judgment, not a replacement default or a claim that its prose is entirely correct. One ordinary call generated each prototype result; there is no second interpretation/review request in that prototype.

## Integration verification

- 245 unit tests in 28 files pass, including exact schema transmission, issue-aware bounded retry, rejection of an illegal dominance alias, no hidden-reasoning forwarding and the existing credential/provider-option boundaries.
- Five relevant browser workflows pass: source replacement, explicit-call cache through editing/ROI/reload/backup, invalid-refresh preservation, independent focus history and the general report. The preceding 74-workflow complete regular run remains historical; this backend-only change did not rerun all seventy-four.
- Type, lint, production build and environment-safety checks pass. There is no dependency change or production release.
- Six genuine `/api/focus` source-handler tasks bundled in Node returned 200 on their first attempts. Two additional tasks replayed exact captured invalid replies, then used one genuine API repair each. Both returned valid results on their second attempts with validation feedback. Replays are not paid HTTP requests. The first-call system prompt hash matches the evaluated schema-only arm exactly. This is not deployed Cloudflare verification or proof that the repaired semantics agree with a human.
- The read-only eight-image prototype verifies original digests and image loading at 1280px and 390px, has no default overlay, keeps relations/local details/old ranks collapsed, and makes no external asset requests. Existing review pages remain archived.

This iteration made 94 actual HTTP requests, estimated USD 0.15745; two replayed messages are excluded from billing counts. Including the preceding archive, there are 185 requests, estimated USD 0.40594, over repeatedly reused development images rather than 185 independent samples. These counts do not include human accuracy denominators.

## Required next judgment

The four new image judgments are complete; do not ask for them again. Ask only whether the concrete whole-image-first reading with optional local cues better serves the palette-reference workflow, or whether a single automatic total hierarchy should remain primary. The prototype is a changed output contract and must be chosen knowingly. No production merge, new local detector or thousand-image qualification is justified by valid JSON or agreeable prose alone. If the new reading is selected, give it an explicit task/schema identity and independent cache rather than reinterpreting old focus records, and preserve optional historical focus candidates and user decisions.
