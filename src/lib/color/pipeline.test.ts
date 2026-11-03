import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import { buildSpatialAssignments } from './spatial'
import { extractPalette } from './extract'
import type { PaletteSwatch, RGBPixel } from './extract'

const swatch = (rgb: RGBPixel): PaletteSwatch => ({
  rgb, hex: `#${rgb.map(value => value.toString(16).padStart(2, '0')).join('')}`,
  oklch: new Color('srgb', [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]).to('oklch').coords.map(value => value ?? 0) as unknown as RGBPixel,
  share: 0,
})
const pairs: Array<[string, RGBPixel, RGBPixel]> = [
  ['red on blue', [255, 0, 0], [0, 0, 255]],
  ['green on magenta', [0, 255, 0], [255, 0, 255]],
  ['cyan on red', [0, 255, 255], [255, 0, 0]],
  ['yellow on blue', [255, 255, 0], [0, 0, 255]],
  ['orange on cyan', [255, 128, 0], [0, 255, 255]],
  ['magenta on green', [255, 0, 255], [0, 255, 0]],
  ['white on black', [255, 255, 255], [0, 0, 0]],
  ['black on white', [0, 0, 0], [255, 255, 255]],
  ['red on gray', [255, 0, 0], [128, 128, 128]],
  ['blue on white', [0, 0, 255], [255, 255, 255]],
]

describe('known-color development challenges', () => {
  it.each(pairs.flatMap(([name, accent, background]) => [1, 2].map(size => ({ name, accent, background, size }))))(
    'keeps $size exact $name pixels assigned to their own color through denoising', ({ accent, background, size }) => {
      const pixels = Array.from({ length: 81 }, () => background)
      for (let offset = 0; offset < size; offset += 1) pixels[40 + offset] = accent
      const result = buildSpatialAssignments(pixels, 9, 9, [swatch(background), swatch(accent)], true)
      for (let offset = 0; offset < size; offset += 1) expect(result.assignments[40 + offset]).toBe(1)
      expect(result.assignments[0]).toBe(0)
    },
  )

  it.each([3, 4, 6, 8])('keeps a broad light field when requesting %s colors alongside vivid accents', count => {
    const pixels: RGBPixel[] = []
    for (let index = 0; index < 600; index += 1) {
      const value = 180 + index % 70
      pixels.push([value, value, value])
    }
    for (let index = 0; index < 220; index += 1) pixels.push([8, 8, 8])
    for (let index = 0; index < 120; index += 1) pixels.push([220, 65, 25])
    for (let index = 0; index < 40; index += 1) pixels.push([130, 20, 50])
    for (let index = 0; index < 20; index += 1) pixels.push([70, 30, 150])
    const palette = extractPalette(pixels, count)
    expect(palette.some(color => color.oklch[0] > 0.7 && color.oklch[1] < 0.04)).toBe(true)
    expect(palette.reduce((total, color) => total + color.share, 0)).toBeCloseTo(1, 8)
  })
})
