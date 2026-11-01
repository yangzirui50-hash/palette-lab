# Comprehensive Test Report — 2026-11-01

## Executive result

The P0/P1 local acceptance plan passed: 72 unit tests and 25 regular browser workflows, with zero failures. The opt-in 50-image benchmark also passed 50/50. Production deployment, Firefox/WebKit and broader independent real-world generalization remain unverified and are not included in this pass statement.

## Coverage and results

| Area | Result |
|---|---|
| Palette, hue families, assignment and metrics | Pass |
| Cross-color night-city regression | Pass; zero red-like pixels in deep blue |
| ROI, independent local palettes and source reset | Pass |
| Diagonal continuity and dominant location | Pass |
| Single/series workflows and role preservation | Pass |
| Generative Web/Art previews | Pass; no source image pasted |
| CSS, JSON and real Web/Art PNG exports | Pass; Art export visually reviewed |
| Empty, oversized and unsupported input recovery | Pass |
| Repeated source/domain/mode changes | Pass |
| Keyboard details and accessible control names | Pass |
| 320, 390, 768 and desktop layouts | Pass without horizontal overflow |
| Resolution variants and repeated-import determinism | Pass; major red/blue families preserved |
| Production dependency audit | 0 vulnerabilities |
| Sensitive-file inspection | Only public `.dev.vars.example`; no real secret found |

## Performance

The 512 px 50-image benchmark passed 50/50 in 73.290 seconds. Mean per image was 1.463 seconds and p95 was 2.373 seconds. This is slower than the 320 px baseline and is documented as a precision/performance trade-off, not a universal performance guarantee.

## Environment boundaries

- Chromium launched and completed the regular browser workflows.
- Firefox was not run because its Playwright executable is not installed.
- WebKit was not run because its Playwright executable is not installed.
- Production deployment was not revalidated in this phase.
- Unsplash and real external-provider acceptance remain separate from mock tests.

## Generalization limits

The timed set contains two owner-provided real images and 48 synthetic images. It proves timing and covered-contract stability, not universal quality across real photography. A larger independent real-image corpus and held-out evaluation remain necessary before making broad generalization claims.

## Next acceptance stages

1. Expand independent real imagery and category-specific failure analysis.
2. Install and verify Firefox/WebKit or test on real devices.
3. Revalidate the deployed revision and production API when network access is stable.
4. Complete Unsplash approval and real attributed-search acceptance.
5. Continue actionable-hotspot and resolution/performance optimization without weakening cross-color assertions.
