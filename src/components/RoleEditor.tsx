import { useId, useState } from 'react'
import { roleLabels, semanticFallbacks } from '../domain/assign'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import { normalizeHex } from '../lib/color/hex'

type RoleEditorProps = {
  domain: DomainId
  palette: PaletteSwatch[]
  assignments: RoleAssignments
  onChange: (role: string, hex: string) => void
  lockedRoles?: string[]
  onLockChange?: (role: string, locked: boolean) => void
  editedRoles?: string[]
  editHint?: string
  onResetAll?: () => void
  contextKey?: string
  step?: string
}

export default function RoleEditor({ domain, palette, assignments, onChange, lockedRoles = [], onLockChange, editedRoles = [], editHint, onResetAll, contextKey = domain, step = '03' }: RoleEditorProps) {
  const headingId = useId()
  const labels = roleLabels[domain]
  const fallbacks: Partial<Record<string, string>> = domain === 'web-ui' ? semanticFallbacks : {
    canvas: semanticFallbacks.background,
    displayText: semanticFallbacks.textPrimary,
    bodyText: semanticFallbacks.textMuted,
  }

  return (
    <section className="role-editor" aria-labelledby={headingId}>
      <div className="panel-heading">
        <span>{step}</span><h2 id={headingId}>角色分配</h2><small>EDITABLE TOKENS</small>
      </div>
      {onResetAll && (
        <div className="role-edit-actions">
          <p>{editedRoles.length > 0 ? `已保留 ${editedRoles.length} 项手动选择。` : '当前使用自动建议。'}{editHint}</p>
          <button type="button" onClick={onResetAll} disabled={editedRoles.length === 0}>恢复自动分配</button>
        </div>
      )}
      <div className="role-grid">
        {Object.entries(labels).map(([role, label]) => {
          const current = assignments[role]?.toLowerCase() ?? ''
          const options = new Map(palette.map(color => [color.hex.toLowerCase(), color.hex.toLowerCase()]))
          const fallback = fallbacks[role]
          if (fallback && !options.has(fallback)) options.set(fallback, `${fallback}（${role === 'success' || role === 'error' ? '语义回退' : '回退色'}）`)
          // A valid current assignment must remain selectable even if it is not
          // in the extracted palette (fallbacks and later custom/locked colors).
          if (current && !options.has(current)) options.set(current, `${current}（当前颜色）`)
          return (
            <ColorRoleField key={`${contextKey}:${role}`} role={role} label={label} current={current} options={[...options]}
              edited={editedRoles.includes(role)} locked={lockedRoles.includes(role)} onChange={hex => onChange(role, hex)}
              onLockChange={onLockChange ? () => onLockChange(role, !lockedRoles.includes(role)) : undefined} />
          )
        })}
      </div>
    </section>
  )
}

function ColorRoleField({ role, label, current, options, edited, locked, onChange, onLockChange }: {
  role: string; label: string; current: string; options: [string, string][]; edited: boolean; locked: boolean
  onChange: (hex: string) => void; onLockChange?: () => void
}) {
  const id = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  return <div className="role-field">
    <div className="role-field-main">
      <label className="role-label" htmlFor={id}><i style={{ backgroundColor: current }} />{label}<small>{role}</small>{edited && <em className="role-edit-badge">手动</em>}</label>
      <div className="role-field-controls">
        <select id={id} value={current} onChange={event => { onChange(event.target.value); setEditing(false); setError('') }} aria-label={`选择${label}颜色`}>
          {!current && <option value="" disabled>尚未分配颜色</option>}
          {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
        <button type="button" className="role-custom-toggle" aria-label={`自定义${label}颜色`} aria-expanded={editing} onClick={() => { setDraft(current); setError(''); setEditing(!editing) }}>HEX</button>
        {onLockChange && <button type="button" className={`role-lock ${locked ? 'locked' : ''}`} aria-label={`${locked ? '解锁' : '锁定'}${label}`} aria-pressed={locked} onClick={onLockChange}>{locked ? '锁' : '○'}</button>}
      </div>
    </div>
    {editing && <form className="role-custom-form" onSubmit={event => {
      event.preventDefault(); const hex = normalizeHex(draft)
      if (!hex) { setError('请输入 3 位或 6 位 HEX，例如 #247acb'); return }
      onChange(hex); setEditing(false); setError('')
    }}>
      <input type="text" value={draft} maxLength={9} autoFocus placeholder="#247acb" aria-label={`输入${label}HEX`} onChange={event => { setDraft(event.target.value); setError('') }} />
      <button type="submit" aria-label={`应用${label}色值`}>应用</button>
      <button type="button" aria-label={`取消自定义${label}颜色`} onClick={() => setEditing(false)}>取消</button>
      {error && <p className="role-custom-error" role="alert">{error}</p>}
    </form>}
  </div>
}
