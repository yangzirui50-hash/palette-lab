import { describe, expect, it } from 'vitest'
import { extractPalette } from './extract'
import type { RGBPixel } from './extract'

const solid = (rgb: RGBPixel, count: number) => Array.from({ length: count }, () => rgb)

describe('extractPalette', () => {
  it('returns the dominant color and its approximate share', () => {
    const pixels = [...solid([0, 0, 0], 75), ...solid([255, 255, 255], 25)]
    const palette = extractPalette(pixels, 2)
    expect(palette).toHaveLength(2)
    expect(palette[0].hex).toBe('#000000')
    expect(palette[0].share).toBeCloseTo(0.75, 2)
    expect(palette[1].hex).toBe('#ffffff')
  })

  it('keeps a single-color image useful when more colors are requested', () => {
    const palette = extractPalette(solid([255, 0, 0], 100), 6)
    expect(palette).toHaveLength(1)
    expect(palette[0].hex).toBe('#ff0000')
    expect(palette[0].share).toBe(1)
  })

  it('is deterministic for the same pixels', () => {
    const pixels = [
      ...solid([10, 20, 30], 30),
      ...solid([200, 80, 30], 20),
      ...solid([200, 200, 200], 10),
    ]
    expect(extractPalette(pixels, 3)).toEqual(extractPalette(pixels, 3))
  })

  it('keeps shares normalized and returns OKLCH coordinates', () => {
    const pixels = [
      ...solid([0, 0, 0], 40),
      ...solid([255, 0, 0], 30),
      ...solid([0, 255, 0], 20),
      ...solid([0, 0, 255], 10),
    ]
    const palette = extractPalette(pixels, 4)
    expect(palette.reduce((sum, color) => sum + color.share, 0)).toBeCloseTo(1, 8)
    palette.forEach((color) => expect(color.oklch).toHaveLength(3))
  })

  it('preserves a small but visually salient red subject among dominant neutrals', () => {
    const redSubject = Array.from({ length: 10 }, (_, index) => [190 + index * 4, 12 + index * 2, 35 + index * 2] as RGBPixel)
    const pixels = [
      ...solid([82, 76, 77], 800),
      ...solid([201, 186, 166], 94),
      ...solid([56, 36, 55], 54),
      ...solid([79, 87, 87], 32),
      ...solid([77, 85, 77], 16),
      ...solid([65, 65, 73], 4),
      ...redSubject,
    ]
    const palette = extractPalette(pixels, 6)
    const salientRed = palette.find((color) => color.oklch[1] > 0.12 && color.rgb[0] > color.rgb[1] * 2)
    expect(salientRed).toBeDefined()
    expect(salientRed?.share).toBeGreaterThan(0.005)
  })

  it('rejects empty input and invalid color counts', () => {
    expect(() => extractPalette([], 4)).toThrow('At least one pixel')
    expect(() => extractPalette(solid([0, 0, 0], 1), 1)).toThrow('between 2 and 8')
    expect(() => extractPalette(solid([0, 0, 0], 1), 9)).toThrow('between 2 and 8')
  })
})
