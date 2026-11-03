import { roleLabels, semanticFallbacks } from '../domain/assign'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'

type RoleEditorProps = {
  domain: DomainId
  palette: PaletteSwatch[]
  assignments: RoleAssignments
  onChange: (role: string, hex: string) => void
  lockedRoles?: string[]
  onLockChange?: (role: string, locked: boolean) => void
}

export default function RoleEditor({ domain, palette, assignments, onChange, lockedRoles = [], onLockChange }: RoleEditorProps) {
  const labels = roleLabels[domain]
  const fallbacks: Partial<Record<string, string>> = domain === 'web-ui' ? semanticFallbacks : {
    canvas: semanticFallbacks.background,
    displayText: semanticFallbacks.textPrimary,
    bodyText: semanticFallbacks.textMuted,
  }

  return (
    <section className="role-editor" aria-labelledby="role-editor-title">
      <div className="panel-heading">
        <span>03</span><h2 id="role-editor-title">角色分配</h2><small>EDITABLE TOKENS</small>
      </div>
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
            <label className="role-field" key={role}>
              <span className="role-label"><i style={{ backgroundColor: assignments[role] }} />{label}<small>{role}</small></span>
              <select value={current} onChange={(event) => onChange(role, event.target.value)} aria-label={`选择${label}颜色`}>
                {!current && <option value="" disabled>尚未分配颜色</option>}
                {[...options].map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
              {onLockChange && (
                <button
                  type="button"
                  className={`role-lock ${lockedRoles.includes(role) ? 'locked' : ''}`}
                  aria-label={`${lockedRoles.includes(role) ? '解锁' : '锁定'}${label}`}
                  aria-pressed={lockedRoles.includes(role)}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onLockChange(role, !lockedRoles.includes(role))
                  }}
                >{lockedRoles.includes(role) ? '锁' : '○'}</button>
              )}
            </label>
          )
        })}
      </div>
    </section>
  )
}
