import type { RoleAssignments } from '../domain/assign'
import type { SeriesComparisonReport } from '../domain/series'
import type { UnifiedSeriesPalette } from '../domain/unify'

export function createSeriesTokens(unified: UnifiedSeriesPalette, assignments: RoleAssignments, comparison: SeriesComparisonReport) {
  return JSON.stringify({
    $schema: './schemas/series-tokens/v1.json',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    domain: unified.domain,
    strategy: unified.strategy,
    rationale: unified.rationale,
    roles: assignments,
    palette: unified.palette.map((color) => ({
      hex: color.hex,
      share: Number(color.share.toFixed(6)),
      oklch: color.oklch.map((value) => Number(value.toFixed(6))),
    })),
    exceptions: unified.exceptions,
    comparison,
  }, null, 2)
}

export function createSeriesReport(unified: UnifiedSeriesPalette, assignments: RoleAssignments, comparison: SeriesComparisonReport) {
  return JSON.stringify({
    $schema: './schemas/series-report/v1.json',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    domain: unified.domain,
    strategy: unified.strategy,
    rationale: unified.rationale,
    unifiedRoles: assignments,
    exceptions: unified.exceptions,
    comparison,
  }, null, 2)
}
