import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyzeImageReading } from './reading'
import { analyzeSemanticFocus } from './focus'
import { READING_INPUT_VERSION } from '../../domain/reading'

const request = { task: 'whole-image-reading' as const, image: 'data:image/png;base64,AA==', measurements: { scope: 'source' as const, palette: [], spatial: [], sampleWidth: 64, sampleHeight: 64, notes: 'Synthetic fixture.' } }
const env = { AI_PROVIDER: 'deepseek', AI_MODEL: 'deepseek-flash', AI_API_KEY: 'TEST_PRIVATE_KEY' }
const responseFor = (content: unknown) => new Response(JSON.stringify({ model: 'returned-model-alias', usage: { prompt_tokens: 100, completion_tokens: 200 }, choices: [{ message: { content: JSON.stringify(content) }, finish_reason: 'stop' }] }))
afterEach(() => vi.unstubAllGlobals())

describe('whole-image reading provider', () => {
  it('uses one bounded request for both scales with explicit task and preprocessing provenance', async () => {
    const fixture = await analyzeImageReading({ AI_PROVIDER: 'mock' }, request)
    const fetchMock = vi.fn().mockResolvedValue(responseFor(fixture.reading)); vi.stubGlobal('fetch', fetchMock)
    const observe = vi.fn(), result = await analyzeImageReading(env, request, observe)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.max_tokens).toBe(3072); expect(body.thinking).toEqual({ type: 'disabled' })
    expect(body.messages[0].content).toContain('unranked candidate details')
    expect(body.messages[1].content[1].image_url.detail).toBe('original')
    expect(result.task).toBe('whole-image-reading'); expect(result.run.inputVersion).toBe(READING_INPUT_VERSION)
    expect(result.model).toBe('returned-model-alias'); expect(result.run.promptTokens).toBe(100)
    expect(JSON.stringify(result) + JSON.stringify(observe.mock.calls)).not.toContain('TEST_PRIVATE_KEY')
  })
  it('rejects a focus-shaped answer and sends validation feedback only to the existing second attempt', async () => {
    const { focus } = await analyzeSemanticFocus({ AI_PROVIDER: 'mock' }, request)
    const fixture = await analyzeImageReading({ AI_PROVIDER: 'mock' }, request)
    const fetchMock = vi.fn().mockResolvedValueOnce(responseFor(focus)).mockResolvedValueOnce(responseFor(fixture.reading)); vi.stubGlobal('fetch', fetchMock)
    const result = await analyzeImageReading(env, request)
    expect(result.run.attempts).toBe(2); expect(result.reading).toEqual(fixture.reading)
    const second = JSON.parse(fetchMock.mock.calls[1][1].body)
    const repair = JSON.parse(second.messages[1].content[0].text).structuralRepair
    expect(JSON.parse(repair.previousAnswer)).toHaveProperty('priorities')
    expect(repair.issues.length).toBeGreaterThan(0)
  })
  it('does not retry a provider rate-limit response or request anything while unconfigured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 429 })); vi.stubGlobal('fetch', fetchMock)
    await expect(analyzeImageReading(env, request)).rejects.toThrow('AI_PROVIDER_429')
    await expect(analyzeImageReading({}, request)).rejects.toThrow('AI_NOT_CONFIGURED')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
