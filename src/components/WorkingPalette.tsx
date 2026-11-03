import { useId } from 'react'
import type { WorkingColor } from '../lib/project/model'

export default function WorkingPalette({ colors, onRemove }: { colors: WorkingColor[]; onRemove: (hex: string) => void }) {
  const id = useId()
  return <section className="working-palette" aria-labelledby={id}>
    <div className="panel-heading"><h2 id={id}>工作候选色</h2><small>{colors.length} / 24</small></div>
    <p>局部色和手动色值保存在这里，可在角色分配中复用。它们不会改变整图提取占比。</p>
    {colors.length ? <div className="working-color-grid">{colors.map(candidate => <article key={candidate.color.hex}>
      <i style={{ backgroundColor: candidate.color.hex }} />
      <div><strong>{candidate.color.hex}</strong><small>{candidate.origin === 'roi' ? `来自局部 · 局部采样 ${((candidate.localShare ?? 0) * 100).toFixed(1)}%` : '手动候选 · 无图像占比'}</small></div>
      <button type="button" onClick={() => onRemove(candidate.color.hex)} aria-label={`移除候选 ${candidate.color.hex}`}>×</button>
    </article>)}</div> : <p className="working-empty">在区域分析中加入新色，或点击角色旁的 HEX 输入色值。</p>}
    {colors.length > 0 && <p>移出候选不改变已分配的角色；可使用“撤销”恢复。</p>}
  </section>
}
