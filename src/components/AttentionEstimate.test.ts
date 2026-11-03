import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AttentionEstimate from './AttentionEstimate'
import { selectAttentionRegions } from '../lib/color/attentionRegions'

describe('focus estimate reporting', () => {
  const render = (values: Float64Array) => {
    const heat = { width: 32, height: 32, values, peak: Math.max(...values) }
    const attention = { ...selectAttentionRegions(heat, new Float64Array(1024).fill(1)), version: '1.1.0', centroid: null, contrast: heat.peak, heat }
    return renderToStaticMarkup(createElement(AttentionEstimate, { attention, imageUrl: 'fixture.png', local: false }))
  }
  it('reports fragmented candidates as uncertainty instead of asserting dispersed structure', () => {
    const values = new Float64Array(1024)
    for (let y = 2; y < 32; y += 5) for (let x = 2; x < 32; x += 5) values[y * 32 + x] = 1
    const html = render(values)
    expect(html).toContain('候选不足，暂不定位'); expect(html).toContain('fragmented-response')
    expect(html).not.toContain('class="attention-marker"'); expect(html).not.toContain('反差分布较广')
  })
  it('keeps broad response separate and discloses model/qualification limits', () => {
    const html = render(new Float64Array(1024).fill(1))
    expect(html).toContain('反差分布较广'); expect(html).toContain('broad-response')
    expect(html).toContain('1.1.0'); expect(html).toContain('尚未经独立人工精度验收')
  })
  it('renders measured candidate bounds and positions without a probability claim', () => {
    const values = new Float64Array(1024)
    for (let y = 8; y < 12; y++) for (let x = 20; x < 24; x++) values[y * 32 + x] = 1
    const html = render(values)
    expect(html).toContain('单焦点候选'); expect(html).toContain('class="attention-region"')
    expect(html).toContain('横向 68.8%'); expect(html).toContain('不是被注视概率')
  })
})
