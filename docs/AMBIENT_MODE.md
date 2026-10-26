# Ambient Background Mode — Future Module

## Purpose

Let users personalize the workspace with an image-derived atmosphere while preserving the standard theme, readable controls and palette-editing accuracy.

## Modes

- **Standard:** current theme tokens remain unchanged.
- **Ambient:** load a bundled default image or a user-selected local image, derive constrained ambient tokens and preserve the current project state.

Persist enablement, image identifier, intensity and accent preference. Do not require a reload.

## Rendering layers

1. Enlarged and blurred source image with medium saturation.
2. Neutral scrim appropriate to Light/Dark mode.
3. Independent workspace surfaces, text, borders and controls.

The image must never be the sole contrast mechanism. Busy and simple image fixtures require separate checks. A reduced-transparency option falls back to Standard surfaces.

## Ambient token generation

Use the deterministic palette engine to produce candidates, then filter by luminance, contrast and chroma. Select one principal ambient color rather than assigning unrelated colors to individual containers.

- Surfaces remain approximately 85%–95% neutral.
- Borders receive restrained tint only.
- Buttons, focus and current states require explicit text/on-fill contrast checks.
- Fall back to standard tokens when no candidate passes.
- Cache generated tokens by image, theme, domain and settings.

## User controls

- Standard / Ambient toggle
- Use default image / use current image / choose local image
- Intensity within bounded presets
- Accent mode: Auto / Standard / Custom
- Reset to Standard

Auto is a constrained recommendation, not an objective aesthetic score. Users can override it.

## Suggested record

```ts
type AmbientSettings = {
  enabled: boolean
  imageId: 'default' | 'current' | string
  intensity: 'subtle' | 'balanced' | 'rich'
  accentMode: 'auto' | 'standard' | 'custom'
  customAccent?: string
}
```

## Acceptance criteria

- Standard mode is visually unchanged.
- Switching modes preserves source, palette and edits.
- Text and controls remain readable on every fixture.
- No uncontrolled per-container rainbow tinting.
- Fallback works for invalid images and low-contrast palettes.
- Theme/domain switching and reduced-transparency behavior are documented and tested.
