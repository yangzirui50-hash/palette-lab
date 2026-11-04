import { Hono } from 'hono'
import { analysisRequestSchema } from '../domain/analysis'
import { mockAnalysisProvider } from './providers/mock'
import { createOpenAIProvider } from './providers/openai'
import type { WorkerEnv } from './providers/types'
import { providerRegistry } from './providers/registry'
import { inspirationRequestSchema, nearestUnsplashColor, buildInspirationQuery } from '../domain/inspiration'
import { createUnsplashProvider, mockInspirationProvider } from './providers/unsplash'
import { compareReferences } from './providers/referenceAnalysis'
import { rateLimitExceeded } from './rateLimit'
import { focusRequestSchema } from '../domain/focus'
import { analyzeSemanticFocus } from './providers/focus'
import { readingRequestSchema } from '../domain/reading'
import { analyzeImageReading } from './providers/reading'

const app = new Hono<{ Bindings: WorkerEnv }>()

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'POST') {
    const route = new URL(c.req.url).pathname
    const actor = c.req.header('cf-connecting-ip') ?? 'local'
    if (await rateLimitExceeded(c.env, `${route}:${actor}`)) {
      c.header('Retry-After', '60')
      return c.json({ error: 'RATE_LIMITED', message: '请求较为频繁，请 1 分钟后再试。' }, 429)
    }
  }
  await next()
})

app.get('/api/providers', (c) => c.json({ providers: Object.values(providerRegistry) }))
app.get('/api/health', (c) => c.json({
  status: 'ok',
  phase: 'ai-preview',
  provider: c.env.AI_PROVIDER ?? 'unconfigured',
  configured: Boolean(c.env.AI_API_KEY && c.env.AI_MODEL),
}))

app.post('/api/reading', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 6_000_000) return c.json({ error: 'IMAGE_TOO_LARGE' }, 413)
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'INVALID_JSON' }, 400) }
  const parsed = readingRequestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'INVALID_READING_REQUEST' }, 400)
  try { return c.json(await analyzeImageReading(c.env, parsed.data)) } catch (error) {
    if (error instanceof Error && error.message === 'AI_NOT_CONFIGURED') return c.json({ error: 'AI_NOT_CONFIGURED', message: 'AI 服务尚未配置，取色与编辑不受影响。' }, 501)
    const reason = error instanceof Error && /^AI_(?:PROVIDER_(?:\d{3}|TIMEOUT)|EMPTY_RESPONSE|INVALID_JSON|INVALID_SCHEMA|NETWORK_ERROR)$/.test(error.message) ? error.message : 'AI_ANALYSIS_FAILED'
    return c.json({ error: 'AI_READING_FAILED', reason, message: '整体解读暂未完成，已有结果和本地工作不受影响。' }, 502)
  }
})

app.post('/api/focus',async(c)=>{
 if(Number(c.req.header('content-length')??0)>6_000_000)return c.json({error:'IMAGE_TOO_LARGE'},413)
 let body:unknown
 try{body=await c.req.json()}catch{return c.json({error:'INVALID_JSON'},400)}
 const parsed=focusRequestSchema.safeParse(body)
 if(!parsed.success)return c.json({error:'INVALID_FOCUS_REQUEST'},400)
 try{return c.json(await analyzeSemanticFocus(c.env,parsed.data))}
 catch(error){
  if(error instanceof Error&&error.message==='AI_NOT_CONFIGURED')return c.json({error:'AI_NOT_CONFIGURED',message:'AI 服务尚未配置，取色与编辑不受影响。'},501)
  const reason=error instanceof Error&&/^AI_(?:PROVIDER_(?:\d{3}|TIMEOUT)|EMPTY_RESPONSE|INVALID_JSON|INVALID_SCHEMA|NETWORK_ERROR)$/.test(error.message)?error.message:'AI_ANALYSIS_FAILED'
  return c.json({error:'AI_FOCUS_FAILED',reason,message:'主体判断暂未完成，已有结果和本地工作不受影响。'},502)
 }
})

app.post('/api/analysis', async (c) => {
  const contentLength = Number(c.req.header('content-length') ?? 0)
  if (contentLength > 6_000_000) return c.json({ error: 'IMAGE_TOO_LARGE' }, 413)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'INVALID_JSON' }, 400)
  }

  const parsed = analysisRequestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'INVALID_ANALYSIS_REQUEST', issues: parsed.error.issues }, 400)

  const provider = c.env.AI_PROVIDER === 'mock' ? mockAnalysisProvider : createOpenAIProvider(c.env)
  try {
    const report = await provider.analyze(parsed.data)
    return c.json(report)
  } catch (error) {
    if (error instanceof Error && error.message === 'AI_NOT_CONFIGURED') {
      return c.json({ error: 'AI_NOT_CONFIGURED', message: 'AI 服务尚未配置，离线功能不受影响。' }, 501)
    }
    console.error('Analysis provider failed', error)
    const reason = error instanceof Error && /^AI_(?:PROVIDER_(?:\d{3}|TIMEOUT)|EMPTY_RESPONSE|INVALID_JSON|INVALID_SCHEMA|NETWORK_ERROR)$/.test(error.message)
      ? error.message
      : 'AI_ANALYSIS_FAILED'
    return c.json({ error: 'AI_ANALYSIS_FAILED', reason, message: '分析服务暂时不可用，请稍后重试。' }, 502)
  }
})

app.post('/api/inspiration', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'INVALID_JSON' }, 400)
  }
  const parsed = inspirationRequestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'INVALID_INSPIRATION_REQUEST' }, 400)

  try {
    const source = c.env.UNSPLASH_PROVIDER === 'mock' ? mockInspirationProvider : createUnsplashProvider(c.env)
    const query = buildInspirationQuery(parsed.data.analysis, parsed.data.domain)
    const photos = await source.search(query, nearestUnsplashColor(parsed.data.palette))
    let comparison = null
    let comparisonError: string | null = null
    try {
      comparison = await compareReferences(c.env, parsed.data, photos)
    } catch {
      comparisonError = 'AI_COMPARISON_FAILED'
    }
    return c.json({ query, source: c.env.UNSPLASH_PROVIDER === 'mock' ? 'mock-unsplash' : 'unsplash', photos, comparison, comparisonError })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNSPLASH_NOT_CONFIGURED') {
      return c.json({ error: 'UNSPLASH_NOT_CONFIGURED', message: 'Unsplash 尚未配置，离线功能不受影响。' }, 501)
    }
    console.error('Inspiration provider failed', error)
    return c.json({ error: 'INSPIRATION_FAILED', message: '参考图服务暂时不可用，请稍后重试。' }, 502)
  }
})

export default app
