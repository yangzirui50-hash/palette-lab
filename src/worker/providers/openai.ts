import { analysisReportSchema } from '../../domain/analysis'
import type { AnalysisRequest } from '../../domain/analysis'
import type { AIAnalysisProvider, WorkerEnv } from './types'
import { getProviderDefinition } from './registry'

const systemPrompt = `You are a visual design analyst. Analyze the actual image and the supplied deterministic palette. Return only valid JSON with this exact shape: summary, subjects (max 6 strings), scene, composition, lighting, styleTags (max 6), suitableUseCases (max 4), paletteRoles (max 8 objects with role and rationale), recommendations (max 4 objects with title, rationale and actionable action), uncertainties (max 4), provider and model. Do not invent objects or certainty. Distinguish objective visual evidence from subjective design interpretation. Use concise Simplified Chinese for all user-facing values.`

function isRetryable(error: unknown) {
  return error instanceof Error && (
    /^AI_PROVIDER_5\d\d$/.test(error.message)
    || ['AI_EMPTY_RESPONSE', 'AI_INVALID_JSON', 'AI_INVALID_SCHEMA', 'AI_PROVIDER_TIMEOUT', 'AI_NETWORK_ERROR'].includes(error.message)
  )
}

async function requestAnalysis(env: WorkerEnv, request: AnalysisRequest) {
  const definition = getProviderDefinition(env.AI_PROVIDER)
  const endpoint = env.AI_BASE_URL ?? definition?.defaultBaseUrl ?? 'https://api.openai.com/v1/chat/completions'
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
      body: JSON.stringify({
        model: env.AI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: [
            { type: 'text', text: JSON.stringify({ domain: request.domain, palette: request.palette, assignments: request.assignments }) },
            { type: 'image_url', image_url: { url: request.image } },
          ] },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    })
  } catch (error) {
    if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) throw new Error('AI_PROVIDER_TIMEOUT')
    if (error instanceof TypeError) throw new Error('AI_NETWORK_ERROR')
    throw error
  }
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`)
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('AI_EMPTY_RESPONSE')
  let parsed: unknown
  try {
    parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    throw new Error('AI_INVALID_JSON')
  }
  const report = analysisReportSchema.safeParse({ ...parsed as Record<string, unknown>, provider: definition?.id ?? 'openai-compatible', model: env.AI_MODEL })
  if (!report.success) throw new Error('AI_INVALID_SCHEMA')
  return report.data
}

export function createOpenAIProvider(env: WorkerEnv): AIAnalysisProvider {
  return {
    async analyze(request: AnalysisRequest) {
      if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI_NOT_CONFIGURED')
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          return await requestAnalysis(env, request)
        } catch (error) {
          if (attempt === 1 || !isRetryable(error)) throw error
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
      throw new Error('AI_ANALYSIS_FAILED')
    },
  }
}
