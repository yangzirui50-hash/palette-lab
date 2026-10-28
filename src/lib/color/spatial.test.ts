import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import { extractPalette } from './extract'
import type { PaletteSwatch, RGBPixel } from './extract'
import { analyzePaletteSpatial, analyzePaletteSpatialDetailed, buildSpatialAssignments, cropSpatialPixels } from './spatial'

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

  it('limits analysis to a normalized region of interest', () => {
    const pixels = [redPixel, redPixel, redPixel, redPixel]
    const crop = cropSpatialPixels(pixels, 2, 2, { x: 0, y: 0, width: 0.5, height: 1 })
    expect(crop.pixels).toEqual([redPixel, redPixel])
    expect(crop.width).toBe(1)
    expect(crop.height).toBe(2)
    const regions = analyzePaletteSpatial(crop.pixels, crop.width, crop.height, [red, gray])
    expect(regions[0].share).toBe(1)
    expect(regions[1].pixelCount).toBe(0)
  })

  it('extracts an independent local palette without changing the global palette', () => {
    const pixels = [redPixel, grayPixel, redPixel, grayPixel]
    const globalPalette = extractPalette(pixels.filter((pixel) => pixel !== null), 2)
    const crop = cropSpatialPixels(pixels, 2, 2, { x: 0, y: 0, width: 0.5, height: 1 })
    const localPalette = extractPalette(crop.pixels.filter((pixel) => pixel !== null), 2)
    expect(globalPalette).toHaveLength(2)
    expect(localPalette).toHaveLength(1)
    expect(localPalette[0].hex).toBe('#ff0000')
    expect(localPalette[0].share).toBe(1)
    expect(globalPalette.map((color) => color.hex)).toEqual(['#ff0000', '#808080'])
  })

  it('rejects chromatic conflicts instead of forcing dark red into a blue-gray region', () => {
    const darkRed: RGBPixel = [92, 25, 33]
    const blueGray = swatch('#343543')
    const result = buildSpatialAssignments([darkRed], 1, 1, [blueGray, gray])
    expect(result.assignments[0]).toBe(65535)
    expect(result.confidence[0]).toBe(0)
    const detailed = analyzePaletteSpatialDetailed([darkRed], 1, 1, [blueGray, gray])
    expect(detailed.unassignedShare).toBe(1)
    expect(detailed.regions.every((region) => region.pixelCount === 0)).toBe(true)
    expect(buildSpatialAssignments([redPixel], 1, 1, [red, gray]).assignments[0]).toBe(0)
  })

  it('reassigns low-chroma reds to a compatible red family instead of deep blue', () => {
    const mutedRed: RGBPixel = [52, 33, 43]
    const deepBlue = swatch('#191f2e')
    const darkRed = swatch('#713033')
    const result = buildSpatialAssignments([mutedRed], 1, 1, [deepBlue, darkRed, gray])
    expect(result.assignments[0]).toBe(1)
    expect(result.confidence[0]).toBeGreaterThan(0)
  })

  it('returns empty evidence for absent colors and validates dimensions', () => {
    const regions = analyzePaletteSpatial([grayPixel], 1, 1, [red, gray])
    expect(regions[0].pixelCount).toBe(0)
    expect(regions[0].largestComponentShare).toBe(0)
    expect(regions[1].pixelCount).toBe(1)
    expect(() => analyzePaletteSpatial([grayPixel], 2, 1, [gray])).toThrow('dimensions')
  })
})
