import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import type { PaletteSwatch, RGBPixel } from './extract'
import { analyzePaletteSpatial } from './spatial'

function swatch(hex: string): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as PaletteSwatch['rgb'],
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as PaletteSwatch['oklch'],
    share: 0,
  }
}

const red = swatch('#ff0000')
const gray = swatch('#808080')
const redPixel: RGBPixel = [255, 0, 0]
const grayPixel: RGBPixel = [128, 128, 128]

describe('spatial palette evidence', () => {
  it('measures center focus, edge background and connected regions', () => {
    const pixels = Array.from({ length: 16 }, (_, index) => [5, 6, 9, 10].includes(index) ? redPixel : grayPixel)
    const regions = analyzePaletteSpatial(pixels, 4, 4, [gray, red])
    expect(regions[0]).toMatchObject({ pixelCount: 12, share: 0.75, centerShare: 0, edgeShare: 1, largestComponentShare: 1 })
    expect(regions[1]).toMatchObject({ pixelCount: 4, share: 0.25, centerShare: 1, edgeShare: 0, largestComponentShare: 1, componentCount: 1 })
    expect(regions[1].centroid).toEqual({ x: 0.5, y: 0.5 })
    expect(regions[1].bounds).toEqual({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 })
    expect(regions[1].meanColorSeparation).toBeGreaterThan(0)
  })

  it('separates meaningful disconnected areas instead of merging them', () => {
    const pixels = Array.from({ length: 28 }, (_, index) => [0, 1, 4, 5, 7, 8, 11, 12].includes(index) ? redPixel : grayPixel)
    const regions = analyzePaletteSpatial(pixels, 7, 4, [red, gray])
    expect(regions[0].componentCount).toBe(2)
    expect(regions[0].largestComponentShare).toBe(0.5)
  })

  it('removes isolated salt-and-pepper assignments without erasing real regions', () => {
    const pixels = Array.from({ length: 16 }, () => grayPixel)
    pixels[5] = redPixel
    const regions = analyzePaletteSpatial(pixels, 4, 4, [gray, red])
    expect(regions[0].pixelCount).toBe(16)
    expect(regions[1].pixelCount).toBe(0)
  })

  it('excludes transparent pixels from shares and connected regions', () => {
    const regions = analyzePaletteSpatial([grayPixel, null, redPixel, null], 2, 2, [gray, red])
    expect(regions[0].share).toBe(0.5)
    expect(regions[1].share).toBe(0.5)
    expect(regions[0].pixelCount).toBe(1)
    expect(regions[1].pixelCount).toBe(1)
  })

  it('returns empty evidence for absent colors and validates dimensions', () => {
    const regions = analyzePaletteSpatial([grayPixel], 1, 1, [red, gray])
    expect(regions[0].pixelCount).toBe(0)
    expect(regions[0].largestComponentShare).toBe(0)
    expect(regions[1].pixelCount).toBe(1)
    expect(() => analyzePaletteSpatial([grayPixel], 2, 1, [gray])).toThrow('dimensions')
  })
})
