import type { AttentionEvidence } from '../lib/color/attention'

const explanations: Record<AttentionEvidence['reason'], string> = {
  'no-opaque-pixels': '没有可用于分析的不透明像素。',
  'low-contrast': '尚未检测到突出的反差峰值；这不代表图像没有语义重点。',
  'broad-response': '较大范围都产生了反差响应，当前没有给出稳定的单独位置。',
  'fragmented-response': '检测到的反差区域较碎，尚未形成稳定候选；这不等于图像没有视觉重点。',
  'ambiguous-location': '候选位置存在歧义，暂不标记，避免把空白当成目标。',
  'localized-response': '标记表示稳定的反差候选；人物、文字含义可能让你的注意重点不同。',
}
const labels: Record<AttentionEvidence['state'], string> = {
  empty: '没有可分析像素', uniform: '无明确焦点（反差不足）', distributed: '反差分布较广',
  uncertain: '候选不足，暂不定位', single: '单焦点候选', multiple: '多焦点候选',
}

export default function AttentionEstimate({ attention, imageUrl, local }: { attention: AttentionEvidence; imageUrl: string; local: boolean }) {
  return <details className="attention-panel" data-focus-reason={attention.reason} data-focus-version={attention.version}>
    <summary>{local ? '局部' : '整图'}视觉焦点估计 · {labels[attention.state]}</summary>
    <p>{explanations[attention.reason]}</p>
    <div className="attention-image" data-focus-state={attention.state}>
      <img src={imageUrl} alt={`${local ? '框选区域' : '整张图片'}的视觉显著性估计热图`} />
      {attention.foci.map((focus, index) => <span key={index}>
        <span className="attention-region" aria-hidden="true" style={{ left: `${focus.bounds.x * 100}%`, top: `${focus.bounds.y * 100}%`, width: `${focus.bounds.width * 100}%`, height: `${focus.bounds.height * 100}%` }} />
        <span className="attention-marker" style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} aria-label={`候选焦点 ${index + 1}`}>{index + 1}</span>
      </span>)}
    </div>
    <div className="attention-locations">{attention.foci.map((focus, index) => <span key={index}>候选 {index + 1}：横向 {(focus.x * 100).toFixed(1)}% · 纵向 {(focus.y * 100).toFixed(1)}%</span>)}</div>
    {attention.foci.length > 0 && attention.diagnostics.qualifiedCount > attention.foci.length && <p>有 {attention.diagnostics.qualifiedCount} 个候选达到能量门槛；当前标出了 {attention.foci.length} 个稳定位置（最多 3 个）。</p>}
    <p>矩形是反差响应范围的外接框，不是物体边界。坐标从{local ? '局部图像' : '原图'}左上角起算；热度与占比不是被注视概率。</p>
    <small>反差模型 {attention.version} · 独立于色板数量 · 尚未经独立人工精度验收</small>
  </details>
}
