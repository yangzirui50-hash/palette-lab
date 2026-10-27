import { describe, expect, it } from 'vitest'
import { assignPaletteRoles } from './assign'
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
    expect(roles.background).toBe('#080808')
    expect(roles.textPrimary).toBe('#f0f0f0')
    expect(roles.accent).toBe('#e0ff50')
    expect(roles.focus).toBe(roles.accent)
  })

  it('assigns visual roles independently for Art/Poster', () => {
    const roles = assignPaletteRoles(palette, 'art-poster')
    expect(roles.canvas).toBe('#080808')
    expect(roles.primaryVisual).toBe('#080808')
    expect(roles.secondaryVisual).toBe('#e0ff50')
    expect(roles.displayText).toBe('#f0f0f0')
  })

  it('returns an empty record for empty input', () => {
    expect(assignPaletteRoles([], 'web-ui')).toEqual({})
  })
})
