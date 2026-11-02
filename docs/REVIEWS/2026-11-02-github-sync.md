# GitHub synchronization review

Date: 2026-11-02 (Asia/Shanghai)

## Result and scope

The October 28–November 1 development conversation was reconciled against the local `main` branch, code, tests and historical reports. All completed feature changes were already present in ten local commits after GitHub baseline `de78279`. This synchronization preserves those commits and adds documentation corrections; it does not reconstruct source code from conversational claims or publish raw conversation logs.

The code baseline reviewed is `a2b34ca`. The synchronization commit also updates README, status, spatial-analysis verification and corpus documentation. Remote completion must be established by checking the GitHub branch hash after push. GitHub synchronization alone does not establish which revision Cloudflare has deployed.

## Conversation to commit map

| Commit | Implemented change | Evidence |
|---|---|---|
| `429f7a7` | Pointer ROI selection aligned to the actual image, with cropped spatial evidence | `SpatialPanel.tsx`, spatial analysis and browser tests |
| `354c124` | Independent local palette, dominant local selection and all-region default | Local-palette unit and pointer/browser coverage |
| `a8fc658` | Separate multi-scale distribution mode for fragmented colors | `distribution.ts`, unit tests and neon browser workflow |
| `6218737` | Hue-safe clustering, emitted color consistency, constrained salient families, confidence-aware assignment, heatmap boundary correction and stale-state fixes | Color-engine audit and adversarial/night-city regressions |
| `50875a6` | Diverse sequential image corpus and deterministic jittered sampling to avoid periodic aliasing | `TEST_CORPUS.md`, corpus browser tests and fixture generators |
| `704d31e` | Dominant-component/hotspot position and generated Art scenes without pasted source images | Spatial and preview code, browser export/preview checks |
| `affb786` | Normalized significance and nearest-swatch OKLab discrimination, with expandable advanced evidence | Metric unit tests and documented definitions |
| `08ba0dd` | Opt-in 50-image timing/stability benchmark | Benchmark workflow, manifest and November 1 baseline report |
| `5103796` | 512-pixel sampling, eight-neighbor connectivity and 0.65 px feathering | Continuity/cross-color tests and precision trade-off report |
| `a2b34ca` | Comprehensive layered acceptance plan and additional reliability/layout/export tests | `TEST_PLAN.md` and November 1 comprehensive report |

## Fresh verification on November 2

- ESLint: passed.
- Unit tests: 72 passed in 14 files.
- Test-environment safety: passed; real configuration restoration and removal of marked mock configuration are covered.
- TypeScript and production build: passed.
- Chromium: 26 tests passed, comprising 25 regular workflows and the opt-in benchmark.
- Benchmark: 50/50 images passed, zero failed; measured test-loop total 38.449 seconds on this run. This run is not a controlled performance comparison with the historical timings.
- The corpus still contains only two owner-provided images and 48 synthetic fixtures. Passing this run does not establish broad real-image generalization.

The project CLI tools were invoked directly with bundled Node.js because npm was not on PATH. A temporary, external test-only command adapter forwarded the Playwright web-server command to the existing Vite CLI; no adapter is committed. An attempted alternate-package-manager run was stopped after it moved existing direct dependencies; all 30 moved packages were restored before verification. The original package manifest and lockfile were preserved.

## Dependency audit boundary

A fresh query to npm's official bulk-advisory endpoint for 463 distinct packages in the lockfile returned one moderate advisory: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), minimatch globparts amplification. It affects the development-only minimatch 3.1.5 and 9.0.9 entries used by ESLint/TypeScript lint tooling. No production dependency is identified by that response.

The advisory marks versions below 11.0.1 as affected. The current 3.x and 9.x lines have no compatible fixed patch according to the registry records checked. A global override to 11.x would change the API expected by the existing lint tools, so dependency upgrades and audit thresholds are not changed in this synchronization. The existing CI runs unqualified `npm audit` and may fail on this development-tool advisory even though application tests pass. A compatible tooling upgrade remains a separate follow-up.

## Work that remains open

- More independent real imagery and held-out evaluation; the discussed 1000-image plan has not been executed.
- Firefox/WebKit and real-device acceptance.
- Verification of the newly deployed revision and live external services.
- Real Unsplash access and attributed-search acceptance.
- Clickable distribution hotspots leading to local analysis, interactive semantic masks and further edge-quality improvements.
- Precision/performance trade-offs: higher sampling resolution is implemented, but the historical run measured a cost increase, and the attempted cache reuse did not demonstrate a speed improvement.

Deterministic multi-image comparison and unification are already implemented. Earlier README/status text listing them as future work has been corrected.
