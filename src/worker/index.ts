import { Hono } from 'hono'
import { analysisRequestSchema } from '../domain/analysis'
import { mockAnalysisProvider } from './providers/mock'
import { createOpenAIProvider } from './providers/openai'
import type { WorkerEnv } from './providers/types'

const app = new Hono<{ Bindings: WorkerEnv }>()

app.get('/api/health', (c) => c.json({ status: 'ok', phase: 'ai-preview' }))

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
    return c.json({ error: 'AI_ANALYSIS_FAILED', message: '分析服务暂时不可用，请稍后重试。' }, 502)
  }
})

export default app
