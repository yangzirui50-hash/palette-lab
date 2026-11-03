import { useEffect, useRef, useState } from 'react'
import type { PaletteDistribution } from '../lib/color/distribution'
import type { SpatialRegionEvidence, SpatialRoi } from '../lib/color/spatial'
import { ColorAnalysisClient } from '../lib/color/analysisClient'
import type { SpatialResult } from '../lib/color/analysisClient'
import type { SpatialViews } from '../lib/color/spatialOverlay'
import { analyzePaletteDiscrimination } from '../lib/color/metrics'
import type { PaletteSwatch } from '../lib/color/extract'
import './SpatialPanel.css'

type SpatialPanelProps = {
  sourceFile: File
  palette: PaletteSwatch[]
  onEvidenceChange?: (evidence: SpatialRegionEvidence[]) => void
  roi?: SpatialRoi | null
  onRoiChange?: (roi: SpatialRoi | null) => void
}

export default function SpatialPanel({ sourceFile, palette, onEvidenceChange, roi: controlledRoi, onRoiChange }: SpatialPanelProps) {
  const [evidence, setEvidence] = useState<SpatialRegionEvidence[]>([])
  const [distributions, setDistributions] = useState<PaletteDistribution[]>([])
  const [attentionResult, setAttentionResult] = useState<Pick<SpatialResult, 'attention' | 'attentionUrl'> | null>(null)
  const client = useRef(new ColorAnalysisClient())
  const [analysisSize, setAnalysisSize] = useState({ width: 0, height: 0 })
  const [completedAnalysisKey, setCompletedAnalysisKey] = useState('')
  const [unassignedShare, setUnassignedShare] = useState(0)
  const [localPalette, setLocalPalette] = useState<PaletteSwatch[]>([])
  const [selectedHex, setSelectedHex] = useState('')
  const [viewMode, setViewMode] = useState<'regions' | 'distribution'>('regions')
  const [mode, setMode] = useState<'largest' | 'all'>('all')
  const [overlay, setOverlay] = useState({ url: '', detailUrl: '', key: '' })
  const [error, setError] = useState('')
  const [internalRoi, setInternalRoi] = useState<SpatialRoi | null>(null)
  const roi = controlledRoi === undefined ? internalRoi : controlledRoi
  const setRoi = (next: SpatialRoi | null) => {
    if (controlledRoi === undefined) setInternalRoi(next)
    onRoiChange?.(next)
  }
  const [draftRoi, setDraftRoi] = useState<SpatialRoi | null>(null)
  const [selecting, setSelecting] = useState<'armed' | 'dragging' | null>(null)
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const activePalette = roi ? localPalette : palette
  const analysisKey = [
    `${sourceFile.name}:${sourceFile.lastModified}:${sourceFile.size}`,
    palette.map((color) => color.hex).join(','),
    roi ? `${roi.x},${roi.y},${roi.width},${roi.height}` : 'full',
  ].join('|')
  const loading = completedAnalysisKey !== analysisKey && !error
  const overlayKey = [
    `${sourceFile.name}:${sourceFile.lastModified}:${sourceFile.size}`,
    viewMode,
    mode,
    selectedHex,
    activePalette.map((color) => color.hex).join(','),
    roi ? `${roi.x},${roi.y},${roi.width},${roi.height}` : 'full',
  ].join('|')

  useEffect(() => {
    let active = true
    const worker = client.current
    void worker.run<SpatialResult>({ kind: 'spatial', file: sourceFile, palette, roi: roi ?? undefined }).then((result) => {
      if (!active) return
      const nextPalette = result.palette
      setLocalPalette(roi ? nextPalette : [])
      setEvidence(result.regions)
      setUnassignedShare(result.unassignedShare)
      setDistributions(result.distributions)
      setAttentionResult({ attention: result.attention, attentionUrl: result.attentionUrl })
      setAnalysisSize({ width: result.width, height: result.height })
      setCompletedAnalysisKey(analysisKey)
      // A cropped region must not be presented to AI as evidence about the full image.
      onEvidenceChange?.(roi ? [] : result.regions)
      const salient = [...nextPalette].sort((a, b) => b.oklch[1] - a.oklch[1])[0]
      const preferred = roi ? nextPalette[0] : salient || nextPalette[0]
      setSelectedHex((current) => roi
        ? preferred?.hex || ''
        : nextPalette.some((color) => color.hex === current) ? current : preferred?.hex || '')
      setError('')
    }).catch((reason: unknown) => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '空间分析失败')
    })
    return () => { active = false; worker.cancel() }
  }, [sourceFile, palette, onEvidenceChange, roi, analysisKey])

  useEffect(() => {
    if (!selectedHex || activePalette.length === 0 || completedAnalysisKey !== analysisKey) return
    let active = true
    void client.current.run<SpatialViews>({ kind: 'render', file: sourceFile, palette, hex: selectedHex, mode, view: viewMode, roi: roi ?? undefined }).then((views) => {
      if (active) setOverlay({ ...views, key: overlayKey })
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : '空间可视化失败')
    })
    return () => { active = false }
  }, [sourceFile, palette, activePalette, selectedHex, mode, roi, viewMode, overlayKey, completedAnalysisKey, analysisKey])

  const selected = evidence.find((region) => region.hex.toLowerCase() === selectedHex.toLowerCase())
  const displayedRoi = draftRoi ?? roi
  const selectedDistribution = distributions.find((item) => item.hex.toLowerCase() === selectedHex.toLowerCase())
  const discrimination = analyzePaletteDiscrimination(activePalette)
  const selectedDiscrimination = discrimination[activePalette.findIndex((color) => color.hex.toLowerCase() === selectedHex.toLowerCase())]
  const centroid = viewMode === 'distribution'
    ? selectedDistribution?.hotspots[0] ?? selectedDistribution?.centroid
    : selected?.dominantCentroid
  const vertical = centroid ? centroid.y < 0.34 ? '上方' : centroid.y > 0.66 ? '下方' : '中部' : ''
  const horizontal = centroid ? centroid.x < 0.34 ? '左侧' : centroid.x > 0.66 ? '右侧' : '中央' : ''

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
    setDraftRoi({ x: point.x, y: point.y, width: 0, height: 0 })
  }

  const updateSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (selecting !== 'dragging' || !startPoint.current) return
    const point = pointFromEvent(event)
    setDraftRoi({
      x: Math.min(startPoint.current.x, point.x),
      y: Math.min(startPoint.current.y, point.y),
      width: Math.abs(point.x - startPoint.current.x),
      height: Math.abs(point.y - startPoint.current.y),
    })
  }

  const finishSelection = () => {
    if (selecting !== 'dragging') return
    if (draftRoi && draftRoi.width > 0.02 && draftRoi.height > 0.02) {
      setRoi(draftRoi)
      setSelecting(null)
    } else {
      setSelecting('armed')
    }
    setDraftRoi(null)
  }

  return (
    <section className="spatial-panel" aria-labelledby="spatial-title">
      <div className="panel-heading"><span>03</span><h2 id="spatial-title">视觉重心与色彩地图</h2><small>SPATIAL EVIDENCE</small></div>
      <p className="spatial-intro">连续区域查看颜色边界，散点分布查看密度与显著中心；所有指标都是视觉证据，不是美观评分。</p>
      {!loading && !error && completedAnalysisKey === analysisKey && attentionResult && (
        <details className="attention-panel">
          <summary>{roi ? '局部' : '整图'}视觉焦点估计 · {{ empty: '没有可分析像素', uniform: '无明确焦点', distributed: '分散结构', single: '单焦点', multiple: '多焦点' }[attentionResult.attention.state]}</summary>
          <p>依据原图的明暗与色彩反差独立估计，不受色板数量影响。人脸、文字和观看任务可能改变实际注意位置。</p>
          <div className="attention-image" data-focus-state={attentionResult.attention.state}>
            <img src={attentionResult.attentionUrl} alt={`${roi ? '框选区域' : '整张图片'}的视觉显著性估计热图`} />
            {attentionResult.attention.foci.map((focus, index) => (
              <span className="attention-marker" key={index} style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} aria-label={`候选焦点 ${index + 1}`}>{index + 1}</span>
            ))}
          </div>
          <div className="attention-locations">{attentionResult.attention.foci.map((focus, index) => <span key={index}>候选 {index + 1}：横向 {(focus.x * 100).toFixed(1)}% · 纵向 {(focus.y * 100).toFixed(1)}%</span>)}</div>
          <p>坐标从左上角起算。热度表示模型内的相对反差，不是被注视概率；多个焦点分别标出，避免把中间空白当成主体。</p>
        </details>
      )}
      <div className="spatial-roi-actions">
        <button onClick={() => {
          if (roi) setRoi(null)
          setSelecting(selecting ? null : 'armed')
        }}>{roi ? '重新框选' : selecting ? '取消框选' : '框选分析区域'}</button>
        {roi && <button onClick={() => { setRoi(null); setSelecting(null) }}>清除框选</button>}
        <span>{selecting ? '请在图片上拖动框选' : '框选后只分析该区域，避免其他物体干扰'}</span>
      </div>
      <div className="spatial-view-switch" aria-label="空间分析模式">
        <button className={viewMode === 'regions' ? 'active' : ''} onClick={() => setViewMode('regions')} aria-pressed={viewMode === 'regions'}>连续区域</button>
        <button className={viewMode === 'distribution' ? 'active' : ''} onClick={() => setViewMode('distribution')} aria-pressed={viewMode === 'distribution'}>散点分布</button>
      </div>
      <div className="spatial-layout">
        <div className={`spatial-preview ${selecting ? 'selecting' : ''}`}>
          {overlay.url && overlay.key === overlayKey ? (
            <div
              ref={previewRef}
              className="spatial-image-stage"
              onPointerDown={startSelection}
              onPointerMove={updateSelection}
              onPointerUp={finishSelection}
              onPointerCancel={finishSelection}
            >
              <img src={overlay.url} alt={viewMode === 'distribution' ? `原图中 ${selectedHex} 的色彩密度热图` : `原图中 ${selectedHex} 的颜色区域高亮`} />
              {displayedRoi && <div className="spatial-roi" style={{ left: `${displayedRoi.x * 100}%`, top: `${displayedRoi.y * 100}%`, width: `${displayedRoi.width * 100}%`, height: `${displayedRoi.height * 100}%` }} />}
            </div>
          ) : <p>{loading ? '正在分析空间分布…' : '正在更新可视化…'}</p>}
        </div>
        <div className="spatial-swatches" aria-label={roi ? '局部色板：选择要高亮的颜色' : '全局色板：选择要高亮的颜色'}>
          <div className="spatial-palette-heading">
            <strong>{roi ? '局部色板' : '全局色板'}</strong>
            <small>{roi ? '仅根据框选范围重新提取' : '基于整张图片'}</small>
          </div>
          {activePalette.map((color) => (
            <button key={color.hex} className={selectedHex === color.hex ? 'active' : ''} onClick={() => setSelectedHex(color.hex)} aria-pressed={selectedHex === color.hex}>
              <i style={{ backgroundColor: color.hex }} /><span>{color.hex}</span><small>{(color.share * 100).toFixed(1)}%</small>
            </button>
          ))}
        </div>
      </div>
      {roi && overlay.key === overlayKey && overlay.detailUrl && (
        <div className="spatial-detail" data-analysis-width={analysisSize.width} data-analysis-height={analysisSize.height}>
          <strong>局部细节</strong><p>直接分析原图中的框选区域；上方保留整图位置。</p>
          <img src={overlay.detailUrl} alt={`框选区域中 ${selectedHex} 的局部${viewMode === 'regions' ? '颜色高亮' : '色彩热图'}`} />
        </div>
      )}
      {viewMode === 'regions' ? (
        <div className="spatial-mode">
          <button onClick={() => setMode(mode === 'largest' ? 'all' : 'largest')} aria-pressed={mode === 'all'}>
            {mode === 'largest' ? '仅最大连续区域' : '全部近似色区域'}
          </button>
          <span>近似色区域，不是物体分割；相同颜色可能属于不同物体。</span>
        </div>
      ) : (
        <div className="spatial-mode"><span>热图综合多尺度颜色密度、局部明暗反差和色彩强度；圆圈标出主要热点，不代表物体边界。</span></div>
      )}
      {viewMode === 'regions' && selected && (
        <>
          <div className="spatial-facts spatial-facts-core" aria-live="polite">
            <div><small>主要位置</small><strong>{vertical} · {horizontal}</strong></div>
            <div><small>可信匹配面积</small><strong>{(selected.share * 100).toFixed(1)}%</strong></div>
            <div><small>视觉显著度</small><strong>{selectedDistribution ? `${(selectedDistribution.significanceShare * 100).toFixed(1)}%` : '—'}</strong></div>
            <div><small>连续完整性</small><strong>{(selected.largestComponentShare * 100).toFixed(1)}%</strong></div>
            <div><small>边缘接触率</small><strong>{(selected.edgeShare * 100).toFixed(1)}%</strong></div>
            <div><small>区分度（OKLab）</small><strong>{selectedDiscrimination?.distance != null ? selectedDiscrimination.distance.toFixed(3) : '—'}</strong>{selectedDiscrimination?.nearestHex && <small>最近 {selectedDiscrimination.nearestHex}</small>}</div>
          </div>
          <details className="spatial-advanced">
            <summary>查看结构详情</summary>
            <div className="spatial-facts">
              <div><small>中心区域占比</small><strong>{(selected.centerShare * 100).toFixed(1)}%</strong></div>
              <div><small>显著区域数量</small><strong>{selected.componentCount}</strong></div>
              <div><small>空间跨度</small><strong>{(selected.bounds.width * selected.bounds.height * 100).toFixed(1)}%</strong></div>
              <div><small>平均像素分离度</small><strong>{selected.meanColorSeparation.toFixed(3)}</strong></div>
            </div>
          </details>
        </>
      )}
      {viewMode === 'distribution' && selectedDistribution && (
        <div className="spatial-facts" aria-live="polite">
          <div><small>所选颜色热点位置</small><strong>{centroid ? `${vertical} · ${horizontal}` : '暂无'}</strong></div>
          <div><small>分布离散度</small><strong>{(selectedDistribution.dispersion * 100).toFixed(1)}%</strong></div>
          <div><small>主要热点</small><strong>{selectedDistribution.hotspotCount}</strong></div>
          <div><small>热点能量占比</small><strong>{(selectedDistribution.hotspotShare * 100).toFixed(1)}%</strong></div>
          <div><small>首要热点占比</small><strong>{selectedDistribution.hotspots[0] ? `${(selectedDistribution.hotspots[0].share * 100).toFixed(1)}%` : '—'}</strong></div>
          <div><small>分析口径</small><strong>密度＋局部反差</strong></div>
        </div>
      )}
      <p className="spatial-unassigned">未可靠归属 {(unassignedShare * 100).toFixed(1)}%：{unassignedShare > 0 ? '这些像素不参与颜色高亮或热点计算。' : '当前不透明像素均有可用代表色。'}</p>
      <p className="spatial-share-note">色板占比是聚类估计；可信匹配面积只统计通过颜色校验的像素，两者可能不同。</p>
      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  )
}
