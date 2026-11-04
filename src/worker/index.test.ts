import { describe, expect, it, vi } from 'vitest'
import app from './index'

const requestBody = {
  image: 'data:image/png;base64,AA==',
  domain: 'web-ui' as const,
  palette: [{ hex: '#080808', share: 1 }],
  assignments: { background: '#080808' },
  spatial: [{
    hex: '#080808',
    pixelCount: 100,
    share: 1,
    centroid: { x: 0.5, y: 0.5 },
    dominantCentroid: { x: 0.5, y: 0.5 },
    bounds: { x: 0, y: 0, width: 1, height: 1 },
    centerShare: 1,
    edgeShare: 0,
    largestComponentShare: 1,
    componentCount: 1,
    meanColorSeparation: 0,
  }],
}

describe('analysis API', () => {
  it('validates and rate-limits the independent whole-image reading task', async () => {
    const body = { task: 'whole-image-reading', image: requestBody.image, measurements: { scope: 'source', palette: [], spatial: [], sampleWidth: 64, sampleHeight: 64, notes: 'Synthetic route fixture.' } }
    const options = (data: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.10' }, body: JSON.stringify(data) })
    const valid = await app.request('/api/reading', options(body), { AI_PROVIDER: 'mock' })
    expect(valid.status).toBe(200); expect((await valid.json()).task).toBe('whole-image-reading')
    const legacy = await app.request('/api/reading', options({ ...body, task: undefined }), { AI_PROVIDER: 'mock' })
    expect(legacy.status).toBe(400)
    const roi = await app.request('/api/reading', options({ ...body, measurements: { ...body.measurements, scope: 'roi' } }), { AI_PROVIDER: 'mock' })
    expect(roi.status).toBe(400)
    const limit = vi.fn().mockResolvedValue({ success: false })
    const limited = await app.request('/api/reading', options(body), { AI_PROVIDER: 'mock', AI_RATE_LIMITER: { limit } })
    expect(limited.status).toBe(429); expect(limit).toHaveBeenCalledWith({ key: '/api/reading:203.0.113.10' })
    const unconfigured = await app.request('/api/reading', options(body), {})
    expect(unconfigured.status).toBe(501)
  })
  it('validates and rate-limits the independent paid focus task',async()=>{
    const body={image:requestBody.image,measurements:{scope:'source',palette:[],spatial:[],sampleWidth:64,sampleHeight:64,notes:'Synthetic API contract.'}}
    const response=await app.request('/api/focus',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)},{AI_PROVIDER:'mock'})
    expect(response.status).toBe(200);expect((await response.json()).focus.dominance).toBe('ranked')
    const invalid=await app.request('/api/focus',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,measurements:{...body.measurements,scope:'roi'}})},{AI_PROVIDER:'mock'})
    expect(invalid.status).toBe(400)
    const limit=vi.fn().mockResolvedValue({success:false})
    const limited=await app.request('/api/focus',{method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':'203.0.113.10'},body:JSON.stringify(body)},{AI_PROVIDER:'mock',AI_RATE_LIMITER:{limit}})
    expect(limited.status).toBe(429);expect(limit).toHaveBeenCalledWith({key:'/api/focus:203.0.113.10'})
    const unavailable=await app.request('/api/focus',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)},{})
    expect(unavailable.status).toBe(501)
  })
  it('forwards ROI scope to the provider without relabeling local shares as full-image area', async () => {
    const { mockAnalysisProvider } = await import('./providers/mock')
    const report = await mockAnalysisProvider.analyze(requestBody)
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(report) } }] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const spatialScope = { area: 'roi', coordinates: 'source', roi: { x: .2, y: .3, width: .4, height: .5 } }
      const response = await app.request('/api/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...requestBody, spatialScope }) }, { AI_PROVIDER: 'deepseek', AI_API_KEY: 'TEST_PLACEHOLDER', AI_MODEL: 'deepseek-flash' })
      expect(response.status).toBe(200)
      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(JSON.parse(body.messages[1].content[0].text).spatialScope).toEqual(spatialScope)
      expect(body.messages[0].content).toContain('not full-image area')
    } finally { vi.unstubAllGlobals() }
  })
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

  it('accepts the observed legacy action-text alias without another paid request', async () => {
    const { mockAnalysisProvider } = await import('./providers/mock')
    const report = await mockAnalysisProvider.analyze(requestBody)
    const recommendations = report.recommendations.map(({ action, ...item }) => ({ ...item, actionable: action }))
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...report, recommendations }) } }] })))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const response = await app.request('/api/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }, { AI_PROVIDER: 'deepseek', AI_API_KEY: 'TEST_PLACEHOLDER', AI_MODEL: 'deepseek-flash' })
      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.recommendations).toEqual(report.recommendations)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally { vi.unstubAllGlobals() }
  })

  it('rejects malformed action values and retains an explicit action over an extra alias', async () => {
    const { mockAnalysisProvider } = await import('./providers/mock')
    const report = await mockAnalysisProvider.analyze(requestBody)
    const responseFor = (recommendations: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...report, recommendations }) } }] }))
    const invalid = report.recommendations.map(item => ({ ...item, action: 42, actionable: 'A valid-looking alias must not hide an invalid explicit action.' }))
    const fetchMock = vi.fn().mockResolvedValueOnce(responseFor(invalid)).mockResolvedValueOnce(responseFor(report.recommendations.map(item => ({ ...item, actionable: 'An extra key must not replace the explicit action.' }))))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const response = await app.request('/api/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }, { AI_PROVIDER: 'deepseek', AI_API_KEY: 'TEST_PLACEHOLDER', AI_MODEL: 'deepseek-flash' })
      expect(response.status).toBe(200)
      expect((await response.json()).recommendations).toEqual(report.recommendations)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally { vi.unstubAllGlobals() }
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
      expect(fetchMock.mock.calls[0][1].body).toContain('largestComponentShare')
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
