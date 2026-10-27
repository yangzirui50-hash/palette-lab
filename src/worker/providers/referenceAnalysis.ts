import { referenceComparisonSchema } from '../../domain/inspiration'
import type { ReferencePhoto } from '../../domain/inspiration'
import type { AnalysisRequest } from '../../domain/analysis'
import { getProviderDefinition } from './registry'
import type { WorkerEnv } from './types'

export async function compareReferences(env: WorkerEnv, request: AnalysisRequest, photos: ReferencePhoto[]) {
  const selected = photos.slice(0, 4)
  if (env.AI_PROVIDER === 'mock') {
    return referenceComparisonSchema.parse({
      summary: '候选图与原图在色块比例和视觉重心上具有可比性，以下结论仅用于验证比较流程。',
      rankings: selected.map((photo, index) => ({
        photoId: photo.id,
        fit: index === 0 ? 'strong' : 'moderate',
        rationale: '候选图的明暗分区与原图可形成对应关系。',
        borrow: '借鉴色块之间的面积分配与留白位置。',
        avoid: '不要直接复制具体构图或内容。',
      })),
      provider: 'mock',
      model: 'deterministic-reference-v1',
    })
  }
  if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI_NOT_CONFIGURED')

  const definition = getProviderDefinition(env.AI_PROVIDER)
  const endpoint = env.AI_BASE_URL ?? definition?.defaultBaseUrl ?? 'https://api.openai.com/v1/chat/completions'
  const prompt = `Compare the original image with the supplied candidate reference images. Return only JSON with summary, rankings, provider and model. rankings is an array of up to 4 objects with photoId, fit (strong/moderate/weak), rationale, borrow, avoid. Use concise Simplified Chinese. Judge color structure, hierarchy and intended use; do not recommend copying protected expression. Candidate IDs: ${selected.map((photo) => photo.id).join(', ')}`
  const content = [
    { type: 'text', text: prompt },
    { type: 'text', text: 'Original image:' },
    { type: 'image_url', image_url: { url: request.image } },
    ...selected.flatMap((photo) => [
      { type: 'text', text: `Candidate ${photo.id}: ${photo.alt}` },
      { type: 'image_url', image_url: { url: photo.thumbnail } },
    ]),
  ]
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
    body: JSON.stringify({ model: env.AI_MODEL, response_format: { type: 'json_object' }, messages: [{ role: 'user', content }] }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`)
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = payload.choices?.[0]?.message?.content
  if (!text) throw new Error('AI_EMPTY_RESPONSE')
  const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  return referenceComparisonSchema.parse({ ...parsed, provider: definition?.id ?? 'openai-compatible', model: env.AI_MODEL })
}
