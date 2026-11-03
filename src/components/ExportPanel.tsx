import { useState } from 'react'
import { toPng } from 'html-to-image'
import { createCssVariables, createDesignTokens, downloadBlob, downloadText } from '../lib/exporters'
import { createPaletteCard } from '../lib/paletteCard'
import type { ContrastReport } from '../domain/contrast'
import ContrastAudit from './ContrastAudit'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import type { ImageAnalysisMetadata } from '../lib/color/pipelineConfig'
import './ExportPanel.css'

type ExportPanelProps = {
  domain: DomainId
  assignments: RoleAssignments
  palette: PaletteSwatch[]
  analysis?: ImageAnalysisMetadata
  renderTarget: HTMLElement | null
  contrastReport: ContrastReport
}

export default function ExportPanel({ domain, assignments, palette, analysis, renderTarget, contrastReport }: ExportPanelProps) {
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')

  const exportCss = () => {
    downloadText(`palette-lab-${domain}.css`, createCssVariables(domain, assignments), 'text/css;charset=utf-8')
  }

  const exportJson = () => {
    downloadText(`palette-lab-${domain}.json`, createDesignTokens(domain, assignments, palette, analysis), 'application/json;charset=utf-8')
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

  const exportCard = async () => {
    setExporting('card'); setError('')
    try { downloadBlob(`palette-lab-${domain}-palette-card.png`, await createPaletteCard(domain, assignments, palette)) }
    catch (error) { setError(error instanceof Error ? error.message : '色板卡导出失败，请重试') }
    finally { setExporting('') }
  }

  return (
    <section className="export-panel" aria-labelledby="export-title">
      <div className="panel-heading">
        <span>05</span><h2 id="export-title">导出成果</h2><small>PRODUCTION OUTPUT</small>
      </div>
      <ContrastAudit report={contrastReport} className="export-audit" exporting />
      <div className="export-actions">
        <button onClick={exportCss}><strong>CSS</strong><span>网页语义变量</span><i>下载 .css</i></button>
        <button onClick={exportJson}><strong>JSON</strong><span>结构化设计令牌</span><i>下载 .json</i></button>
        <button onClick={() => void exportPng()} disabled={exporting === 'png'}>
          <strong>PNG</strong><span>当前场景预览图</span><i>{exporting === 'png' ? '正在生成…' : '下载 .png'}</i>
        </button>
        <button onClick={() => void exportCard()} disabled={exporting === 'card'}><strong>色板卡</strong><span>原色、HEX、占比与当前角色</span><i>{exporting === 'card' ? '正在生成…' : '下载 .png'}</i></button>
      </div>
      {error && <p className="export-error" role="alert">{error}</p>}
    </section>
  )
}
