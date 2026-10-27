import Color from 'colorjs.io'
import { describe, expect, it } from 'vitest'
import type { PaletteSwatch } from '../lib/color/extract'
import { compareSeries, compareSeriesImage, seriesColorDistance } from './series'
import type { SeriesImageAnalysis } from './series'

function swatch(hex: string, share: number): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as PaletteSwatch['rgb'],
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as PaletteSwatch['oklch'],
    share,
  }
}

function image(id: string, palette: PaletteSwatch[], roles: Record<string, string> = {}): SeriesImageAnalysis {
  return { id, label: id, palette, roles }
}

const black = swatch('#080808', 0.5)
const green = swatch('#e0ff50', 0.325)
const blue = swatch('#4890e0', 0.175)

const primary = image('primary', [black, green, blue], {
  background: '#080808',
  accent: '#e0ff50',
  bodyText: '#4890e0',
})

describe('series color distance and image comparison', () => {
  it('returns no differences for identical images and keeps all colors shared', () => {
    const candidate = image('candidate', [black, green, blue], primary.roles)
    const comparison = compareSeriesImage(primary, candidate)
    expect(comparison.colorDifferences.every((difference) => difference.type === 'shared')).toBe(true)
    expect(comparison.colorDifferences.every((difference) => difference.type === 'shared' && difference.distance === 0 && difference.shareDelta === 0)).toBe(true)
    expect(comparison.roleDifferences).toEqual([])

    const report = compareSeries([primary, candidate], 'primary')
    expect(report.sharedColors).toHaveLength(3)
    expect(report.sharedColors[0].minShare).toBe(report.sharedColors[0].maxShare)
  })

  it('reports missing, additional and proportional differences with evidence', () => {
    const candidate = image('candidate', [swatch('#080808', 0.7), swatch('#e0ff50', 0.2), swatch('#c64b45', 0.1)], primary.roles)
    const comparison = compareSeriesImage(primary, candidate)
    const shared = comparison.colorDifferences.find((difference) => difference.type === 'shared' && difference.primary.hex === '#080808')
    expect(shared).toMatchObject({ type: 'shared', distance: 0, shareDelta: 0.2 })
    expect(comparison.colorDifferences.some((difference) => difference.type === 'missing' && difference.primary.hex === '#4890e0')).toBe(true)
    expect(comparison.colorDifferences.some((difference) => difference.type === 'additional' && difference.candidate.hex === '#c64b45')).toBe(true)
  })

  it('matches perceptually near colors instead of relying on exact HEX equality', () => {
    const candidate = image('candidate', [swatch('#090909', 0.5), swatch('#e0ff50', 0.325), swatch('#4890e0', 0.175)], primary.roles)
    const comparison = compareSeriesImage(primary, candidate)
    const nearBlack = comparison.colorDifferences.find((difference) => difference.type === 'shared' && difference.candidate.hex === '#090909')
    expect(nearBlack).toBeDefined()
    expect(seriesColorDistance('#080808', '#090909')).toBeLessThan(0.08)
  })

  it('finds the maximum one-to-one matches instead of taking a greedy shortcut', () => {
    const first = swatch('#a2a2a2', 0.5)
    const second = swatch('#bdbdbd', 0.5)
    const nearFirst = swatch('#aeaeae', 0.5)
    const alternateFirst = swatch('#909090', 0.5)
    const comparison = compareSeriesImage(
      image('primary', [first, second]),
      image('candidate', [nearFirst, alternateFirst]),
    )
    expect(comparison.colorDifferences.filter((difference) => difference.type === 'shared')).toHaveLength(2)
    expect(comparison.colorDifferences).toContainEqual(expect.objectContaining({
      type: 'shared',
      primary: first,
      candidate: alternateFirst,
    }))
    expect(comparison.colorDifferences).toContainEqual(expect.objectContaining({
      type: 'shared',
      primary: second,
      candidate: nearFirst,
    }))
  })

  it('reports only changed roles and clears them after independent correction', () => {
    const candidate = image('candidate', [black, green, blue], {
      ...primary.roles,
      accent: '#4890e0',
    })
    expect(compareSeriesImage(primary, candidate).roleDifferences).toHaveLength(1)
    const corrected = { ...candidate, roles: primary.roles }
    expect(compareSeriesImage(primary, corrected).roleDifferences).toEqual([])
  })

  it('reports a missing role instead of silently ignoring it', () => {
    const roles = { ...primary.roles }
    delete roles.accent
    const comparison = compareSeriesImage(primary, image('candidate', [black, green, blue], roles))
    expect(comparison.roleDifferences).toContainEqual({
      role: 'accent',
      primaryHex: '#e0ff50',
      candidateHex: null,
      distance: null,
    })
  })

  it('keeps only colors shared by every series member', () => {
    const second = image('second', [black, green], primary.roles)
    const third = image('third', [black, blue], primary.roles)
    const report = compareSeries([primary, second, third], 'primary')
    expect(report.sharedColors.map((color) => color.primaryHex)).toEqual(['#080808'])
    expect(report.sharedColors[0].shares).toEqual({ primary: 0.5, second: 0.5, third: 0.5 })
  })

  it('is deterministic and independent of input ordering', () => {
    const second = image('second', [swatch('#080808', 0.7), green, blue], primary.roles)
    const third = image('third', [black, green, blue], primary.roles)
    const first = compareSeries([primary, second, third], 'primary')
    const reordered = compareSeries([third, primary, second], 'primary')
    expect(reordered).toEqual(first)
    expect(compareSeries([primary, second, third], 'primary')).toEqual(first)
  })

  it('changes relative share deltas when the primary changes', () => {
    const candidate = image('candidate', [swatch('#080808', 0.7), green, blue], primary.roles)
    const forward = compareSeries([primary, candidate], 'primary').comparisons[0]
    const reverse = compareSeries([primary, candidate], 'candidate').comparisons[0]
    const forwardBlack = forward.colorDifferences.find((difference) => difference.type === 'shared' && difference.primary.hex === '#080808')
    const reverseBlack = reverse.colorDifferences.find((difference) => difference.type === 'shared' && difference.primary.hex === '#080808')
    expect(forwardBlack).toMatchObject({ shareDelta: 0.2 })
    expect(reverseBlack).toMatchObject({ shareDelta: -0.2 })
  })

  it('rejects invalid series definitions', () => {
    expect(() => compareSeries([primary], 'primary')).toThrow('between 2 and 6')
    expect(() => compareSeries([primary, primary], 'primary')).toThrow('unique')
    expect(() => compareSeries(Array.from({ length: 7 }, (_, index) => image(`image-${index}`, [black])), 'image-0')).toThrow('between 2 and 6')
    expect(() => compareSeries([primary, image('candidate', [black])], 'missing')).toThrow('Primary image')
  })
})
