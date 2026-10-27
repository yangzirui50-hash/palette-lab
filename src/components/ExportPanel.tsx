import { useState } from 'react'
import { toPng } from 'html-to-image'
import { createCssVariables, createDesignTokens, downloadText } from '../lib/exporters'
import { getContrastReport } from '../domain/contrast'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import './ExportPanel.css'

type ExportPanelProps = {
  domain: DomainId
  assignments: RoleAssignments
  palette: PaletteSwatch[]
  renderTarget: HTMLElement | null
}

export default function ExportPanel({ domain, assignments, palette, renderTarget }: ExportPanelProps) {
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')
  const report = getContrastReport(domain, assignments)

  const exportCss = () => {
    downloadText(`palette-lab-${domain}.css`, createCssVariables(domain, assignments), 'text/css;charset=utf-8')
  }

  const exportJson = () => {
    downloadText(`palette-lab-${domain}.json`, createDesignTokens(domain, assignments, palette), 'application/json;charset=utf-8')
  }

  const exportPng = async () => {
    if (!renderTarget) {
      setError('预览尚未准备好，请稍后重试')
      return
    }
    setExporting('png')
    setError('')
    try {
      const dataUrl = await toPng(renderTarget, { pixelRatio: 2, cacheBust: true })
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = `palette-lab-${domain}.png`
      anchor.click()
    } catch {
      setError('PNG 导出失败，请重试或先导出 CSS／JSON')
    } finally {
      setExporting('')
    }
  }

  return (
    <section className="export-panel" aria-labelledby="export-title">
      <div className="panel-heading">
        <span>05</span><h2 id="export-title">导出成果</h2><small>PRODUCTION OUTPUT</small>
      </div>
      <div className={`export-audit ${report.issues.length > 0 ? 'has-issues' : ''}`}>
        {report.issues.length === 0
          ? `✓ ${report.checked} 组关键对比检查通过，可以导出。`
          : `⚠ 当前有 ${report.issues.length} 组对比不足。文件仍可导出，但建议先修正。`}
      </div>
      <div className="export-actions">
        <button onClick={exportCss}><strong>CSS</strong><span>网页语义变量</span><i>下载 .css</i></button>
        <button onClick={exportJson}><strong>JSON</strong><span>结构化设计令牌</span><i>下载 .json</i></button>
        <button onClick={() => void exportPng()} disabled={exporting === 'png'}>
          <strong>PNG</strong><span>当前场景预览图</span><i>{exporting === 'png' ? '正在生成…' : '下载 .png'}</i>
        </button>
      </div>
      {error && <p className="export-error" role="alert">{error}</p>}
    </section>
  )
}
