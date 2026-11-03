import { describe, expect, it } from 'vitest'
import { wrapCanvasText } from './canvasText'

describe('canvas export text', () => {
  const measure = (value: string) => Array.from(value).length * 10
  it('preserves complete long CJK filenames within measured width', () => {
    const name = `${'作品名称'.repeat(128)}.png`, lines = wrapCanvasText(name, 130, measure)
    expect(lines.join('')).toBe(name)
    expect(lines.every(line => measure(line) <= 130)).toBe(true)
    expect(lines.length).toBeGreaterThan(1)
  })
  it('preserves spaces and complete Unicode codepoints', () => {
    const name = 'Design  😀  作品.png', lines = wrapCanvasText(name, 40, measure)
    expect(lines.join('')).toBe(name); expect(lines.some(line => line.includes('😀'))).toBe(true)
  })
  it('preserves explicit blank lines and empty text', () => {
    expect(wrapCanvasText('A\n\nB', 100, measure)).toEqual(['A', '', 'B'])
    expect(wrapCanvasText('', 100, measure)).toEqual([''])
  })
  it('rejects invalid limits rather than looping or silently clipping', () => {
    for (const width of [0, -1, Infinity, NaN]) expect(() => wrapCanvasText('abc', width, measure)).toThrow('width')
  })
})
