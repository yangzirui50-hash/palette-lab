export type ProviderDefinition = {
  id: string
  label: string
  protocol: 'openai-compatible' | 'custom'
  defaultModel: string
  defaultBaseUrl?: string
  vision: boolean
  structuredOutputs: boolean
  implemented: boolean
}

export const providerRegistry: Record<string, ProviderDefinition> = {
  kimi: {
    id: 'kimi',
    label: 'Kimi',
    protocol: 'openai-compatible',
    defaultModel: 'kimi-k3.1-pro',
    defaultBaseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    vision: true,
    structuredOutputs: true,
    implemented: true,
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    protocol: 'openai-compatible',
    defaultModel: 'deepseek-flash',
    defaultBaseUrl: 'https://api.deepseek.com/chat/completions',
    vision: true,
    structuredOutputs: true,
    implemented: true,
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    protocol: 'openai-compatible',
    defaultModel: '',
    vision: true,
    structuredOutputs: true,
    implemented: true,
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    protocol: 'openai-compatible',
    defaultModel: '',
    defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    vision: true,
    structuredOutputs: true,
    implemented: true,
  },
  cloudflare: {
    id: 'cloudflare',
    label: 'Cloudflare Workers AI',
    protocol: 'custom',
    defaultModel: '',
    vision: true,
    structuredOutputs: true,
    implemented: false,
  },
}

export function getProviderDefinition(id?: string) {
  return providerRegistry[id ?? ''] ?? null
}
