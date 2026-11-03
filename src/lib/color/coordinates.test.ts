import { describe, expect, it } from 'vitest'
import { analyzePaletteSpatial } from './spatial'
import { extractPalette } from './extract'
import { sourceCoordinates } from './coordinates'

describe('ROI evidence coordinates', () => {
  const pixels = [[255, 0, 0] as const, [0, 0, 0] as const]
  const regions = analyzePaletteSpatial(pixels, 2, 1, extractPalette(pixels, 2))
  it('maps centers and bounds to the original frame while retaining local area shares', () => {
    const mapped = sourceCoordinates(regions, { x: .2, y: .6, width: .4, height: .2 })
    expect(mapped[0].centroid.x).toBeCloseTo(.3, 12)
    expect(mapped[0].centroid.y).toBeCloseTo(.7, 12)
    expect(mapped[0].bounds).toEqual({ x: .2, y: .6, width: .2, height: .2 })
    expect(mapped[0].share).toBe(regions[0].share)
    expect(regions[0].centroid.x).toBe(.25)
  })
  it('leaves full-frame evidence unchanged', () => {
    expect(sourceCoordinates(regions, null)).toBe(regions)
  })
})
