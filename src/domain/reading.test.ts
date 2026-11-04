import { describe, expect, it } from 'vitest'
import { imageReadingSchema, readingRequestSchema, readingResultSchema } from './reading'
import { analyzeImageReading } from '../worker/providers/reading'

const request = { task: 'whole-image-reading' as const, image: 'data:image/png;base64,AA==', measurements: { scope: 'source' as const, palette: [], spatial: [], sampleWidth: 64, sampleHeight: 64, notes: 'Synthetic contract fixture.' } }

describe('whole-image reading contract', () => {
  it('requires an explicit task and full-source scope rather than interpreting a focus/ROI request', () => {
    expect(readingRequestSchema.safeParse(request).success).toBe(true)
    expect(readingRequestSchema.safeParse({ ...request, task: undefined }).success).toBe(false)
    expect(readingRequestSchema.safeParse({ ...request, measurements: { ...request.measurements, scope: 'roi' } }).success).toBe(false)
  })
  it('supports an empty local list and keeps whole-image interpretation distinct from a total rank', async () => {
    const result = await analyzeImageReading({ AI_PROVIDER: 'mock' }, request)
    expect(imageReadingSchema.safeParse({ ...result.reading, localCues: [] }).success).toBe(true)
    expect(readingResultSchema.safeParse({ ...result, task: 'semantic-focus' }).success).toBe(false)
    expect(readingResultSchema.safeParse({ ...result, reading: { ...result.reading, schemaVersion: 2 } }).success).toBe(false)
    expect(readingResultSchema.safeParse({ focus: result.reading, provider: 'mock', model: 'fixture', run: result.run }).success).toBe(false)
    expect(result.reading).not.toHaveProperty('priorities')
  })
  it('bounds the amount of local and relational information without requiring a local winner', async () => {
    const { reading } = await analyzeImageReading({ AI_PROVIDER: 'mock' }, request)
    expect(imageReadingSchema.safeParse({ ...reading, localCues: Array.from({ length: 4 }, () => reading.localCues[0]) }).success).toBe(false)
    expect(imageReadingSchema.safeParse({ ...reading, wholeImage: { ...reading.wholeImage, relations: [{ type: 'attention-score', description: 'Unsupported score.' }] } }).success).toBe(false)
  })
})
