import { roleLabels } from '../domain/assign'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'

type RoleEditorProps = {
  domain: DomainId
  palette: PaletteSwatch[]
  assignments: RoleAssignments
  onChange: (role: string, hex: string) => void
}

export default function RoleEditor({ domain, palette, assignments, onChange }: RoleEditorProps) {
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
            </select>
          </label>
        ))}
      </div>
    </section>
  )
}
