import { useEffect, useRef, useState } from 'react'
import { fileToAiDataUrl } from '../lib/color/aiImage'
import { analysisReportSchema } from '../domain/analysis'
import type { AnalysisReport } from '../domain/analysis'
import { reportContextKey } from '../lib/project/model'
import type { ReportContext, ReportSnapshot } from '../lib/project/model'
import { sourceCoordinates } from '../lib/color/coordinates'
import './AnalysisPanel.css'

type AnalysisPanelProps = {
  sourceFile: File
  context: ReportContext
  snapshots: ReportSnapshot[]
  selectedSnapshotId: string
  onSelectSnapshot: (id: string) => void
  onReportChange: (report: AnalysisReport, context: ReportContext) => void
}

export default function AnalysisPanel({ sourceFile, context, snapshots, selectedSnapshotId, onSelectSnapshot, onReportChange }: AnalysisPanelProps) {
  const { domain } = context
  const snapshot = snapshots.find(snapshot => snapshot.id === selectedSnapshotId) ?? snapshots.at(-1)
  const report = snapshot?.report ?? null
  const outdated = snapshot ? reportContextKey(snapshot.context) !== reportContextKey(context) : false
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    requestId.current += 1
    controller.current?.abort()
    controller.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- A source/domain change aborts external work and clears its transient status once.
    setLoading(false)
    setError('')
    return () => controller.current?.abort()
  }, [domain, sourceFile])

  const analyze = async () => {
    const currentRequest = ++requestId.current
    const captured = structuredClone(context)
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
        body: JSON.stringify({ image, domain: captured.domain, palette: captured.palette, assignments: captured.assignments,
          spatial: sourceCoordinates(captured.spatialEvidence, captured.roi),
          spatialScope: captured.roi ? { area: 'roi', coordinates: 'source', roi: captured.roi } : { area: 'full', coordinates: 'source' },
        }),
        signal: currentController.signal,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? '分析失败，请重试')
      if (requestId.current === currentRequest) {
        onReportChange(analysisReportSchema.parse(payload), captured)
      }
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
        <span>07</span><h2 id="analysis-title">AI 美学分析</h2><small>MULTIMODAL EVIDENCE</small>
      </div>
      <div className="analysis-intro">
        <p>结合图像内容、色组和当前角色，生成有依据的设计建议。压缩副本只会在你点击后发送。</p>
        <button onClick={() => void analyze()} disabled={loading}>{loading ? '正在分析…' : '生成 AI 美学分析'}</button>
      </div>
      {error && <p className="analysis-error" role="alert">{error}</p>}
      {snapshot && <div className="analysis-snapshot-note" data-snapshot-state={outdated ? 'historical' : 'current'}>
        <label>已保存的分析 <select aria-label="选择分析快照" value={snapshot.id} onChange={event => onSelectSnapshot(event.target.value)}>
          {snapshots.map(item => <option value={item.id} key={item.id}>{new Date(item.createdAt).toLocaleString()} · {item.context.roi ? '原图＋局部色彩证据' : '原图＋全图色彩证据'}</option>)}
        </select></label>
        <p>{outdated ? '当前角色或区域已变化；这份报告对应之前的输入，已保留。需要新建议时请重新分析。' : '这份报告对应当前输入，已保存在本机项目中。'}</p>
      </div>}
      {report && (
        <div className="analysis-report">
          <div className="analysis-summary">
            <div className="analysis-summary-top"><small>ANALYSIS SUMMARY</small><span>{report.provider} · {report.model}</span></div>
            <h3>{report.summary}</h3>
            <p>{report.scene}</p>
          </div>
          <div className="analysis-section-label">视觉证据</div>
          <div className="analysis-facts">
            <div><small>01 · 视觉主体</small><p>{report.subjects.join('、')}</p></div>
            <div><small>02 · 构图关系</small><p>{report.composition}</p></div>
            <div><small>03 · 光线与明暗</small><p>{report.lighting}</p></div>
            <div><small>04 · 风格特征</small><p>{report.styleTags.join('、')}</p></div>
          </div>
          {report.paletteRoles.length > 0 && (
            <div className="analysis-role-evidence">
              <div className="analysis-section-label">角色依据</div>
              <div className="analysis-role-list">
                {report.paletteRoles.map((item, index) => (
                  <article key={`${item.role}-${index}`}><strong>{item.role}</strong><p>{item.rationale}</p></article>
                ))}
              </div>
            </div>
          )}
          <div className="analysis-recommendations">
            <div className="analysis-section-label">可执行建议</div>
            <div className="analysis-recommendation-grid">
              {report.recommendations.map((item, index) => (
                <article key={`${item.title}-${index}`}>
                  <span className="recommendation-index">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                  <p>{item.rationale}</p>
                  <div><small>建议行动</small><span>{item.action}</span></div>
                </article>
              ))}
            </div>
          </div>
          {report.uncertainties.length > 0 && <aside className="analysis-uncertainty"><strong>不确定性</strong><p>{report.uncertainties.join('；')}</p></aside>}
        </div>
      )}
    </section>
  )
}
