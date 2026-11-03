import { describe, expect, it } from 'vitest'
import { analysisRequestSchema } from './analysis'

const base = { image: 'data:image/png;base64,AA==', domain: 'web-ui', palette: [{ hex: '#123456', share: 1 }], assignments: { background: '#123456' } }
describe('scoped analysis evidence', () => {
  it('keeps existing full-image callers compatible', () => {
    expect(analysisRequestSchema.safeParse(base).success).toBe(true)
  })
  it('retains explicit ROI scope with full-source coordinates', () => {
    const spatialScope = { area: 'roi', coordinates: 'source', roi: { x: .2, y: .3, width: .4, height: .5 } }
    expect(analysisRequestSchema.parse({ ...base, spatialScope }).spatialScope).toEqual(spatialScope)
  })
  it('rejects a missing or overflowing ROI instead of guessing its scope', () => {
    expect(analysisRequestSchema.safeParse({ ...base, spatialScope: { area: 'roi', coordinates: 'source' } }).success).toBe(false)
    expect(analysisRequestSchema.safeParse({ ...base, spatialScope: { area: 'roi', coordinates: 'source', roi: { x: .9, y: .3, width: .4, height: .5 } } }).success).toBe(false)
  })
})
