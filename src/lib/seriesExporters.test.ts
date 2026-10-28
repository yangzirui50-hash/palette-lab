import { describe, expect, it } from 'vitest'
import { createSeriesReport, createSeriesTokens } from './seriesExporters'
import type { UnifiedSeriesPalette } from '../domain/unify'
import type { SeriesComparisonReport } from '../domain/series'

const unified: UnifiedSeriesPalette = {
  strategy: 'preserve-accents',
  domain: 'web-ui',
  roles: { background: '#080808', accent: '#e0ff50' },
  palette: [],
  exceptions: { candidate: { accent: '#4890e0' } },
  rationale: '基础角色跟随主图，每张作品保留自己的强调色与锁定角色。',
}

const comparison: SeriesComparisonReport = {
  primaryId: 'primary',
  sharedColors: [],
  comparisons: [],
}

describe('series export adapters', () => {
  it('exports edited roles, strategy and per-image exceptions as versioned tokens', () => {
    const payload = JSON.parse(createSeriesTokens(unified, { ...unified.roles, accent: '#ffffff' }, comparison))
    expect(payload.$schema).toBe('./schemas/series-tokens/v1.json')
    expect(payload.schemaVersion).toBe('1.0.0')
    expect(payload.roles.accent).toBe('#ffffff')
    expect(payload.exceptions.candidate.accent).toBe('#4890e0')
    expect(payload.strategy).toBe('preserve-accents')
  })

  it('exports the diagnostic rationale separately from token output', () => {
    const payload = JSON.parse(createSeriesReport(unified, unified.roles, comparison))
    expect(payload.$schema).toBe('./schemas/series-report/v1.json')
    expect(payload.unifiedRoles).toEqual(unified.roles)
    expect(payload.rationale).toContain('保留自己的强调色')
    expect(payload.comparison.primaryId).toBe('primary')
  })
})
