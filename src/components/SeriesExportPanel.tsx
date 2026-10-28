import { useState } from 'react'
import { createCssVariables, downloadText } from '../lib/exporters'
import { createSeriesReport, createSeriesTokens } from '../lib/seriesExporters'
import { downloadSeriesOverviewPng } from '../lib/seriesOverviewPng'
import { getContrastReport } from '../domain/contrast'
import type { RoleAssignments } from '../domain/assign'
import type { SeriesComparisonReport } from '../domain/series'
import type { UnifiedSeriesPalette } from '../domain/unify'

type SeriesExportPanelProps = {
  unified: UnifiedSeriesPalette
  assignments: RoleAssignments
  comparison: SeriesComparisonReport
  imageLabels: Record<string, string>
}

export default function SeriesExportPanel({ unified, assignments, comparison, imageLabels }: SeriesExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const audit = getContrastReport(unified.domain, assignments)

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
      <div className="panel-heading"><span>06</span><h3 id="series-export-title">导出系列成果</h3><small>PRODUCTION OUTPUT</small></div>
      <p className={`series-export-audit ${audit.issues.length > 0 ? 'has-issues' : ''}`}>
        {audit.issues.length === 0 ? `✓ ${audit.checked} 组关键对比检查通过` : `⚠ ${audit.issues.length} 组对比不足，仍可导出但建议先修正`}
      </p>
      <div className="series-export-actions">
        <button onClick={() => downloadText(`palette-lab-series-${unified.strategy}.css`, createCssVariables(unified.domain, assignments), 'text/css;charset=utf-8')}><strong>CSS</strong><span>统一语义变量</span></button>
        <button onClick={() => downloadText(`palette-lab-series-${unified.strategy}.json`, createSeriesTokens(unified, assignments, comparison), 'application/json;charset=utf-8')}><strong>JSON</strong><span>系列设计令牌</span></button>
        <button onClick={() => downloadText(`palette-lab-series-report-${unified.strategy}.json`, createSeriesReport(unified, assignments, comparison), 'application/json;charset=utf-8')}><strong>报告</strong><span>差异与统一依据</span></button>
        <button onClick={() => void exportPng()} disabled={exporting}><strong>PNG</strong><span>{exporting ? '正在生成…' : '系列总览图'}</span></button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  )
}
