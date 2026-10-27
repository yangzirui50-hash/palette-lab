import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from './color/extract'

export function createCssVariables(domain: DomainId, assignments: RoleAssignments) {
  const lines = Object.entries(assignments).map(([role, hex]) => `  --color-${role}: ${hex};`)
  return `/* Palette Lab · ${domain} */\n:root {\n${lines.join('\n')}\n}\n`
}

export function createDesignTokens(domain: DomainId, assignments: RoleAssignments, palette: PaletteSwatch[]) {
  return JSON.stringify({
    $schema: 'https://palette-lab.local/schemas/design-tokens/v1.json',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    domain,
    roles: assignments,
    palette: palette.map((color) => ({
      hex: color.hex,
      share: Number(color.share.toFixed(6)),
      oklch: color.oklch.map((value) => Number(value.toFixed(6))),
    })),
  }, null, 2)
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
