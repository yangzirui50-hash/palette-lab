import Color from 'colorjs.io'
import { z } from 'zod'
import { analysisReportSchema, analysisRequestSchema } from './analysis'
import type { AnalysisReport } from './analysis'
import type { DomainId } from './profiles'

export const inspirationRequestSchema = analysisRequestSchema.extend({
  analysis: analysisReportSchema,
})

export const referencePhotoSchema = z.object({
  id: z.string(),
  thumbnail: z.string(),
  fullImage: z.string(),
  alt: z.string(),
  photographer: z.string(),
  photographerUrl: z.string().url(),
  sourceUrl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  color: z.string().nullable(),
})

export const referenceComparisonSchema = z.object({
  summary: z.string(),
  rankings: z.array(z.object({
    photoId: z.string(),
    fit: z.enum(['strong', 'moderate', 'weak']),
    rationale: z.string(),
    borrow: z.string(),
    avoid: z.string(),
  })).max(4),
  provider: z.string(),
  model: z.string(),
})

export type ReferencePhoto = z.infer<typeof referencePhotoSchema>
export type ReferenceComparison = z.infer<typeof referenceComparisonSchema>

export function buildInspirationQuery(analysis: AnalysisReport, domain: DomainId) {
  const domainTerm = domain === 'web-ui' ? 'interface design' : 'poster art'
  const terms = [...analysis.subjects.slice(0, 2), ...analysis.styleTags.slice(0, 2), domainTerm]
  return terms.join(' ').replace(/\s+/g, ' ').trim().slice(0, 160)
}

export function nearestUnsplashColor(palette: Array<{ hex: string; share: number }>) {
  if (palette.length === 0) return undefined
  const candidates = palette.map((item) => {
    const [lightness, chroma, hue] = new Color(item.hex).to('oklch').coords
    return { lightness: lightness ?? 0, chroma: chroma ?? 0, hue: hue ?? 0, share: item.share }
  })
  const best = candidates.sort((a, b) => (b.share * Math.max(b.chroma, 0.04)) - (a.share * Math.max(a.chroma, 0.04)))[0]
  if (best.chroma < 0.06) return best.lightness > 0.6 ? 'white' : 'black'
  const hue = ((best.hue % 360) + 360) % 360
  if (hue < 20 || hue >= 340) return 'red'
  if (hue < 45) return 'orange'
  if (hue < 75) return 'yellow'
  if (hue < 150) return 'green'
  if (hue < 195) return 'teal'
  if (hue < 260) return 'blue'
  if (hue < 300) return 'purple'
  return 'magenta'
}
