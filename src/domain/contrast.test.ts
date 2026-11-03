import { describe, expect, it } from 'vitest'
import { contrastRatio, getContrastReport } from './contrast'
import { semanticFallbacks } from './assign'

describe('contrast checks', () => {
  const readableRoles = {
    background: '#000000', surface: '#000000', textPrimary: '#ffffff',
    textMuted: '#ffffff', accent: '#ffffff', success: '#ffffff', error: '#ffffff',
  }

  it('rejects a normal-size muted label that passes 3:1 but fails 4.5:1', () => {
    const report = getContrastReport('web-ui', { ...readableRoles, textMuted: '#686868' })
    expect(report.issues.filter(issue => issue.pair.endsWith('/textMuted'))).toHaveLength(2)
    expect(report.issues[0].threshold).toBe(4.5)
  })

  it('checks small colored success and error text at the normal text threshold', () => {
    const report = getContrastReport('web-ui', { ...readableRoles, success: '#686868', error: '#686868' })
    expect(report.issues.map(issue => issue.pair)).toEqual(['surface/success', 'surface/error'])
    expect(report.issues.every(issue => issue.threshold === 4.5)).toBe(true)
  })

  it('does not claim any checks passed when assignments are missing', () => {
    expect(getContrastReport('web-ui', {})).toMatchObject({ checked: 0, passed: 0, total: 7, status: 'incomplete' })
  })

  it('counts only evaluable pairs and retains missing-pair evidence', () => {
    const report = getContrastReport('web-ui', { background: '#000000', textPrimary: '#ffffff' })
    expect(report).toMatchObject({ checked: 1, passed: 1, total: 7, status: 'incomplete' })
    expect(report.checks.filter(check => check.status === 'unexamined')).toHaveLength(6)
  })

  it('treats invalid colors as unexamined instead of throwing or passing', () => {
    const report = getContrastReport('web-ui', { ...readableRoles, textMuted: '#not-a-color' })
    expect(report).toMatchObject({ checked: 5, passed: 5, status: 'incomplete' })
    expect(report.checks.filter(check => check.status === 'unexamined')).toHaveLength(2)
  })

  it('uses the unrounded ratio near the text threshold', () => {
    expect(getContrastReport('web-ui', { ...readableRoles, textMuted: '#747474' }).issues).toHaveLength(2)
    expect(getContrastReport('web-ui', { ...readableRoles, textMuted: '#757575' }).issues).toHaveLength(0)
  })

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

  it('reports small status text failures in the existing semantic fallbacks', () => {
    const report = getContrastReport('web-ui', {
      background: semanticFallbacks.background,
      surface: semanticFallbacks.surface,
      textPrimary: semanticFallbacks.textPrimary,
      textMuted: semanticFallbacks.textMuted,
      accent: '#dfff4f',
      success: semanticFallbacks.success,
      error: semanticFallbacks.error,
    })
    expect(report.issues.map(issue => issue.pair)).toEqual(['surface/success', 'surface/error'])
    expect(report).toMatchObject({ checked: 7, passed: 5, status: 'failed' })
  })

  it('passes only when every declared pair has a readable valid assignment', () => {
    expect(getContrastReport('web-ui', readableRoles)).toMatchObject({ issues: [], checked: 7, passed: 7, total: 7, status: 'passed' })
  })
})
