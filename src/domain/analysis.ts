import { z } from 'zod'

export const analysisReportSchema = z.object({
  summary: z.string().min(1),
  subjects: z.array(z.string()).max(6),
  scene: z.string(),
  composition: z.string(),
  lighting: z.string(),
  styleTags: z.array(z.string()).max(6),
  suitableUseCases: z.array(z.string()).max(4),
  paletteRoles: z.array(z.object({
    role: z.string(),
    rationale: z.string(),
  })).max(8),
  recommendations: z.array(z.object({
    title: z.string(),
    rationale: z.string(),
    action: z.string(),
  })).max(4),
  uncertainties: z.array(z.string()).max(4),
  provider: z.string(),
  model: z.string(),
})

export type AnalysisReport = z.infer<typeof analysisReportSchema>

export const spatialRegionSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pixelCount: z.number().int().nonnegative(),
  share: z.number().min(0).max(1),
  centroid: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  bounds: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  }),
  centerShare: z.number().min(0).max(1),
  edgeShare: z.number().min(0).max(1),
  largestComponentShare: z.number().min(0).max(1),
  componentCount: z.number().int().nonnegative(),
  meanColorSeparation: z.number().nonnegative(),
})

export const analysisRequestSchema = z.object({
  image: z.string().startsWith('data:image/').max(6_000_000),
  domain: z.enum(['web-ui', 'art-poster']),
  palette: z.array(z.object({
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    share: z.number().min(0).max(1),
  })).max(8),
  assignments: z.record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/)),
  spatial: z.array(spatialRegionSchema).max(8).optional(),
})

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>
