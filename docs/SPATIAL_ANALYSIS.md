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

Transparent pixels are excluded from shares and components. Edge calculations use normalized coordinates and work for small images. Two neighborhood passes clean only isolated components of at most two pixels, preserving connected subject regions and meaningful small details. Overlay and metrics share the same denoised assignments. There is no universal aesthetic score.

## Spatial share versus palette share

Palette share comes from weighted clustering. Spatial share is recomputed by nearest-color assignment on the thumbnail and may differ slightly because of resampling and the different calculation path. The interface explains this rather than forcing the numbers to match.

## Region highlighting

Clicking a swatch dims other regions while preserving the selected color in the original thumbnail. The default view shows only the largest connected approximate-color region; users can switch to all approximate-color regions. Feathered masks soften boundaries. The interface explicitly states that these are approximate color regions, not semantic object segmentation, so similar colors on skin, books or other objects are not claimed to be one object. Highlighting is generated locally and requires no AI call or image upload.

## Region of interest

“框选分析区域” lets the owner limit both metrics and highlighting to a rectangle, excluding similarly colored objects outside it. Pointer coordinates are measured against the rendered image itself rather than its letterboxed container. Normalized ROI coordinates are clamped to the sampled pixel grid, cropped for analysis and mapped back to full-image coordinates for overlay rendering.

ROI shares and positions describe the selection, while the palette and its swatch shares remain whole-image values. Clearing the selection restores full-image evidence. Cropped evidence is not sent to AI as though it described the full image. ROI remains a manual color-analysis aid, not semantic clothing, skin or object segmentation.

## AI request contract

`analysisRequestSchema` accepts an optional `spatial` array with the same validated evidence. DeepSeek receives the image, palette, role assignments and full-image spatial evidence together. The prompt distinguishes edge-connected backgrounds, central subjects and small salient accents without treating area as the only measure of importance.

Spatial data remains deterministic. AI may interpret it but may not alter measured colors, shares or regions. No spatial metadata is required for backwards compatibility.

## Verification

- Center-focus, edge-background, disconnected-region, missing-color, transparent-pixel and ROI-cropping unit tests
- Real browser blue-region highlighting, pointer ROI selection, cropped-share verification and no layout regression
- Provider prompt test confirms `largestComponentShare` is transmitted
- Real DeepSeek request with left-base, central-accent and right-support evidence returned HTTP 200 and an accurate composition summary
- Isolated-noise removal and connected-detail preservation tests
- Reviewed a cropped capture of the owner's shirt/skin case: the selection stays aligned and excludes the legs from shirt highlighting
- 56 unit tests and 15 real-browser workflows pass, along with ESLint and production build
