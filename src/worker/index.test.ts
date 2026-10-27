import { describe, expect, it, vi } from 'vitest'
import app from './index'

const requestBody = {
  image: 'data:image/png;base64,AA==',
  domain: 'web-ui' as const,
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

  it('returns a credential-safe provider failure reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    try {
      const response = await app.request('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, { AI_PROVIDER: 'deepseek', AI_API_KEY: 'TEST_PLACEHOLDER', AI_MODEL: 'deepseek-flash' })
      expect(response.status).toBe(502)
      const payload = await response.json()
      expect(payload.reason).toBe('AI_PROVIDER_401')
      expect(JSON.stringify(payload)).not.toContain('TEST_PLACEHOLDER')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('retries an invalid model response once and returns a valid report', async () => {
    const { mockAnalysisProvider } = await import('./providers/mock')
    const validReport = await mockAnalysisProvider.analyze(requestBody)
    const providerResponse = (content: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), { status: 200 })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(providerResponse({}))
      .mockResolvedValueOnce(providerResponse(validReport))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const response = await app.request('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, { AI_PROVIDER: 'deepseek', AI_API_KEY: 'TEST_PLACEHOLDER', AI_MODEL: 'deepseek-flash' })
      expect(response.status).toBe(200)
      expect((await response.json()).provider).toBe('deepseek')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('rate-limits paid provider requests before image processing', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false })
    const response = await app.request('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.10' },
      body: JSON.stringify(requestBody),
    }, { AI_PROVIDER: 'mock', AI_RATE_LIMITER: { limit } })
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect((await response.json()).error).toBe('RATE_LIMITED')
    expect(limit).toHaveBeenCalledWith({ key: '/api/analysis:203.0.113.10' })
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

  it('returns attributed mock references and AI comparison', async () => {
    const { mockAnalysisProvider } = await import('./providers/mock')
    const analysis = await mockAnalysisProvider.analyze(requestBody)
    const response = await app.request('/api/inspiration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestBody, analysis }),
    }, { AI_PROVIDER: 'mock', UNSPLASH_PROVIDER: 'mock' })
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.photos).toHaveLength(3)
    expect(payload.photos[0].photographer).toBeTruthy()
    expect(payload.comparison.rankings.length).toBeGreaterThan(0)
  })
})
