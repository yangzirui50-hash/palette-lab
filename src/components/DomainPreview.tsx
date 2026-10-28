import type { CSSProperties, Ref } from 'react'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import { getContrastReport } from '../domain/contrast'
import './DomainPreview.css'

type DomainPreviewProps = {
  domain: DomainId
  assignments: RoleAssignments
  sourceUrl?: string
  renderRef?: Ref<HTMLDivElement>
}

export default function DomainPreview({ domain, assignments, sourceUrl, renderRef }: DomainPreviewProps) {
  const report = getContrastReport(domain, assignments)

  return (
    <section className="domain-preview" aria-labelledby="domain-preview-title">
      <div className="panel-heading">
        <span>04</span><h2 id="domain-preview-title">场景预览</h2><small>{domain === 'web-ui' ? 'WEB / UI' : 'ART / POSTER'}</small>
      </div>
      <div className={`contrast-report ${report.issues.length > 0 ? 'has-issues' : ''}`} role="status">
        {report.issues.length === 0
          ? `✓ ${report.checked} 组关键对比检查通过`
          : `⚠ ${report.issues.length} 组对比不足：${report.issues.map((issue) => `${issue.label} ${issue.ratio.toFixed(1)}:1`).join('；')}`}
      </div>
      <div className="preview-render-target" ref={renderRef}>
        {domain === 'web-ui' ? <WebPreview assignments={assignments} /> : <PosterPreview assignments={assignments} sourceUrl={sourceUrl} />}
      </div>
    </section>
  )
}

function WebPreview({ assignments }: { assignments: RoleAssignments }) {
  const style = {
    '--preview-bg': assignments.background,
    '--preview-surface': assignments.surface,
    '--preview-text': assignments.textPrimary,
    '--preview-muted': assignments.textMuted,
    '--preview-accent': assignments.accent,
    '--preview-success': assignments.success,
    '--preview-error': assignments.error,
  } as CSSProperties

  return (
    <div className="preview-web" style={style}>
      <div className="preview-web-nav"><strong>COLOR / SYSTEM</strong><span>Overview · Components · Tokens</span></div>
      <div className="preview-web-body">
        <div className="preview-web-copy">
          <small>DESIGN FOUNDATION</small>
          <h3>Build with clarity.</h3>
          <p>一套可验证、可维护的界面色彩系统。</p>
          <div className="preview-actions"><span>开始使用</span><span>查看规范</span></div>
        </div>
        <div className="preview-web-card">
          <small>COLOR ROLES</small>
          <div><span>Primary surface</span><i /></div>
          <div><span>Accent action</span><i /></div>
          <div><span>Accessible text</span><i /></div>
          <p><b>● Success</b><b>● Error</b></p>
        </div>
      </div>
    </div>
  )
}

function PosterPreview({ assignments, sourceUrl }: { assignments: RoleAssignments; sourceUrl?: string }) {
  const primaryVisual = assignments.primaryVisual === assignments.canvas
    ? assignments.secondaryVisual === assignments.canvas ? assignments.accent : assignments.secondaryVisual
    : assignments.primaryVisual
  const style = {
    '--preview-bg': assignments.canvas,
    '--preview-primary': primaryVisual,
    '--preview-secondary': assignments.secondaryVisual,
    '--preview-accent': assignments.accent,
    '--preview-display': assignments.displayText,
    '--preview-body': assignments.bodyText,
  } as CSSProperties

  return (
    <div className="preview-poster" style={style}>
      <div className="poster-top"><span>PALETTE LAB®</span><span>VISUAL STUDY — 001</span></div>
      <div className="poster-rule"><span>CHROMATIC RESEARCH</span><span>色彩・構成・余白</span></div>
      {sourceUrl ? (
        <figure className="poster-image-frame">
          <img src={sourceUrl} alt="当前图片的海报主视觉" />
          <figcaption>SOURCE IMAGE / 001</figcaption>
        </figure>
      ) : (
        <div className="poster-composition" aria-hidden="true">
          <i className="poster-orbit" /><i className="poster-core" /><i className="poster-plane" /><i className="poster-axis" />
        </div>
      )}
      <div className="poster-copy">
        <small>COLOR AS ATMOSPHERE</small>
        <h3>色彩<br />与想象</h3>
        <p>从图像出发，建立属于作品的视觉秩序。</p>
      </div>
      <div className="poster-index" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div>
      <div className="poster-foot"><span>FORM / COLOR / SPACE</span><span>ART DIRECTION — 2026</span></div>
    </div>
  )
}
