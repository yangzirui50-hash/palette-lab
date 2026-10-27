import { useEffect, useRef, useState } from 'react'
import { fileToAiDataUrl } from '../lib/color/aiImage'
import type { AnalysisReport } from '../domain/analysis'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import type { RoleAssignments } from '../domain/assign'
import './AnalysisPanel.css'

type AnalysisPanelProps = {
  domain: DomainId
  sourceFile: File
  palette: PaletteSwatch[]
  assignments: RoleAssignments
  report: AnalysisReport | null
  onReportChange: (report: AnalysisReport | null) => void
}

export default function AnalysisPanel({ domain, sourceFile, palette, assignments, report, onReportChange }: AnalysisPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    requestId.current += 1
    controller.current?.abort()
    controller.current = null
    onReportChange(null)
    setLoading(false)
    setError('')
    return () => controller.current?.abort()
  }, [domain, assignments, sourceFile, onReportChange])

  const analyze = async () => {
    const currentRequest = ++requestId.current
    controller.current?.abort()
    const currentController = new AbortController()
    controller.current = currentController
    setLoading(true)
    setError('')
    try {
      const image = await fileToAiDataUrl(sourceFile)
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, domain, palette, assignments }),
        signal: currentController.signal,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? '分析失败，请重试')
      if (requestId.current === currentRequest) onReportChange(payload as AnalysisReport)
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      if (requestId.current === currentRequest) setError(reason instanceof Error ? reason.message : '分析服务暂时不可用')
    } finally {
      if (requestId.current === currentRequest) {
        controller.current = null
        setLoading(false)
      }
    }
  }

  return (
    <section className="analysis-panel" aria-labelledby="analysis-title">
      <div className="panel-heading">
        <span>05</span><h2 id="analysis-title">AI 美学分析</h2><small>MULTIMODAL EVIDENCE</small>
      </div>
      <div className="analysis-intro">
        <p>结合图像内容、色组和当前角色，生成有依据的设计建议。压缩副本只会在你点击后发送。</p>
        <button onClick={() => void analyze()} disabled={loading}>{loading ? '正在分析…' : '生成 AI 美学分析'}</button>
      </div>
      {error && <p className="analysis-error" role="alert">{error}</p>}
      {report && (
        <div className="analysis-report">
          <div className="analysis-summary"><small>ANALYSIS SUMMARY</small><h3>{report.summary}</h3><p>{report.scene}</p></div>
          <div className="analysis-facts">
            <div><small>视觉主体</small><p>{report.subjects.join('、')}</p></div>
            <div><small>构图</small><p>{report.composition}</p></div>
            <div><small>光线</small><p>{report.lighting}</p></div>
            <div><small>风格</small><p>{report.styleTags.join('、')}</p></div>
          </div>
          <div className="analysis-recommendations">
            <small>可执行建议</small>
            {report.recommendations.map((item, index) => (
              <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.rationale}</p><span>{item.action}</span></article>
            ))}
          </div>
          {report.uncertainties.length > 0 && <p className="analysis-uncertainty">不确定项：{report.uncertainties.join('；')}</p>}
          <p className="analysis-model">Provider: {report.provider} · Model: {report.model}</p>
        </div>
      )}
    </section>
  )
}
