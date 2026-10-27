import type { WorkerEnv } from './providers/types'

export async function rateLimitExceeded(env: WorkerEnv, key: string) {
  if (!env.AI_RATE_LIMITER) return false
  try {
    const result = await env.AI_RATE_LIMITER.limit({ key })
    return !result.success
  } catch (error) {
    console.error('Rate limiter unavailable', error)
    return true
  }
}
