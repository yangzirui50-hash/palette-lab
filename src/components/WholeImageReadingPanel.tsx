import type { ImageReading } from '../domain/reading'
import './WholeImageReadingPanel.css'

const relationLabels: Record<ImageReading['wholeImage']['relations'][number]['type'], string> = {
  color: '色彩', light: '明暗与光线', form: '形与线', texture: '纹理', gesture: '动作与动势', interaction: '互动', scale: '尺度', space: '空间',
}

export default function WholeImageReadingPanel({ reading, sourceUrl, provider, model, createdAt }: {
  reading: ImageReading; sourceUrl: string; provider: string; model: string; createdAt: string
}) {
  return <section className="whole-image-reading" aria-label="整体视觉解读" data-reading-task="whole-image-reading">
    <div className="reading-heading"><h3>整体视觉解读</h3><span>整体优先 · 局部按需看</span></div>
    <div className="reading-layout">
      {sourceUrl && <img className="reading-original" src={sourceUrl} alt="用于整体解读的原图"/>}
      <div className="reading-copy">
        <p className="reading-organization">{reading.wholeImage.organization}</p>
        <p className="reading-character">{reading.wholeImage.character}</p>
        <details className="reading-relations"><summary>查看构图与观感的关系</summary><p>{reading.scene}</p><ul>{reading.wholeImage.relations.map((relation, index) => <li key={index}><strong>{relationLabels[relation.type]}</strong>：{relation.description}</li>)}</ul></details>
        <details className="reading-local-cues"><summary>按需看局部线索（{reading.localCues.length}）</summary><p>这些局部可能吸引注意，列表没有主次顺序。</p>{reading.localCues.length ? <ul>{reading.localCues.map((cue, index) => <li key={index}><strong>{cue.label}</strong>：{cue.evidence}</li>)}</ul> : <p>这次未列出明确的局部线索。</p>}</details>
        {reading.uncertainties.length > 0 && <details className="reading-uncertainties"><summary>解读中不确定的地方</summary><ul>{reading.uncertainties.map((item, index) => <li key={index}>{item}</li>)}</ul></details>}
      </div>
    </div>
    <p className="reading-provenance">针对整张原图的 AI 解读，供配色参考。{provider} · {model} · <time dateTime={createdAt}>{new Date(createdAt).toLocaleString()}</time></p>
  </section>
}
