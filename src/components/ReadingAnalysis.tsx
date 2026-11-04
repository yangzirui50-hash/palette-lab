import { useEffect, useRef, useState } from 'react'
import { READING_TASK, readingResultSchema } from '../domain/reading'
import { ColorAnalysisClient } from '../lib/color/analysisClient'
import type { FocusMeasurements } from '../lib/color/analysisClient'
import { fileToAiDataUrl } from '../lib/color/aiImage'
import type { ReadingSnapshot } from '../lib/project/model'
import WholeImageReadingPanel from './WholeImageReadingPanel'

export default function ReadingAnalysis({ sourceFile, sourceId, sourceUrl, snapshots, onResult }: {
  sourceFile: File; sourceId: string; sourceUrl: string; snapshots: ReadingSnapshot[]; onResult: (snapshot: ReadingSnapshot) => void
}) {
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [selected, setSelected] = useState('')
  const requestId = useRef(0), controller = useRef<AbortController | null>(null), client = useRef(new ColorAnalysisClient())
  const measured = useRef<{ file: File; value: FocusMeasurements } | null>(null)
  const snapshot = snapshots.find(record => record.id === selected) ?? snapshots.at(-1)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Source replacement cancels external work and clears its transient status once.
    requestId.current++; controller.current?.abort(); client.current.cancel(); measured.current = null; setLoading(false); setError('')
    const worker = client.current
    return () => { controller.current?.abort(); worker.cancel() }
  }, [sourceFile, sourceId])
  const analyze = async () => {
    const current = ++requestId.current; controller.current?.abort(); const abort = new AbortController(); controller.current = abort
    setLoading(true); setError('')
    try {
      const [image, measurements] = await Promise.all([fileToAiDataUrl(sourceFile), measured.current?.file === sourceFile ? Promise.resolve(measured.current.value) : client.current.run<FocusMeasurements>({ kind: 'focus-input', file: sourceFile })])
      if (abort.signal.aborted || current !== requestId.current) return
      measured.current = { file: sourceFile, value: measurements }
      const response = await fetch('/api/reading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: READING_TASK, image, measurements }), signal: abort.signal })
      const payload = await response.json().catch(() => { throw Error('暂时无法读取整体解读，请稍后重试。') })
      if (!response.ok) throw Error(payload.message ?? '整体解读暂未完成，请稍后重试。')
      const checked = readingResultSchema.safeParse(payload)
      if (!checked.success) throw Error('AI 整体解读未通过格式检查，请重试。')
      if (abort.signal.aborted || current !== requestId.current) return
      const next = { ...checked.data, id: crypto.randomUUID(), sourceId, createdAt: new Date().toISOString() }
      onResult(next); setSelected(next.id)
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      if (current === requestId.current && !abort.signal.aborted) setError(reason instanceof TypeError ? '网络连接未完成，请稍后重试。' : reason instanceof Error ? reason.message : '整体解读暂未完成。')
    } finally { if (current === requestId.current && !abort.signal.aborted) setLoading(false) }
  }
  return <div className="reading-analysis" aria-busy={loading}>
    <div className="attention-view-control"><button type="button" disabled={loading} onClick={() => void analyze()}>{loading ? '正在解读整体…' : snapshot ? '重新解读原图' : '生成整体解读'}</button><span>点击后发送压缩图片至 AI；取色与编辑可继续。</span></div>
    {error && <p role="alert">{error}{snapshot ? ' 当前仍保留上次的解读。' : ''}</p>}
    {snapshots.length > 1 && <label className="reading-provenance">整体解读记录 <select aria-label="选择整体解读记录" value={snapshot?.id ?? ''} onChange={event => setSelected(event.target.value)}>{snapshots.map(record => <option key={record.id} value={record.id}>{new Date(record.createdAt).toLocaleString()} · {record.model}</option>)}</select></label>}
    {snapshot ? <WholeImageReadingPanel key={snapshot.id} reading={snapshot.reading} sourceUrl={sourceUrl} provider={snapshot.provider} model={snapshot.model} createdAt={snapshot.createdAt}/> : <p className="spatial-intro" data-reading-status="not-analyzed">尚未解读原图。生成后先看整体构图与氛围，局部线索按需查看。</p>}
  </div>
}
