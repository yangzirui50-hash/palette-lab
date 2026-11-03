import type { CSSProperties, Ref } from 'react'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { SpatialRegionEvidence } from '../lib/color/spatial'
import { getContrastReport } from '../domain/contrast'
import type { ContrastReport } from '../domain/contrast'
import ContrastAudit from './ContrastAudit'
import './DomainPreview.css'

type DomainPreviewProps = {
  domain: DomainId
  assignments: RoleAssignments
  spatial?: SpatialRegionEvidence[]
  renderRef?: Ref<HTMLDivElement>
  contrastReport?: ContrastReport
}

export default function DomainPreview({ domain, assignments, spatial = [], renderRef, contrastReport }: DomainPreviewProps) {
  const report = contrastReport ?? getContrastReport(domain, assignments)

  return (
    <section className="domain-preview" aria-labelledby="domain-preview-title">
      <div className="panel-heading">
        <span>04</span><h2 id="domain-preview-title">场景预览</h2><small>{domain === 'web-ui' ? 'WEB / UI' : 'ART / POSTER'}</small>
      </div>
      <ContrastAudit report={report} className="contrast-report" live />
      <div className="preview-render-target" ref={renderRef}>
        {domain === 'web-ui' ? <WebPreview assignments={assignments} /> : <PosterPreview assignments={assignments} spatial={spatial} />}
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

function PosterPreview({ assignments, spatial }: { assignments: RoleAssignments; spatial: SpatialRegionEvidence[] }) {
  const primaryVisual = assignments.primaryVisual === assignments.canvas
    ? assignments.secondaryVisual === assignments.canvas ? assignments.accent : assignments.secondaryVisual
    : assignments.primaryVisual
  const position = (hex: string, fallback: { x: number; y: number }) => {
    const point = spatial.find((region) => region.hex.toLowerCase() === hex.toLowerCase())?.dominantCentroid ?? fallback
    const clamp = (value: number) => Math.max(0.18, Math.min(0.82, value))
    return { x: `${clamp(point.x) * 100}%`, y: `${clamp(point.y) * 100}%` }
  }
  const primary = position(primaryVisual, { x: 0.68, y: 0.38 })
  const secondary = position(assignments.secondaryVisual, { x: 0.3, y: 0.32 })
  const accent = position(assignments.accent, { x: 0.72, y: 0.62 })
  const style = {
    '--preview-bg': assignments.canvas,
    '--preview-primary': primaryVisual,
    '--preview-secondary': assignments.secondaryVisual,
    '--preview-accent': assignments.accent,
    '--preview-display': assignments.displayText,
    '--preview-body': assignments.bodyText,
    '--primary-x': primary.x,
    '--primary-y': primary.y,
    '--secondary-x': secondary.x,
    '--secondary-y': secondary.y,
    '--accent-x': accent.x,
    '--accent-y': accent.y,
  } as CSSProperties

  return (
    <div className="preview-poster" style={style}>
      <div className="poster-atmosphere" aria-hidden="true">
        <i className="poster-main-form" /><i className="poster-secondary-form" /><i className="poster-accent-form" />
        <i className="poster-arc" /><i className="poster-horizon" /><i className="poster-grain" />
      </div>
      <div className="poster-top"><span>PALETTE LAB®</span><span>GENERATIVE STUDY — 001</span></div>
      <div className="poster-rule"><span>CHROMATIC RESEARCH</span><span>色彩・構成・余白</span></div>
      <div className="poster-chapter" aria-hidden="true"><span>COMPOSITION</span><strong>01</strong><small>COLOR / FORM / SPACE</small></div>
      <div className="poster-copy">
        <small>COLOR AS ATMOSPHERE</small>
        <h3>色彩<br />与想象</h3>
        <p>以源图的色彩关系与空间重心，重构完整的视觉场景。</p>
      </div>
      <div className="poster-foot"><span>FORM / COLOR / SPACE</span><span>ART DIRECTION — 2026</span></div>
    </div>
  )
}
