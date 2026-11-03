import { describe, expect, it } from 'vitest'
import { selectAttentionRegions } from './attentionRegions'

function grid(width = 32, height = 32, background = 0) {
  const values = new Float64Array(width * height).fill(background), counts = new Float64Array(width * height).fill(1)
  const rect = (x: number, y: number, w: number, h: number, value: number) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) values[yy * width + xx] = value
  }
  const run = () => selectAttentionRegions({ width, height, values, peak: Math.max(...values) }, counts)
  return { values, counts, rect, run, width, height }
}

describe('focus region evidence', () => {
  it('joins interrupted strong strokes through measured weaker support', () => {
    const scene = grid(32, 32, .04)
    scene.rect(24, 5, 2, 20, .4)
    for (let y = 5; y < 25; y += 3) scene.rect(24, y, 2, 1, 1)
    const result = scene.run()
    expect(result.state).toBe('single')
    expect(result.foci[0].x).toBeGreaterThan(.7)
    expect(result.foci[0].bounds.height).toBeCloseTo(20 / 32)
    expect(result.diagnostics.strongSupportShare).toBeLessThan(result.diagnostics.grownSupportShare)
  })

  it('retains two independently strong targets even when a weak bridge connects them', () => {
    const scene = grid()
    scene.rect(3, 12, 5, 6, 1); scene.rect(24, 12, 5, 6, 1); scene.rect(8, 14, 16, 2, .4)
    const result = scene.run()
    expect(result.state).toBe('multiple'); expect(result.foci).toHaveLength(2)
    expect(result.foci.some(focus => focus.x < .3)).toBe(true)
    expect(result.foci.some(focus => focus.x > .7)).toBe(true)
  })

  it('does not bridge zero response or transparent gaps', () => {
    const scene = grid()
    scene.rect(3, 12, 5, 6, 1); scene.rect(24, 12, 5, 6, 1)
    expect(scene.run().foci).toHaveLength(2)
    scene.rect(8, 14, 16, 2, .4)
    for (let y = 0; y < 32; y++) scene.counts[y * 32 + 16] = 0
    expect(scene.run().foci).toHaveLength(2)
  })

  it('rejects unseeded weak islands instead of making additional targets', () => {
    const scene = grid(); scene.rect(4, 4, 4, 4, 1); scene.rect(22, 22, 4, 4, .4)
    const result = scene.run()
    expect(result.state).toBe('single'); expect(result.foci[0].x).toBeLessThan(.3)
    expect(result.diagnostics.componentCount).toBe(1)
  })

  it('distinguishes fragmented candidates from broad response', () => {
    const fragments = grid()
    for (let y = 2; y < 32; y += 5) for (let x = 2; x < 32; x += 5) fragments.rect(x, y, 1, 1, 1)
    expect(fragments.run()).toMatchObject({ state: 'uncertain', reason: 'fragmented-response', foci: [] })
    const broad = grid(); broad.rect(0, 0, 32, 20, 1)
    expect(broad.run()).toMatchObject({ state: 'distributed', reason: 'broad-response', foci: [] })
  })

  it('does not put a symmetric ring candidate in its unsupported empty center', () => {
    const scene = grid()
    scene.rect(8, 8, 16, 1, 1); scene.rect(8, 23, 16, 1, 1); scene.rect(8, 8, 1, 16, 1); scene.rect(23, 8, 1, 16, 1)
    expect(scene.run()).toMatchObject({ state: 'uncertain', reason: 'ambiguous-location', foci: [] })
  })

  it('projects an irregular region onto measured support and preserves horizontal mirrors', () => {
    const scene = grid(); scene.rect(6, 5, 3, 18, 1); scene.rect(6, 20, 16, 3, .8)
    const original = scene.run()
    expect(original.state).toBe('single')
    const focus = original.foci[0]
    expect(scene.values[Math.floor(focus.y * 32) * 32 + Math.floor(focus.x * 32)]).toBeGreaterThan(0)
    const mirrored = grid()
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) mirrored.values[y * 32 + 31 - x] = scene.values[y * 32 + x]
    expect(mirrored.run().foci[0].x + focus.x).toBeCloseTo(1, 10)
    expect(mirrored.run().foci[0].y).toBeCloseTo(focus.y, 10)
  })

  it('normalizes support and energy over opaque pixels with unequal cell populations', () => {
    const scene = grid(); scene.rect(3, 12, 3, 3, 1); scene.rect(24, 12, 3, 3, 1)
    for (let y = 12; y < 15; y++) for (let x = 24; x < 27; x++) scene.counts[y * 32 + x] = 2
    const result = scene.run()
    expect(result.foci.map(focus => focus.share)).toEqual([2 / 3, 1 / 3])
    expect(result.concentration).toBeCloseTo(1)
  })

  it('keeps empty and low-contrast abstention explicit and validates grid size', () => {
    const scene = grid()
    expect(scene.run()).toMatchObject({ state: 'uniform', reason: 'low-contrast' })
    scene.counts.fill(0); expect(scene.run()).toMatchObject({ state: 'empty', reason: 'no-opaque-pixels' })
    expect(() => selectAttentionRegions({ width: 2, height: 2, values: new Float64Array(3), peak: 0 }, new Float64Array(4))).toThrow('grid')
  })
})
