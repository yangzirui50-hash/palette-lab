import type { AnalysisReport, AnalysisRequest } from '../../domain/analysis'

export interface AIAnalysisProvider {
  analyze(request: AnalysisRequest): Promise<AnalysisReport>
}

export type WorkerEnv = {
  AI_API_KEY?: string
  AI_MODEL?: string
  AI_BASE_URL?: string
  AI_PROVIDER?: string
  UNSPLASH_ACCESS_KEY?: string
  UNSPLASH_PROVIDER?: string
  AI_RATE_LIMITER?: {
    limit(input: { key: string }): Promise<{ success: boolean }>
  }
}
