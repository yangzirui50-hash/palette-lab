import { z } from 'zod'
import { focusRequestSchema, focusResultSchema } from './focus'

export const READING_TASK = 'whole-image-reading'
export const READING_PROMPT_VERSION = 'whole-image-reading-1'
export const READING_INPUT_VERSION = 'source-jpeg1024-colors6-spatial512-v1'

// Whole-image interpretation and unranked local cues are a different task from
// predicting a total focus hierarchy. Old focus records keep their own schema.
export const imageReadingSchema = z.object({
  schemaVersion: z.literal(1),
  scene: z.string().min(1).max(200),
  wholeImage: z.object({
    organization: z.string().min(1).max(250),
    character: z.string().min(1).max(200),
    relations: z.array(z.object({
      type: z.enum(['color', 'light', 'form', 'texture', 'gesture', 'interaction', 'scale', 'space']),
      description: z.string().min(1).max(180),
    })).max(4),
  }),
  localCues: z.array(z.object({ label: z.string().min(1).max(80), evidence: z.string().min(1).max(160) })).max(3),
  uncertainties: z.array(z.string().min(1).max(160)).max(4),
})
export const readingRequestSchema = focusRequestSchema.extend({ task: z.literal(READING_TASK) })
export const readingResultSchema = z.object({
  task: z.literal(READING_TASK),
  reading: imageReadingSchema,
  provider: z.string().min(1),
  model: z.string().min(1),
  run: focusResultSchema.shape.run.extend({ inputVersion: z.string().min(1).max(100) }),
})
export type ImageReading = z.infer<typeof imageReadingSchema>
export type ReadingRequest = z.infer<typeof readingRequestSchema>
export type ReadingResult = z.infer<typeof readingResultSchema>
