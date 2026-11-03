import { describe, expect, it } from 'vitest'
import { analyzeAttention } from './attention'
import type { RGBPixel } from './extract'

const gray: RGBPixel = [90, 90, 90]
function scene(width: number, height: number, boxes: Array<{ x: number; y: number; w: number; h: number; rgb: RGBPixel }>, background: RGBPixel | null = gray) {
  return Array.from({ length: width * height }, (_, i) => {
    const x = (i % width + .5) / width, y = (Math.floor(i / width) + .5) / height
    return boxes.find(box => x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h)?.rgb ?? background
  })
}
const positions = [[0, 0], [.44, 0], [.88, 0], [0, .44], [.44, .44], [.88, .44], [0, .88], [.44, .88], [.88, .88]]
const colors: RGBPixel[] = [[250, 250, 250], [10, 10, 10], [255, 20, 20], [20, 170, 220]]

describe('palette-independent visual focus: known geometry', () => {
  it.each(positions.flatMap(([x, y]) => colors.map(rgb => ({ x, y, rgb }))))('locates $rgb target at ($x,$y) including edges and corners', ({ x, y, rgb }) => {
    const result = analyzeAttention(scene(64, 64, [{ x, y, w: .12, h: .12, rgb }]), 64, 64)
    expect(result.state).toBe('single')
    expect(Math.hypot(result.foci[0].x - (x + .06), result.foci[0].y - (y + .06))).toBeLessThan(.035)
  })

  it.each([[64, 64], [128, 128], [192, 96], [96, 192]])('retains two separate foci at resolution %s × %s', (w, h) => {
    const boxes = [{ x: .125, y: .375, w: .125, h: .25, rgb: [240, 240, 240] as RGBPixel }, { x: .75, y: .375, w: .125, h: .25, rgb: [240, 240, 240] as RGBPixel }]
    const result = analyzeAttention(scene(w, h, boxes), w, h)
    expect(result.state).toBe('multiple')
    expect(result.foci).toHaveLength(2)
    expect(result.foci.some(focus => focus.x < .3)).toBe(true)
    expect(result.foci.some(focus => focus.x > .7)).toBe(true)
    expect(result.foci.every(focus => Math.abs(focus.y - .5) < .035)).toBe(true)
    // The balanced centroid lies in the gap; it must never become a candidate.
    expect(result.centroid?.x).toBeCloseTo(.5, 2)
  })

  it.each([gray, [0, 0, 0] as RGBPixel, [255, 255, 255] as RGBPixel, null])('does not invent a center in uniform or transparent fields %s', background => {
    const result = analyzeAttention(scene(64, 48, [], background), 64, 48)
    expect(['uniform', 'empty']).toContain(result.state)
    expect(result.centroid).toBeNull()
    expect(result.foci).toHaveLength(0)
    expect(result.heat.peak).toBe(0)
  })

  it('does not turn small sensor or compression noise into a focus', () => {
    const pixels = Array.from({ length: 4096 }, (_, i): RGBPixel => [90 + i % 3, 90, 90])
    expect(analyzeAttention(pixels, 64, 64).state).toBe('uniform')
  })

  it('does not count transparent padding as black contrast', () => {
    const result = analyzeAttention(scene(64, 64, [{ x: .1, y: .2, w: .3, h: .3, rgb: gray }], null), 64, 64)
    expect(result.state).toBe('uniform')
  })

  it('calls repeated full-field texture distributed rather than choosing one tile', () => {
    const pixels = Array.from({ length: 4096 }, (_, i): RGBPixel => (Math.floor(i / 64 / 4) + Math.floor(i % 64 / 4)) % 2 ? [245, 245, 245] : [15, 15, 15])
    const result = analyzeAttention(pixels, 64, 64)
    expect(['uniform', 'distributed']).toContain(result.state)
    expect(result.foci).toHaveLength(0)
  })

  it('is mirror-equivariant and stable after doubling resolution', () => {
    const box = { x: .125, y: .25, w: .125, h: .125, rgb: [240, 240, 240] as RGBPixel }
    const first = analyzeAttention(scene(64, 64, [box]), 64, 64)
    const mirror = analyzeAttention(scene(64, 64, [{ ...box, x: 1 - box.x - box.w }]), 64, 64)
    const scaled = analyzeAttention(scene(128, 128, [box]), 128, 128)
    expect(first.foci[0].x + mirror.foci[0].x).toBeCloseTo(1, 8)
    expect(first.foci[0].y).toBeCloseTo(mirror.foci[0].y, 8)
    expect(Math.hypot(first.foci[0].x - scaled.foci[0].x, first.foci[0].y - scaled.foci[0].y)).toBeLessThan(.025)
    expect(first.contrast).toBeCloseTo(mirror.contrast, 8)
  })

  it('validates image dimensions', () => {
    expect(() => analyzeAttention([], 0, 0)).toThrow('dimensions')
    expect(() => analyzeAttention([gray], 2, 2)).toThrow('dimensions')
  })
})
