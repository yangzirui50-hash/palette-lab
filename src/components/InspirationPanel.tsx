import { useEffect, useRef, useState } from 'react'
import { fileToAiDataUrl } from '../lib/color/aiImage'
import type { AnalysisReport } from '../domain/analysis'
import type { ReferenceComparison, ReferencePhoto } from '../domain/inspiration'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import type { RoleAssignments } from '../domain/assign'
import './InspirationPanel.css'

type InspirationPanelProps = {
  analysis: AnalysisReport | null
  domain: DomainId
  sourceFile: File
  palette: PaletteSwatch[]
  assignments: RoleAssignments
}

type InspirationResponse = {
  query: string
  source: string
  photos: ReferencePhoto[]
  comparison: ReferenceComparison | null
  comparisonError: string | null
}

export default function InspirationPanel({ analysis, domain, sourceFile, palette, assignments }: InspirationPanelProps) {
  const [result, setResult] = useState<InspirationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    requestId.current += 1
    controller.current?.abort()
    controller.current = null
    setResult(null)
    setLoading(false)
    setError('')
    return () => controller.current?.abort()
  }, [domain, sourceFile, analysis])

  const search = async () => {
    if (!analysis) return
    const currentRequest = ++requestId.current
    controller.current?.abort()
    const currentController = new AbortController()
    controller.current = currentController
    setLoading(true)
    setError('')
    try {
      const image = await fileToAiDataUrl(sourceFile)
      const response = await fetch('/api/inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, domain, palette, assignments, analysis }),
        signal: currentController.signal,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? '参考图检索失败')
      if (requestId.current === currentRequest) setResult(payload as InspirationResponse)
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      if (requestId.current === currentRequest) setError(reason instanceof Error ? reason.message : '参考图服务暂时不可用')
    } finally {
      if (requestId.current === currentRequest) {
        controller.current = null
        setLoading(false)
      }
    }
  }

  return (
    <section className="inspiration-panel" aria-labelledby="inspiration-title">
      <div className="panel-heading">
        <span>06</span><h2 id="inspiration-title">参考与比较</h2><small>CURATED INSPIRATION</small>
      </div>
      <div className="inspiration-intro">
        <p>{analysis ? '基于真实分析报告检索参考图，再比较配色结构、可借鉴点和不应照搬的部分。' : '先完成 AI 美学分析，再生成与图像内容相关的联网参考。'}</p>
        <button onClick={() => void search()} disabled={!analysis || loading}>{loading ? '正在检索与比较…' : '生成参考图与对比'}</button>
      </div>
      {error && <p className="inspiration-error" role="alert">{error}</p>}
      {result && (
        <div className="inspiration-results">
          <div className="inspiration-query"><small>SEARCH QUERY</small><p>{result.query}</p><span>来源：{result.source === 'unsplash' ? 'Unsplash' : 'Mock / 测试素材'}</span></div>
          <div className="reference-grid">
            {result.photos.map((photo) => {
              const comparison = result.comparison?.rankings.find((item) => item.photoId === photo.id)
              return (
                <article className="reference-card" key={photo.id}>
                  <a href={photo.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开参考图：${photo.alt}`}>
                    <img src={photo.thumbnail} alt={photo.alt} loading="lazy" />
                  </a>
                  <div className="reference-copy">
                    <a href={photo.photographerUrl} target="_blank" rel="noreferrer">{photo.photographer}</a>
                    {comparison && <><strong>{comparison.fit === 'strong' ? '强匹配' : comparison.fit === 'moderate' ? '可参考' : '弱匹配'}</strong><p>{comparison.rationale}</p><small>借鉴：{comparison.borrow}</small><small>避免：{comparison.avoid}</small></>}
                  </div>
                </article>
              )
            })}
          </div>
          {result.comparison && <p className="comparison-summary">{result.comparison.summary}</p>}
          {result.comparisonError && <p className="inspiration-error">参考图已返回，但 AI 对比暂时失败，请稍后重试。</p>}
        </div>
      )}
    </section>
  )
}
