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
  it('includes a retained manual color in effective roles and the unified palette without inventing area', () => {
    const result = generateUnifiedSeriesPalette([primary, candidate], 'primary', 'web-ui', 'balanced', { background: '#123456' })
    expect(result.roles.background).toBe('#123456')
    expect(result.palette.find(color => color.hex === '#123456')).toMatchObject({ share: 0 })
    expect(result.rationale).toContain('1 项手动选择')
    expect(primary.roles.background).toBe('#080808')
  })

  it('recomputes a locked-image exception when manual editing changes the global base', () => {
    const locked = image('candidate', '#080808', '#4890e0', ['background'])
    const result = generateUnifiedSeriesPalette([primary, locked], 'primary', 'web-ui', 'follow-primary', { background: '#123456' })
    expect(result.roles.background).toBe('#123456')
    expect(result.exceptions.candidate).toEqual({ background: '#080808' })
  })

  it('keeps a primary lock as a per-image exception while allowing an explicit global edit', () => {
    const locked = image('primary', '#080808', '#e0ff50', ['background'])
    const result = generateUnifiedSeriesPalette([locked, candidate], 'primary', 'web-ui', 'balanced', { background: '#123456' })
    expect(result.roles.background).toBe('#123456')
    expect(result.exceptions.primary).toEqual({ background: '#080808' })
  })

  it('updates untouched roles from the latest suggestion while retaining only explicit overrides', () => {
    const changed = { ...primary, roles: { ...primary.roles, surface: '#765432' } }
    const result = generateUnifiedSeriesPalette([changed, candidate], 'primary', 'web-ui', 'follow-primary', { background: '#123456' })
    expect(result.roles.background).toBe('#123456')
    expect(result.roles.surface).toBe('#765432')
    expect(result.roles.accent).toBe(primary.roles.accent)
  })

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
