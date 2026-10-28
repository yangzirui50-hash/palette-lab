import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import type { PaletteSwatch } from '../lib/color/extract'
import { generateUnifiedSeriesPalette } from './unify'
import type { SeriesStrategyImage } from './unify'

function swatch(hex: string): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as PaletteSwatch['rgb'],
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as PaletteSwatch['oklch'],
    share: 0.5,
  }
}

function image(id: string, background: string, accent: string, lockedRoles: string[] = []): SeriesStrategyImage {
  return {
    id,
    label: id,
    palette: [swatch(background), swatch(accent)],
    roles: { background, surface: background, textPrimary: accent, accent },
    lockedRoles,
  }
}

const primary = image('primary', '#080808', '#e0ff50')
const candidate = image('candidate', '#181818', '#4890e0')

describe('unified series strategies', () => {
  it('follows the primary while preserving locked candidate roles', () => {
    const locked = image('candidate', '#181818', '#4890e0', ['accent'])
    const result = generateUnifiedSeriesPalette([primary, locked], 'primary', 'web-ui', 'follow-primary')
    expect(result.roles.background).toBe('#080808')
    expect(result.roles.accent).toBe('#e0ff50')
    expect(result.exceptions.candidate).toEqual({ accent: '#4890e0' })
  })

  it('chooses an existing medoid rather than inventing an RGB average', () => {
    const images = [image('a', '#000000', '#ffffff'), image('b', '#111111', '#ffffff'), image('c', '#222222', '#ffffff')]
    const result = generateUnifiedSeriesPalette(images, 'a', 'web-ui', 'balanced')
    expect(result.roles.background).toBe('#111111')
    expect(images.some((image) => image.roles.background === result.roles.background)).toBe(true)
    expect(result.rationale).toContain('不是 RGB 平均色')
  })

  it('preserves per-image accents while unifying foundational roles', () => {
    const result = generateUnifiedSeriesPalette([primary, candidate], 'primary', 'web-ui', 'preserve-accents')
    expect(result.roles.background).toBe('#080808')
    expect(result.roles.accent).toBe('#e0ff50')
    expect(result.exceptions.candidate).toEqual({ accent: '#4890e0' })
    expect(result.exceptions.primary).toBeUndefined()
  })

  it('honors primary locks during balanced generation', () => {
    const lockedPrimary = image('primary', '#080808', '#e0ff50', ['background'])
    const result = generateUnifiedSeriesPalette([lockedPrimary, candidate], 'primary', 'web-ui', 'balanced')
    expect(result.roles.background).toBe('#080808')
  })

  it('does not mutate image roles when generating a strategy', () => {
    const original = structuredClone(primary.roles)
    generateUnifiedSeriesPalette([primary, candidate], 'primary', 'web-ui', 'balanced')
    expect(primary.roles).toEqual(original)
  })

  it('rejects an unknown primary', () => {
    expect(() => generateUnifiedSeriesPalette([primary, candidate], 'missing', 'web-ui', 'balanced')).toThrow('Primary image')
  })
})
