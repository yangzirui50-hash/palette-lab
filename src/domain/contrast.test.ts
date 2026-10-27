import { describe, expect, it } from 'vitest'
import { contrastRatio, getContrastReport } from './contrast'
import { semanticFallbacks } from './assign'

describe('contrast checks', () => {
  it('calculates black and white contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#080808', '#080808')).toBeCloseTo(1, 5)
  })

  it('flags unreadable role assignments', () => {
    const report = getContrastReport('web-ui', {
      background: '#080808',
      surface: '#1b1b1b',
      textPrimary: '#080808',
      textMuted: '#a3a3a3',
      accent: '#dfff4f',
      success: semanticFallbacks.success,
      error: semanticFallbacks.error,
    })
    expect(report.issues.some((issue) => issue.pair === 'background/textPrimary')).toBe(true)
  })

  it('accepts readable semantic fallbacks', () => {
    const report = getContrastReport('web-ui', {
      background: semanticFallbacks.background,
      surface: semanticFallbacks.surface,
      textPrimary: semanticFallbacks.textPrimary,
      textMuted: semanticFallbacks.textMuted,
      accent: '#dfff4f',
      success: semanticFallbacks.success,
      error: semanticFallbacks.error,
    })
    expect(report.issues).toEqual([])
  })
})
