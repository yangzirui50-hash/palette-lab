import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import DomainPreview from './DomainPreview'
import { analyzePaletteSpatial } from '../lib/color/spatial'
import { extractPalette } from '../lib/color/extract'

describe('poster position evidence', () => {
  it('uses the normal design fallback when a color has no measured pixels', () => {
    const assignments = { canvas: '#000000', primaryVisual: '#ff0000', secondaryVisual: '#808080', accent: '#00ff00', displayText: '#ffffff', bodyText: '#ffffff' }
    const spatial = analyzePaletteSpatial([[0, 0, 0]], 1, 1, extractPalette([[255, 0, 0], [0, 0, 0]], 2))
    const baseline = renderToStaticMarkup(createElement(DomainPreview, { domain: 'art-poster', assignments }))
    const emptyRegion = renderToStaticMarkup(createElement(DomainPreview, { domain: 'art-poster', assignments, spatial }))
    const position = (html: string) => html.match(/--primary-x:([^;]+)/)?.[1]
    expect(position(baseline)).toBeDefined()
    expect(position(emptyRegion)).toBe(position(baseline))
  })
})
