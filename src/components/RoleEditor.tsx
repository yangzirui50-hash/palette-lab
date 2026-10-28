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

  return (
    <section className="role-editor" aria-labelledby="role-editor-title">
      <div className="panel-heading">
        <span>03</span><h2 id="role-editor-title">角色分配</h2><small>EDITABLE TOKENS</small>
      </div>
      <div className="role-grid">
        {Object.entries(labels).map(([role, label]) => (
          <label className="role-field" key={role}>
            <span className="role-label"><i style={{ backgroundColor: assignments[role] }} />{label}<small>{role}</small></span>
            <select value={assignments[role]} onChange={(event) => onChange(role, event.target.value)} aria-label={`选择${label}颜色`}>
              {palette.map((color, index) => <option key={`${color.hex}-${index}`} value={color.hex}>{color.hex}</option>)}
              {domain === 'web-ui' && (role === 'success' || role === 'error') && !palette.some((color) => color.hex === semanticFallbacks[role]) && (
                <option value={semanticFallbacks[role]}>{semanticFallbacks[role]}（语义回退）</option>
              )}
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
        ))}
      </div>
    </section>
  )
}
