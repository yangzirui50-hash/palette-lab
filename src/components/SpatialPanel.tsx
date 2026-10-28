import { useEffect, useState } from 'react'
import { analyzePaletteSpatial } from '../lib/color/spatial'
import type { SpatialRegionEvidence } from '../lib/color/spatial'
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
  const [overlay, setOverlay] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void imageFileToSpatialData(sourceFile).then((data) => {
      if (!active) return
      const result = analyzePaletteSpatial(data.pixels, data.width, data.height, palette)
      setEvidence(result)
      onEvidenceChange?.(result)
      const salient = [...palette].sort((a, b) => b.oklch[1] - a.oklch[1])[0]
      setSelectedHex((current) => current || salient?.hex || palette[0]?.hex || '')
      setLoading(false)
    }).catch((reason: unknown) => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '空间分析失败')
      setLoading(false)
    })
    return () => { active = false }
  }, [sourceFile, palette, onEvidenceChange])

  useEffect(() => {
    if (!selectedHex) return
    let active = true
    void createSpatialOverlay(sourceFile, palette, selectedHex).then((url) => {
      if (active) setOverlay(url)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : '区域高亮失败')
    })
    return () => { active = false }
  }, [sourceFile, palette, selectedHex])

  const selected = evidence.find((region) => region.hex.toLowerCase() === selectedHex.toLowerCase())
  const vertical = selected ? selected.centroid.y < 0.34 ? '上方' : selected.centroid.y > 0.66 ? '下方' : '中部' : ''
  const horizontal = selected ? selected.centroid.x < 0.34 ? '左侧' : selected.centroid.x > 0.66 ? '右侧' : '中央' : ''

  return (
    <section className="spatial-panel" aria-labelledby="spatial-title">
      <div className="panel-heading"><span>03</span><h2 id="spatial-title">视觉重心与色彩地图</h2><small>SPATIAL EVIDENCE</small></div>
      <p className="spatial-intro">查看颜色的位置与连续区域。空间面积按缩略图最近色重分配，可能与聚类占比略有差异；指标不是美观评分。</p>
      <div className="spatial-layout">
        <div className="spatial-preview">
          {overlay ? <img src={overlay} alt={`原图中 ${selectedHex} 的颜色区域高亮`} /> : <p>{loading ? '正在分析空间分布…' : '等待区域高亮'}</p>}
        </div>
        <div className="spatial-swatches" aria-label="选择要高亮的颜色">
          {palette.map((color) => (
            <button key={color.hex} className={selectedHex === color.hex ? 'active' : ''} onClick={() => setSelectedHex(color.hex)} aria-pressed={selectedHex === color.hex}>
              <i style={{ backgroundColor: color.hex }} /><span>{color.hex}</span><small>{(color.share * 100).toFixed(1)}%</small>
            </button>
          ))}
        </div>
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
