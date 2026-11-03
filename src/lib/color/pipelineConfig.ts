// Bump the version when decoded evidence or extraction semantics change.
export const COLOR_PIPELINE = {
  version: '2.0.0',
  maxEdge: 512,
  alphaCutoff: 128,
  maxSamples: 8000,
  histogramStep: 8,
} as const

export type ImageAnalysisMetadata = {
  version: string
  maxEdge: number
  alphaCutoff: number
  maxSamples: number
  histogramStep: number
  requestedColorCount: number
}
