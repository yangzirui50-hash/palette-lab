import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import { extractPalette } from './extract'
import type { RGBPixel } from './extract'

const solid = (rgb: RGBPixel, count: number) => Array.from({ length: count }, () => rgb)

describe('extractPalette', () => {
  it.each(([ [100, 150, 200], [1, 127, 254], [17, 19, 23] ] as RGBPixel[]).map(rgb => ({ rgb })))('preserves a uniform original RGB value $rgb exactly', ({ rgb }) => {
    const palette = extractPalette(solid(rgb, 300), 6)
    expect(palette).toHaveLength(1)
    expect(palette[0].rgb).toEqual(rgb)
    expect(palette[0].hex).toBe(`#${rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`)
  })

  it('does not merge distinct low-color source values just because they share a histogram bin', () => {
    const palette = extractPalette([...solid([100, 150, 200], 75), ...solid([101, 151, 201], 25)], 2)
    expect(palette.map(color => color.hex)).toEqual(['#6496c8', '#6597c9'])
    expect(palette.map(color => color.share)).toEqual([0.75, 0.25])
  })

  it('computes clustered means from source values instead of quantized bin labels', () => {
    const pixels: RGBPixel[] = []
    for (let offset = -2; offset <= 2; offset++) {
      pixels.push(...solid([100 + offset, 100 + offset, 100 + offset], 10))
      pixels.push(...solid([200 + offset, 200 + offset, 200 + offset], 10))
    }
    expect(extractPalette(pixels, 2).map(color => color.hex).sort()).toEqual(['#646464', '#c8c8c8'])
  })

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

  it('keeps wraparound hue families and emitted RGB/OKLCH values consistent', () => {
    const pixels: RGBPixel[] = []
    for (let index = 0; index < 24; index += 1) {
      const lightness = 0.42 + (index % 6) * 0.045
      const hue = index < 12 ? 344 + index : index - 12
      for (const offset of [0, 5]) {
        const rgb = new Color('oklch', [lightness, 0.16, (hue + offset) % 360]).to('srgb').coords
          .map((channel) => Math.max(0, Math.min(255, Math.round((channel ?? 0) * 255)))) as unknown as RGBPixel
        pixels.push(...solid(rgb, 5))
      }
      pixels.push(...solid([16 + index * 3, 18 + index * 2, 24 + index * 2], 5))
    }
    const palette = extractPalette(pixels, 3)
    palette.forEach((swatch) => {
      const actual = new Color('srgb', [swatch.rgb[0] / 255, swatch.rgb[1] / 255, swatch.rgb[2] / 255]).to('oklch').coords
      actual.forEach((value, index) => expect(value ?? 0).toBeCloseTo(swatch.oklch[index], 6))
    })
    const chromatic = palette.filter((swatch) => swatch.oklch[1] > 0.08)
    expect(chromatic.length).toBeGreaterThan(0)
    chromatic.forEach((swatch) => expect(Math.min(swatch.oklch[2], 360 - swatch.oklch[2])).toBeLessThan(75))
  })

  it('preserves multiple small chromatic families through the full clustering process', () => {
    const pixels: RGBPixel[] = []
    for (let index = 0; index < 10; index += 1) {
      pixels.push(...solid([20 + index * 6, 24 + index * 5, 32 + index * 4], 60))
      pixels.push(...solid([210 + index * 4, 12 + index * 2, 35 + index * 3], 10))
      pixels.push(...solid([12 + index * 2, 190 + index * 5, 210 + index * 4], 10))
      pixels.push(...solid([220 + index * 3, 185 + index * 5, 25 + index * 2], 10))
    }
    const palette = extractPalette(pixels, 6)
    expect(palette.some((color) => color.rgb[0] > color.rgb[1] * 1.8 && color.rgb[0] > color.rgb[2] * 1.5)).toBe(true)
    expect(palette.some((color) => color.rgb[1] > color.rgb[0] * 1.8 && color.rgb[2] > color.rgb[0] * 1.8)).toBe(true)
    expect(palette.some((color) => color.rgb[0] > color.rgb[2] * 1.8 && color.rgb[1] > color.rgb[2] * 1.8)).toBe(true)
  })

  it('avoids losing an entire color family to periodic sampling aliases', () => {
    const pixels = Array.from({ length: 16000 }, (_, index): RGBPixel => index % 2 === 0 ? [215, 30, 55] : [25, 75, 215])
    const palette = extractPalette(pixels, 2)
    expect(palette).toHaveLength(2)
    expect(palette.some((color) => color.rgb[0] > color.rgb[2] * 2)).toBe(true)
    expect(palette.some((color) => color.rgb[2] > color.rgb[0] * 2)).toBe(true)
    expect(palette[0].share).toBeCloseTo(0.5, 1)
    expect(palette[1].share).toBeCloseTo(0.5, 1)
  })

  it('rejects empty input and invalid color counts', () => {
    expect(() => extractPalette([], 4)).toThrow('At least one pixel')
    expect(() => extractPalette(solid([0, 0, 0], 1), 1)).toThrow('between 2 and 8')
    expect(() => extractPalette(solid([0, 0, 0], 1), 9)).toThrow('between 2 and 8')
  })
})
