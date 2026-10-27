import { describe, expect, it } from 'vitest'
import { createCssVariables, createDesignTokens } from './exporters'
import { extractPalette } from './color/extract'

const palette = extractPalette([[0, 0, 0], [255, 255, 255]], 2)

describe('export adapters', () => {
  it('creates usable CSS variables', () => {
    const css = createCssVariables('web-ui', { background: '#000000', accent: '#dfff4f' })
    expect(css).toContain('--color-background: #000000;')
    expect(css).toContain('--color-accent: #dfff4f;')
    expect(css).toContain(':root')
  })

  it('creates structured design tokens with palette data', () => {
    const json = createDesignTokens('art-poster', { canvas: '#080808' }, palette)
    const tokens = JSON.parse(json)
    expect(tokens.$schema).toBe('./schemas/design-tokens/v1.json')
    expect(tokens.schemaVersion).toBe('1.0.0')
    expect(tokens.domain).toBe('art-poster')
    expect(tokens.roles.canvas).toBe('#080808')
    expect(tokens.palette).toHaveLength(2)
    expect(tokens.palette[0].hex).toMatch(/^#[0-9a-f]{6}$/)
  })
})
