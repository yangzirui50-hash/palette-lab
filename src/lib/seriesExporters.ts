import type { RoleAssignments } from '../domain/assign'
import type { SeriesComparisonReport } from '../domain/series'
import type { UnifiedSeriesPalette } from '../domain/unify'
import type { ImageAnalysisMetadata } from './color/pipelineConfig'
import { schemaUrl } from './schemaUrls'

export type SeriesSourceAnalysis = { id: string; label: string; analysis: ImageAnalysisMetadata }[]

export function createSeriesTokens(unified: UnifiedSeriesPalette, assignments: RoleAssignments, comparison: SeriesComparisonReport, sourceAnalysis?: SeriesSourceAnalysis) {
  return JSON.stringify({
    $schema: schemaUrl('series-tokens'),
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
    sourceAnalysis,
  }, null, 2)
}

export function createSeriesReport(unified: UnifiedSeriesPalette, assignments: RoleAssignments, comparison: SeriesComparisonReport, sourceAnalysis?: SeriesSourceAnalysis) {
  return JSON.stringify({
    $schema: schemaUrl('series-report'),
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    domain: unified.domain,
    strategy: unified.strategy,
    rationale: unified.rationale,
    unifiedRoles: assignments,
    exceptions: unified.exceptions,
    comparison,
    sourceAnalysis,
  }, null, 2)
}
