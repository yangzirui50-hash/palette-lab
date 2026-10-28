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

Clicking a swatch dims other regions while preserving the selected color in the original thumbnail. The default view shows all approximate-color regions so disconnected areas with the same color are not hidden; users can switch to only the largest connected region. Feathered masks soften boundaries. The interface explicitly states that these are approximate color regions, not semantic object segmentation, so similar colors on skin, books or other objects are not claimed to be one object. Highlighting is generated locally and requires no AI call or image upload.

## Region of interest

“框选分析区域” lets the owner limit metrics and highlighting to a rectangle, excluding similarly colored objects outside it. Pointer coordinates are measured against the rendered image itself rather than its letterboxed container. Normalized ROI coordinates are clamped to the sampled pixel grid, cropped for analysis and mapped back to full-image coordinates for overlay rendering.

ROI uses the same deterministic extraction engine to create an independent local palette from opaque pixels inside the selection. The whole-image palette remains unchanged. Local shares and positions describe only the selection, and the dominant local color is selected by default rather than a more chromatic incidental accent. Clearing the selection restores the global palette and full-image evidence. Cropped evidence is not sent to AI as though it described the full image. ROI remains a manual color-analysis aid, not semantic clothing, skin or object segmentation.

## Distribution evidence

“散点分布” is a separate visualization for neon scenes, stars, textures and other fragmented color fields. It preserves isolated lights instead of applying region-noise cleanup. A bounded analysis grid combines three Gaussian density scales with local luminance contrast and palette chroma, then reports a weighted salient centroid, dispersion, significant hotspot count and hotspot-energy shares. Hotspot circles identify concentrations rather than object boundaries.

Distribution heatmaps use the same global/local palettes and ROI coordinates as region mode. Uniform fields do not receive fabricated hotspots. These measurements describe visual evidence, not human attention guarantees, semantic recognition or aesthetic quality. Distribution evidence is currently local-only and is not added to the AI request contract.

## AI request contract

`analysisRequestSchema` accepts an optional `spatial` array with the same validated evidence. DeepSeek receives the image, palette, role assignments and full-image spatial evidence together. The prompt distinguishes edge-connected backgrounds, central subjects and small salient accents without treating area as the only measure of importance.

Spatial data remains deterministic. AI may interpret it but may not alter measured colors, shares or regions. No spatial metadata is required for backwards compatibility.

## Verification

- Center-focus, edge-background, disconnected-region, missing-color, transparent-pixel, ROI-cropping and independent-local-palette unit tests
- Distribution tests preserve isolated lights, prefer a high-contrast cluster, avoid uniform-field hotspots and exclude transparency
- Real browser all-region display, pointer ROI selection, local-dominant selection, cropped-share verification and unchanged global-palette checks
- Neon browser workflow verifies heatmap rendering, nonzero hotspots, distribution metrics, region switching and 390 px layout; local ROI also works in distribution mode
- Provider prompt test confirms `largestComponentShare` is transmitted
- Real DeepSeek request with left-base, central-accent and right-support evidence returned HTTP 200 and an accurate composition summary
- Isolated-noise removal and connected-detail preservation tests
- Reviewed the owner's person image: all-region mode highlights both face and arms; a face ROI produces an independent palette and selects its dominant light color
- 61 unit tests and 16 real-browser workflows pass, along with ESLint and production build
