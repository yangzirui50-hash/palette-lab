import { useEffect, useRef, useState } from 'react'
import { analyzePaletteSpatial, cropSpatialPixels } from '../lib/color/spatial'
import type { SpatialRegionEvidence, SpatialRoi } from '../lib/color/spatial'
import { createSpatialOverlay, imageFileToSpatialData } from '../lib/color/spatialOverlay'
import type { PaletteSwatch } from '../lib/color/extract'
import './SpatialPanel.css'

type SpatialPanelProps = {
  sourceFile: File
  palette: PaletteSwatch[]
  onEvidenceChange?: (evidence: SpatialRegionEvidence[]) => void
}

export default function SpatialPanel({ sourceFile, palette, onEvidenceChange }: SpatialPanelProps) {
  const [evidence, setEvidence] = useState<SpatialRegionEvidence[]>([])
  const [selectedHex, setSelectedHex] = useState('')
  const [mode, setMode] = useState<'largest' | 'all'>('largest')
  const [overlay, setOverlay] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roi, setRoi] = useState<SpatialRoi | null>(null)
  const [selecting, setSelecting] = useState<'armed' | 'dragging' | null>(null)
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    void imageFileToSpatialData(sourceFile).then((data) => {
      if (!active) return
      const crop = roi ? cropSpatialPixels(data.pixels, data.width, data.height, roi) : null
      const result = analyzePaletteSpatial(crop?.pixels ?? data.pixels, crop?.width ?? data.width, crop?.height ?? data.height, palette)
      setEvidence(result)
      // A cropped region must not be presented to AI as evidence about the full image.
      onEvidenceChange?.(roi ? [] : result)
      const salient = [...palette].sort((a, b) => b.oklch[1] - a.oklch[1])[0]
      setSelectedHex((current) => current || salient?.hex || palette[0]?.hex || '')
      setLoading(false)
    }).catch((reason: unknown) => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '空间分析失败')
      setLoading(false)
    })
    return () => { active = false }
  }, [sourceFile, palette, onEvidenceChange, roi])

  useEffect(() => {
    if (!selectedHex) return
    let active = true
    void createSpatialOverlay(sourceFile, palette, selectedHex, 320, mode, roi ?? undefined).then((url) => {
      if (active) setOverlay(url)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : '区域高亮失败')
    })
    return () => { active = false }
  }, [sourceFile, palette, selectedHex, mode, roi])

  const selected = evidence.find((region) => region.hex.toLowerCase() === selectedHex.toLowerCase())
  const vertical = selected ? selected.centroid.y < 0.34 ? '上方' : selected.centroid.y > 0.66 ? '下方' : '中部' : ''
  const horizontal = selected ? selected.centroid.x < 0.34 ? '左侧' : selected.centroid.x > 0.66 ? '右侧' : '中央' : ''

  const pointFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    }
  }

  const startSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (selecting !== 'armed') return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = pointFromEvent(event)
    startPoint.current = point
    setSelecting('dragging')
    setRoi({ x: point.x, y: point.y, width: 0, height: 0 })
  }

  const updateSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (selecting !== 'dragging' || !startPoint.current) return
    const point = pointFromEvent(event)
    setRoi({
      x: Math.min(startPoint.current.x, point.x),
      y: Math.min(startPoint.current.y, point.y),
      width: Math.abs(point.x - startPoint.current.x),
      height: Math.abs(point.y - startPoint.current.y),
    })
  }

  const finishSelection = () => {
    if (selecting === 'dragging') setSelecting(roi && roi.width > 0.02 && roi.height > 0.02 ? null : 'armed')
  }

  return (
    <section className="spatial-panel" aria-labelledby="spatial-title">
      <div className="panel-heading"><span>03</span><h2 id="spatial-title">视觉重心与色彩地图</h2><small>SPATIAL EVIDENCE</small></div>
      <p className="spatial-intro">查看颜色的位置与连续区域。空间面积按缩略图最近色重分配，可能与聚类占比略有差异；指标不是美观评分。</p>
      <div className="spatial-roi-actions">
        <button onClick={() => {
          if (roi) setRoi(null)
          setSelecting(selecting ? null : 'armed')
        }}>{roi ? '重新框选' : selecting ? '取消框选' : '框选分析区域'}</button>
        {roi && <button onClick={() => { setRoi(null); setSelecting(null) }}>清除框选</button>}
        <span>{selecting ? '请在图片上拖动框选' : '框选后只分析该区域，避免其他物体干扰'}</span>
      </div>
      <div className="spatial-layout">
        <div className={`spatial-preview ${selecting ? 'selecting' : ''}`}>
          {overlay ? (
            <div
              ref={previewRef}
              className="spatial-image-stage"
              onPointerDown={startSelection}
              onPointerMove={updateSelection}
              onPointerUp={finishSelection}
              onPointerCancel={finishSelection}
            >
              <img src={overlay} alt={`原图中 ${selectedHex} 的颜色区域高亮`} />
              {roi && <div className="spatial-roi" style={{ left: `${roi.x * 100}%`, top: `${roi.y * 100}%`, width: `${roi.width * 100}%`, height: `${roi.height * 100}%` }} />}
            </div>
          ) : <p>{loading ? '正在分析空间分布…' : '等待区域高亮'}</p>}
        </div>
        <div className="spatial-swatches" aria-label="选择要高亮的颜色">
          {palette.map((color) => (
            <button key={color.hex} className={selectedHex === color.hex ? 'active' : ''} onClick={() => setSelectedHex(color.hex)} aria-pressed={selectedHex === color.hex}>
              <i style={{ backgroundColor: color.hex }} /><span>{color.hex}</span><small>{(color.share * 100).toFixed(1)}%</small>
            </button>
          ))}
        </div>
      </div>
      <div className="spatial-mode">
        <button onClick={() => setMode(mode === 'largest' ? 'all' : 'largest')} aria-pressed={mode === 'all'}>
          {mode === 'largest' ? '仅最大连续区域' : '全部近似色区域'}
        </button>
        <span>近似色区域，不是物体分割；相同颜色可能属于不同物体。</span>
      </div>
      {selected && (
        <div className="spatial-facts" aria-live="polite">
          <div><small>主要位置</small><strong>{vertical} · {horizontal}</strong></div>
          <div><small>实际面积</small><strong>{(selected.share * 100).toFixed(1)}%</strong></div>
          <div><small>中心区域占比</small><strong>{(selected.centerShare * 100).toFixed(1)}%</strong></div>
          <div><small>边缘区域占比</small><strong>{(selected.edgeShare * 100).toFixed(1)}%</strong></div>
          <div><small>最大连续区域</small><strong>{(selected.largestComponentShare * 100).toFixed(1)}%</strong></div>
          <div><small>显著区域数量</small><strong>{selected.componentCount}</strong></div>
          <div><small>平均色彩分离度</small><strong>{selected.meanColorSeparation.toFixed(3)}</strong></div>
        </div>
      )}
      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  )
}
