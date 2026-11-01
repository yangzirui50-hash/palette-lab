# 50-image Browser Benchmark — 2026-11-01

## Result

- **50/50 passed; 0 failed**
- Total sequential dual-mode time: **56.711 s**
- Mean per image: **1.030 s**
- Median per image: **1.091 s**
- 95th percentile: **1.389 s**
- Range: **203–1597 ms**
- Real owner images: 2; deterministic synthetic images: 48.
- No DeepSeek, external AI API or image download was used.

## Category timing

| Category | Images | Mean (s) | Max (s) |
|---|---:|---:|---:|
| aspect | 5 | 0.993 | 1.373 |
| geometric | 6 | 1.031 | 1.369 |
| gradient | 7 | 1.076 | 1.376 |
| landscape | 1 | 1.242 | 1.242 |
| low-contrast | 5 | 1.050 | 1.345 |
| monochrome | 1 | 1.113 | 1.113 |
| neon | 1 | 1.279 | 1.279 |
| noise | 6 | 1.126 | 1.597 |
| periodic | 6 | 0.976 | 1.318 |
| poster | 1 | 1.400 | 1.400 |
| product | 1 | 1.249 | 1.249 |
| real-night | 1 | 1.272 | 1.272 |
| real-person | 1 | 1.446 | 1.446 |
| tiny | 1 | 0.203 | 0.203 |
| transparent | 6 | 0.742 | 0.933 |
| ui | 1 | 1.275 | 1.275 |

## Slowest fixtures

| Fixture | Category | Time (s) |
|---|---|---:|
| benchmark-13-noise.png | noise | 1.597 |
| person-test.png | real-person | 1.446 |
| poster-test.png | poster | 1.400 |
| benchmark-01-gradient.png | gradient | 1.376 |
| benchmark-37-aspect.png | aspect | 1.373 |

## Interpretation

All 50 images produced normalized palettes, finite significance evidence, both spatial visualizations and no stale ROI or runtime error. Dedicated cross-color and pixel-assignment assertions remain in the permanent regression suite.

This is a **timing and stability benchmark**, not a 50-real-image generalization claim. Only two owner-provided images are included; the other 48 images are synthetic. It does not replace a broader independent real-world corpus.

At the measured mean, 1000 similar dual-mode browser runs would take about **17.2 minutes**, excluding downloads, environment startup and failure review. This is an estimate for the current machine, not a guarantee for other hardware.
