import { describe, expect, it } from 'vitest'
import { getProviderDefinition, providerRegistry } from './registry'

describe('provider registry', () => {
  it('registers DeepSeek Flash for multimodal analysis', () => {
    const provider = getProviderDefinition('deepseek')
    expect(provider?.defaultModel).toBe('deepseek-flash')
    expect(provider?.vision).toBe(true)
    expect(provider?.structuredOutputs).toBe(true)
    expect(provider?.implemented).toBe(true)
  })

  it('keeps custom providers explicit rather than pretending compatibility', () => {
    expect(getProviderDefinition('cloudflare')?.implemented).toBe(false)
    expect(getProviderDefinition('unknown')).toBeNull()
  })

  it('keeps Kimi available through the same OpenAI-compatible protocol', () => {
    expect(getProviderDefinition('kimi')?.protocol).toBe('openai-compatible')
    expect(Object.keys(providerRegistry)).toContain('openai')
  })
})
