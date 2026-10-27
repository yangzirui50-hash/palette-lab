import { describe, expect, it } from 'vitest'
import app from './index'

const requestBody = {
  image: 'data:image/png;base64,AA==',
  domain: 'web-ui',
  palette: [{ hex: '#080808', share: 1 }],
  assignments: { background: '#080808' },
}

describe('analysis API', () => {
  it('returns a structured report in mock mode', async () => {
    const response = await app.request('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }, { AI_PROVIDER: 'mock' })
    expect(response.status).toBe(200)
    const report = await response.json()
    expect(report.provider).toBe('mock')
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.uncertainties.length).toBeGreaterThan(0)
  })

  it('returns an honest unconfigured response without a key', async () => {
    const response = await app.request('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }, {})
    expect(response.status).toBe(501)
    expect((await response.json()).error).toBe('AI_NOT_CONFIGURED')
  })

  it('rejects invalid requests', async () => {
    const response = await app.request('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'unknown' }),
    }, { AI_PROVIDER: 'mock' })
    expect(response.status).toBe(400)
  })

  it('exposes provider capabilities without exposing credentials', async () => {
    const response = await app.request('/api/providers', {}, {})
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.providers.some((provider: { id: string }) => provider.id === 'deepseek')).toBe(true)
    expect(JSON.stringify(payload)).not.toContain('AI_API_KEY')
  })
})
