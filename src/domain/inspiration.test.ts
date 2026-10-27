import { describe, expect, it } from 'vitest'
import { buildInspirationQuery, nearestUnsplashColor } from './inspiration'
import { mockAnalysisProvider } from '../worker/providers/mock'

const request = {
  image: 'data:image/png;base64,AA==',
  domain: 'web-ui' as const,
  palette: [{ hex: '#080808', share: 1 }],
  assignments: { background: '#080808' },
}

describe('inspiration planning', () => {
  it('builds a content-aware query from the analysis and domain', async () => {
    const analysis = await mockAnalysisProvider.analyze(request)
    const query = buildInspirationQuery(analysis, 'web-ui')
    expect(query).toContain('几何色块')
    expect(query).toContain('interface design')
    expect(query.length).toBeLessThanOrEqual(160)
  })

  it('maps palette colors to supported Unsplash filters', () => {
    expect(nearestUnsplashColor([{ hex: '#dfff4f', share: 1 }])).toBe('green')
    expect(nearestUnsplashColor([{ hex: '#4890e0', share: 1 }])).toBe('blue')
    expect(nearestUnsplashColor([{ hex: '#080808', share: 1 }])).toBe('black')
    expect(nearestUnsplashColor([])).toBeUndefined()
  })
})
