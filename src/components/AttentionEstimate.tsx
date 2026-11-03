import { useState } from 'react'
import type { AttentionEvidence } from '../lib/color/attention'

const explanations: Record<AttentionEvidence['reason'], string> = {
  'no-opaque-pixels': '没有可用于分析的不透明像素。',
  'low-contrast': '尚未检测到突出的反差峰值；这不代表图像没有语义重点。',
  'broad-response': '较大范围都产生了反差响应，当前没有给出稳定的单独位置。',
  'fragmented-response': '检测到的反差区域较碎，尚未形成稳定候选；这不等于图像没有视觉重点。',
  'ambiguous-location': '候选位置存在歧义，暂不标记，避免把空白当成目标。',
  'localized-response': '标记表示有反差支撑的局部位置；多个标记不代表多个主体，编号不代表主次。',
  'extended-response': '反差沿区域或轮廓延展，保留实际响应范围，不强行选一个中心点。',
}
const labels: Record<AttentionEvidence['state'], string> = {
  empty: '没有可分析像素', uniform: '反差不足，重点未判定', distributed: '反差分布较广',
  uncertain: '候选不足，暂不定位', single: '一处局部反差', multiple: '多处局部反差', regions: '区域或轮廓响应',
}
const geometryLabels = { compact: '局部区域', extended: '延展区域', outline: '轮廓式响应', frame: '沿画面四周的响应' }

function supportPath(cells: readonly number[], width: number) {
  // Sorted row runs preserve holes and transparent gaps rather than filling a
  // region's entire bounding rectangle. Coordinates stay in the contrast grid.
  const runs: string[] = []
  for (let i = 0; i < cells.length;) {
    const start = cells[i], y = Math.floor(start / width), x = start % width
    let end = i
    while (end + 1 < cells.length && cells[end + 1] === cells[end] + 1 && Math.floor(cells[end + 1] / width) === y) end++
    const length = end - i + 1
    runs.push(`M${x},${y}h${length}v1h-${length}Z`)
    i = end + 1
  }
  return runs.join('')
}

export default function AttentionEstimate({ attention, imageUrl, sourceImageUrl, local }: { attention: AttentionEvidence; imageUrl: string; sourceImageUrl: string; local: boolean }) {
  const [showEvidence, setShowEvidence] = useState(false)
  return <details className="attention-panel" data-focus-reason={attention.reason} data-focus-version={attention.version} data-focus-scope={attention.scope}>
    <summary>{local ? '局部' : '整图'}视觉重点参考 · {labels[attention.state]}</summary>
    <p>{explanations[attention.reason]}</p>
    <p>这里依据颜色反差提供参考，尚未判断人物、物体含义或你的关注顺序。“没有稳定位置”不等于“画面没有重点”。</p>
    <div className="attention-view-control"><button type="button" aria-pressed={showEvidence} onClick={() => setShowEvidence(value => !value)}>{showEvidence ? '收起反差证据' : '显示反差证据'}</button><span>{showEvidence ? '证据叠层仅供核对，可随时收起。' : '默认查看原图，避免着色覆盖画面。'}</span></div>
    <div className="attention-image" data-focus-state={attention.state} data-evidence-visible={showEvidence}>
      <img src={showEvidence ? imageUrl : sourceImageUrl} alt={`${local ? '框选区域' : '整张图片'}的${showEvidence ? '颜色反差参考热图' : '原图预览'}`} />
      {showEvidence && <svg className="attention-response-mask" viewBox={`0 0 ${attention.heat.width} ${attention.heat.height}`} preserveAspectRatio="none" aria-label="测得的颜色反差响应范围">
        {attention.regions.map((region, index) => <path className="attention-region" data-response-geometry={region.geometry} key={index} d={supportPath(region.cells, attention.heat.width)}><title>范围 {String.fromCharCode(65 + index)}：{geometryLabels[region.geometry]}，不是物体边界</title></path>)}
      </svg>}
      {attention.foci.map((focus, index) => <span className="attention-marker" key={index} style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} aria-label={`反差位置 ${index + 1}，编号不代表关注顺序`}>{index + 1}</span>)}
    </div>
    <div className="attention-locations">{attention.foci.map((focus, index) => <span key={index}>候选 {index + 1}：横向 {(focus.x * 100).toFixed(1)}% · 纵向 {(focus.y * 100).toFixed(1)}%</span>)}</div>
    <div className="attention-locations">{attention.regions.map((region, index) => <span key={index}>范围 {String.fromCharCode(65 + index)}：{geometryLabels[region.geometry]}{region.coreCount > 1 ? `，包含 ${region.coreCount} 处强响应` : ''}</span>)}</div>
    {attention.regions.some(region => region.geometry === 'frame') && <p>沿四周的反差可能来自边框，也可能是有意义的灯带；这里保留轮廓，不把它认定为主视觉点。</p>}
    {attention.diagnostics.qualifiedCount > attention.foci.length && <p>部分响应以范围呈现，或未给出点位；最多展示 3 个范围和 3 个局部位置。</p>}
    <p>反差证据可按需显示；着色范围不是物体边界或完整灯带。坐标从{local ? '局部图像' : '原图'}左上角起算；热度与占比不是被注视概率。</p>
    <small>反差模型 {attention.version} · 独立于色板数量 · 尚未经独立人工精度验收</small>
  </details>
}
