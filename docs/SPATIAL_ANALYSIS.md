# Spatial Color Evidence and Analysis

_Status: Implemented and verified on 2026-10-28._

## Purpose

Spatial analysis answers where a color appears and whether it is concentrated, central or edge-connected. It complements palette extraction instead of treating area or chroma as visual importance by itself.

## Local evidence

`src/lib/color/spatial.ts` assigns sampled pixels to the nearest palette color in true OKLab space and reports:

- Pixel count and opaque-pixel share
- Normalized centroid and bounding box
- Central-region and edge-region shares
- Largest connected-component share
- Significant connected-component count
- Mean distance to the next-nearest palette color

Transparent pixels are excluded from shares and components. Edge calculations use normalized coordinates and work for small images. There is no universal aesthetic score.

## Spatial share versus palette share

Palette share comes from weighted clustering. Spatial share is recomputed by nearest-color assignment on the thumbnail and may differ slightly because of resampling and the different calculation path. The interface explains this rather than forcing the numbers to match.

## Region highlighting

Clicking a swatch dims other regions while preserving the selected color in the original thumbnail. Highlighting is generated locally and requires no AI call or image upload.

## AI request contract

`analysisRequestSchema` accepts an optional `spatial` array with the same validated evidence. DeepSeek receives the image, palette, role assignments and spatial evidence together. The prompt distinguishes edge-connected backgrounds, central subjects and small salient accents without treating area as the only measure of importance.

Spatial data remains deterministic. AI may interpret it but may not alter measured colors, shares or regions. No spatial metadata is required for backwards compatibility.

## Verification

- Center-focus, edge-background, disconnected-region, missing-color and transparent-pixel unit tests
- Real browser blue-region highlighting with spatial evidence and no layout regression
- Provider prompt test confirms `largestComponentShare` is transmitted
- Real DeepSeek request with left-base, central-accent and right-support evidence returned HTTP 200 and an accurate composition summary
- 54 unit tests and 15 real-browser workflows pass, along with ESLint, production build and 0-vulnerability audit
