import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AttentionEstimate from './AttentionEstimate'
import { selectAttentionRegions } from '../lib/color/attentionRegions'

describe('focus estimate reporting', () => {
  const render = (values: Float64Array) => {
    const heat = { width: 32, height: 32, values, peak: Math.max(...values) }
    const attention = { ...selectAttentionRegions(heat, new Float64Array(1024).fill(1)), version: '1.2.0-prototype', scope:'contrast-only' as const, centroid: null, contrast: heat.peak, heat }
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
    expect(html).toContain('1.2.0-prototype'); expect(html).toContain('尚未经独立人工精度验收')
  })
  it('renders measured candidate bounds and positions without a probability claim', () => {
    const values = new Float64Array(1024)
    for (let y = 8; y < 12; y++) for (let x = 20; x < 24; x++) values[y * 32 + x] = 1
    const html = render(values)
    expect(html).toContain('一处局部反差'); expect(html).toContain('class="attention-region"')
    expect(html).toContain('横向 68.8%'); expect(html).toContain('不是被注视概率')
  })
  it('renders measured outlines without a forced center and discloses the semantic distinction', () => {
    const values = new Float64Array(1024)
    for(let i=8;i<24;i++) { values[8*32+i]=1; values[23*32+i]=1; values[i*32+8]=1; values[i*32+23]=1 }
    const html = render(values)
    expect(html).toContain('区域或轮廓响应'); expect(html).toContain('data-response-geometry="outline"')
    expect(html).toContain('M8,8h16v1h-16Z'); expect(html).toContain('M8,9h1v1h-1Z')
    expect(html).not.toContain('class="attention-marker"')
    expect(html).toContain('尚未判断人物、物体含义'); expect(html).toContain('不是物体边界')
  })
  it('does not claim semantic no-focus from a low-contrast field', () => {
    const html = render(new Float64Array(1024))
    expect(html).toContain('反差不足，重点未判定')
    expect(html).not.toContain('无明确焦点（反差不足）')
  })
})
