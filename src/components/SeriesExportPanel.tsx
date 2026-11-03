import { useState } from 'react'
import { createCssVariables, downloadText } from '../lib/exporters'
import { createSeriesReport, createSeriesTokens } from '../lib/seriesExporters'
import type { SeriesSourceAnalysis } from '../lib/seriesExporters'
import { downloadSeriesOverviewPng } from '../lib/seriesOverviewPng'
import type { ContrastReport } from '../domain/contrast'
import ContrastAudit from './ContrastAudit'
import type { RoleAssignments } from '../domain/assign'
import type { SeriesComparisonReport } from '../domain/series'
import type { UnifiedSeriesPalette } from '../domain/unify'

type SeriesExportPanelProps = {
  unified: UnifiedSeriesPalette
  assignments: RoleAssignments
  comparison: SeriesComparisonReport
  imageLabels: Record<string, string>
  contrastReport: ContrastReport
  sourceAnalysis?: SeriesSourceAnalysis
}

export default function SeriesExportPanel({ unified, assignments, comparison, imageLabels, contrastReport, sourceAnalysis }: SeriesExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const exportPng = async () => {
    setExporting(true)
    setError('')
    try {
      await downloadSeriesOverviewPng(unified, assignments, imageLabels)
    } catch (reason) {
      console.error('Series PNG export failed', reason)
      setError('系列总览图导出失败，请重试或先导出 CSS／JSON')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="series-export" aria-labelledby="series-export-title">
      <div className="panel-heading"><span>07</span><h3 id="series-export-title">导出系列成果</h3><small>PRODUCTION OUTPUT</small></div>
      <ContrastAudit report={contrastReport} className="series-export-audit" exporting />
      <div className="series-export-actions">
        <button onClick={() => downloadText(`palette-lab-series-${unified.strategy}.css`, createCssVariables(unified.domain, assignments), 'text/css;charset=utf-8')}><strong>CSS</strong><span>统一语义变量</span></button>
        <button onClick={() => downloadText(`palette-lab-series-${unified.strategy}.json`, createSeriesTokens(unified, assignments, comparison, sourceAnalysis), 'application/json;charset=utf-8')}><strong>JSON</strong><span>系列设计令牌</span></button>
        <button onClick={() => downloadText(`palette-lab-series-report-${unified.strategy}.json`, createSeriesReport(unified, assignments, comparison, sourceAnalysis), 'application/json;charset=utf-8')}><strong>报告</strong><span>差异与统一依据</span></button>
        <button onClick={() => void exportPng()} disabled={exporting}><strong>PNG</strong><span>{exporting ? '正在生成…' : '系列总览图'}</span></button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  )
}
