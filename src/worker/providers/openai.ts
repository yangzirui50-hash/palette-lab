import { analysisReportSchema } from '../../domain/analysis'
import type { AnalysisRequest } from '../../domain/analysis'
import type { AIAnalysisProvider, WorkerEnv } from './types'
import { getProviderDefinition } from './registry'

const systemPrompt = `You are a visual design analyst. Analyze the actual image and the supplied deterministic palette. Return only valid JSON with this exact shape: summary, subjects (max 6 strings), scene, composition, lighting, styleTags (max 6), suitableUseCases (max 4), paletteRoles (max 8 objects with role and rationale), recommendations (max 4 objects with title, rationale and actionable action), uncertainties (max 4), provider and model. Do not invent objects or certainty. Distinguish objective visual evidence from subjective design interpretation. Use concise Simplified Chinese for all user-facing values.`

export function createOpenAIProvider(env: WorkerEnv): AIAnalysisProvider {
  return {
    async analyze(request: AnalysisRequest) {
      if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI_NOT_CONFIGURED')
      const definition = getProviderDefinition(env.AI_PROVIDER)
      const endpoint = env.AI_BASE_URL ?? definition?.defaultBaseUrl ?? 'https://api.openai.com/v1/chat/completions'
      const response = await fetch(endpoint, {
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
      if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`)
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
      const content = payload.choices?.[0]?.message?.content
      if (!content) throw new Error('AI_EMPTY_RESPONSE')
      const parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ''))
      return analysisReportSchema.parse({ ...parsed, provider: definition?.id ?? 'openai-compatible', model: env.AI_MODEL })
    },
  }
}
