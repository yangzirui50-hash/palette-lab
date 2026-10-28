import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import { analyzePaletteDiscrimination } from './metrics'
import type { PaletteSwatch } from './extract'

function swatch(hex: string): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as PaletteSwatch['rgb'],
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as PaletteSwatch['oklch'],
    share: 0,
  }
}

describe('palette discrimination', () => {
  it('returns the nearest swatch and a symmetric OKLab distance', () => {
    const red = swatch('#ff0000')
    const blue = swatch('#0000ff')
    const [redResult, blueResult] = analyzePaletteDiscrimination([red, blue])
    expect(redResult.nearestHex).toBe(blue.hex)
    expect(blueResult.nearestHex).toBe(red.hex)
    expect(redResult.distance).toBeGreaterThan(0)
    expect(redResult.distance).toBeCloseTo(blueResult.distance ?? 0, 10)
  })

  it('chooses the closest neutral and handles a single-color palette', () => {
    const black = swatch('#000000')
    const white = swatch('#ffffff')
    const gray = swatch('#808080')
    expect(analyzePaletteDiscrimination([black, white, gray])[0].nearestHex).toBe(gray.hex)
    expect(analyzePaletteDiscrimination([black])[0]).toEqual({ distance: null, nearestHex: null })
  })
})
