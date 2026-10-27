import { referencePhotoSchema } from '../../domain/inspiration'
import type { ReferencePhoto } from '../../domain/inspiration'
import type { WorkerEnv } from './types'

export interface InspirationProvider {
  search(query: string, color?: string): Promise<ReferencePhoto[]>
}

export const mockInspirationProvider: InspirationProvider = {
  async search() {
    return [1, 2, 3].map((index) => ({
      id: `mock-${index}`,
      thumbnail: `/fixtures/reference-${index}.svg`,
      fullImage: `/fixtures/reference-${index}.svg`,
      alt: `模拟参考图 ${index}`,
      photographer: 'Palette Lab Test',
      photographerUrl: 'https://github.com/yangzirui50-hash/palette-lab',
      sourceUrl: 'https://github.com/yangzirui50-hash/palette-lab',
      width: 800,
      height: 500,
      color: index === 1 ? '#080808' : index === 2 ? '#e0ff50' : '#4890e0',
    }))
  },
}

export function createUnsplashProvider(env: WorkerEnv): InspirationProvider {
  return {
    async search(query, color) {
      if (!env.UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_NOT_CONFIGURED')
      const url = new URL('https://api.unsplash.com/search/photos')
      url.searchParams.set('query', query)
      url.searchParams.set('per_page', '8')
      url.searchParams.set('content_filter', 'high')
      url.searchParams.set('orientation', 'landscape')
      if (color) url.searchParams.set('color', color)
      const response = await fetch(url, {
        headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' },
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) throw new Error(`UNSPLASH_${response.status}`)
      const payload = await response.json() as { results?: unknown[] }
      return (payload.results ?? []).map((photo) => {
        const record = photo as {
          id: string
          alt_description?: string
          description?: string
          width: number
          height: number
          color?: string
          urls: { regular: string; full: string }
          links: { html: string }
          user: { name: string; links: { html: string } }
        }
        return referencePhotoSchema.parse({
          id: record.id,
          thumbnail: record.urls.regular,
          fullImage: record.urls.full,
          alt: record.alt_description ?? record.description ?? 'Unsplash reference image',
          photographer: record.user.name,
          photographerUrl: record.user.links.html,
          sourceUrl: record.links.html,
          width: record.width,
          height: record.height,
          color: record.color ?? null,
        })
      })
    },
  }
}
