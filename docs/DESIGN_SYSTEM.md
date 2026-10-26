# Palette Lab — Theme and Domain Design System

## Principles

Theme and domain are independent axes. Layout, workflow, records and interaction state are shared. Visual changes must not reset the current image, palette or editing context.

## Axes

- `data-theme="light | dark"`: controls application surfaces, text, borders and elevation.
- `data-domain="web-ui | art-poster"`: controls domain accents, display typography, previews and decorative details.

## Token layers

### Foundation

Shared spacing, control sizes, focus behavior, semantic status, responsive layout and interaction rules.

### Theme tokens

- `--bg`, `--panel`, `--soft`, `--image-bg`
- `--text`, `--muted`, `--line`, `--dashed`
- `--swatch`, `--swatch-hover`, `--control`
- `--accent`, `--accent-fill`, `--accent-ink`

`--accent` is for text and fine details. `--accent-fill` is for filled controls. `--accent-ink` is text on filled controls. Light and dark themes may use different values to preserve contrast.

### Current accent direction

Web Light uses muted indigo (`#4653B8` text, `#5364D8` filled controls) instead of fluorescent yellow-green. Web Dark uses soft periwinkle (`#A5B4FC` text, `#6574E8` fills). Art Light uses restrained vermilion (`#9B3D30` text, `#B55442` fills); Art Dark uses `#D88B77` and `#B96450`. Accent colors belong to application chrome and never modify extracted palette values.

### Domain direction

#### Web / UI

Neutral workbench, precise grid, restrained radius, readable control labels and implementation-focused previews. Light uses modern off-white; dark uses neutral charcoal.

#### Art / Poster

Warm paper, sumi ink, vermilion and indigo references, editorial display type and asymmetric visual composition. Japanese print-inspired decoration belongs in headers, empty states and previews, never behind form controls or color values.

## Invariants

- Import, editing, copy, undo and export keep their positions and behavior.
- Domain switching never clears source images or palettes.
- Theme switching never changes extracted color values.
- All four theme/domain combinations must pass responsive checks.
- Text, focus, error and disabled states remain usable independent of decoration.
- User-image colors are content, not application theme tokens.

## Verification

Test all four combinations with the same fixture. Verify persistence after reload, six-digit palette stability, accessible focus, and no horizontal overflow at 390px.
