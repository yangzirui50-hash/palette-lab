import { describe, expect, it } from 'vitest'
import { assignPaletteRoles, semanticFallbacks } from './assign'
import { extractPalette } from '../lib/color/extract'
import type { RGBPixel } from '../lib/color/extract'

const solid = (rgb: RGBPixel, count: number) => Array.from({ length: count }, () => rgb)
const palette = extractPalette([
  ...solid([10, 10, 10], 50),
  ...solid([223, 255, 79], 25),
  ...solid([74, 144, 226], 15),
  ...solid([240, 240, 240], 10),
], 4)

describe('assignPaletteRoles', () => {
  it('assigns dark backgrounds and light text for Web/UI', () => {
    const roles = assignPaletteRoles(palette, 'web-ui')
    expect(roles.background).toBe('#0a0a0a')
    expect(roles.textPrimary).toBe('#f0f0f0')
    expect(roles.accent).toBe('#dfff4f')
    expect(roles.focus).toBe(roles.accent)
    expect(roles.textMuted).not.toBe(roles.surface)
  })

  it('assigns visual roles independently for Art/Poster', () => {
    const roles = assignPaletteRoles(palette, 'art-poster')
    expect(roles.canvas).toBe('#0a0a0a')
    expect(roles.primaryVisual).toBe('#0a0a0a')
    expect(roles.secondaryVisual).toBe('#dfff4f')
    expect(roles.displayText).toBe('#f0f0f0')
  })

  it('returns an empty record for empty input', () => {
    expect(assignPaletteRoles([], 'web-ui')).toEqual({})
  })

  it('keeps single-color images and semantic states usable', () => {
    const singleColor = extractPalette(solid([10, 10, 10], 10), 2)
    const webRoles = assignPaletteRoles(singleColor, 'web-ui')
    expect(webRoles.background).toBe(semanticFallbacks.background)
    expect(webRoles.textPrimary).toBe(semanticFallbacks.textPrimary)
    expect(webRoles.success).toBe(semanticFallbacks.success)
    expect(webRoles.error).toBe(semanticFallbacks.error)

    const artRoles = assignPaletteRoles(singleColor, 'art-poster')
    expect(artRoles.canvas).toBe(semanticFallbacks.background)
    expect(artRoles.displayText).toBe(semanticFallbacks.textPrimary)
  })
})
