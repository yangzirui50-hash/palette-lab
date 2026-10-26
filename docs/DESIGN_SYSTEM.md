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

All dark combinations use the owner's unified neutral charcoal and yellow-green system (`#DFFF4F` with dark text on fills). Web Light uses a separate porcelain, ink and deep teal direction (`#155E54` text, `#176F62` fills). Art Light uses warm paper, ink and restrained vermilion (`#9B3D30` text, `#B84E38` fills). Accent colors belong to application chrome and never modify extracted palette values.

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
