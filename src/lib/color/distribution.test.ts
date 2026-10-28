import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import { analyzePaletteDistribution } from './distribution'
import type { PaletteSwatch, RGBPixel } from './extract'

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
const dark = swatch('#101018')
const darkPixel: RGBPixel = [16, 16, 24]
const redPixel: RGBPixel = [255, 0, 0]

describe('palette distribution evidence', () => {
  it('preserves isolated lights and finds their multi-scale hotspots', () => {
    const width = 20
    const height = 12
    const pixels = Array.from({ length: width * height }, () => darkPixel as RGBPixel | null)
    ;[[2, 2], [3, 2], [16, 8], [17, 8]].forEach(([x, y]) => { pixels[y * width + x] = redPixel })
    const result = analyzePaletteDistribution(pixels, width, height, [dark, red])[1]
    expect(result.centroid).not.toBeNull()
    expect(result.hotspotCount).toBeGreaterThan(0)
    expect(result.hotspotShare).toBeGreaterThan(0.2)
    expect(result.heat.peak).toBeGreaterThan(0)
  })

  it('weights a high-contrast cluster more than an equal-sized low-contrast cluster', () => {
    const width = 20
    const height = 10
    const pixels = Array.from({ length: width * height }, () => [80, 80, 80] as RGBPixel)
    for (let y = 3; y < 7; y += 1) {
      for (let x = 2; x < 5; x += 1) pixels[y * width + x] = [255, 0, 0]
      for (let x = 15; x < 18; x += 1) pixels[y * width + x] = [80, 0, 0]
    }
    const result = analyzePaletteDistribution(pixels, width, height, [dark, red])[1]
    expect(result.centroid?.x).toBeLessThan(0.5)
  })

  it('reports a uniform field without inventing a hotspot', () => {
    const pixels = Array.from({ length: 100 }, () => redPixel)
    const result = analyzePaletteDistribution(pixels, 10, 10, [red])[0]
    expect(result.hotspotCount).toBe(0)
    expect(result.centroid?.x).toBeCloseTo(0.5)
    expect(result.centroid?.y).toBeCloseTo(0.5)
  })

  it('does not amplify identical lights merely because they touch an edge or corner', () => {
    const peakAt = (index: number) => {
      const pixels = Array.from({ length: 1600 }, () => darkPixel as RGBPixel | null)
      pixels[index] = redPixel
      return analyzePaletteDistribution(pixels, 40, 40, [dark, red])[1].heat.peak
    }
    const center = peakAt(20 * 40 + 20)
    expect(peakAt(20 * 40)).toBeLessThanOrEqual(center)
    expect(peakAt(0)).toBeLessThanOrEqual(center)
  })

  it('excludes transparent pixels and validates dimensions', () => {
    const pixels = Array.from({ length: 20 }, () => null) as Array<RGBPixel | null>
    pixels[17] = redPixel
    const result = analyzePaletteDistribution(pixels, 5, 4, [red])[0]
    expect(result.centroid).not.toBeNull()
    expect(Number.isFinite(result.dispersion)).toBe(true)
    expect(() => analyzePaletteDistribution([redPixel], 2, 2, [red])).toThrow('dimensions')
  })
})
