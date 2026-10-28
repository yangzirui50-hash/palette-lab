import type { RoleAssignments } from '../domain/assign'
import type { UnifiedSeriesPalette } from '../domain/unify'

const strategyLabels = {
  'follow-primary': '跟随主图',
  balanced: '折中统一',
  'preserve-accents': '保留个性',
}

export async function downloadSeriesOverviewPng(unified: UnifiedSeriesPalette, assignments: RoleAssignments, imageLabels: Record<string, string>) {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 1000
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法生成系列总览图')

  const dark = document.documentElement.dataset.theme === 'dark'
  const background = dark ? '#151716' : '#f3f4f0'
  const panel = dark ? '#202321' : '#ffffff'
  const text = dark ? '#f1f3ef' : '#171a18'
  const muted = dark ? '#a4aaa2' : '#646b65'
  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = panel
  context.fillRect(56, 56, 1488, 888)

  context.fillStyle = text
  context.font = '600 32px system-ui, sans-serif'
  context.fillText('PALETTE LAB / SERIES COLOR SYSTEM', 104, 122)
  context.fillStyle = muted
  context.font = '22px system-ui, sans-serif'
  context.fillText(`${strategyLabels[unified.strategy]} · ${unified.domain}`, 104, 166)

  const entries = Object.entries(assignments)
  const columns = 4
  const cardWidth = 330
  entries.forEach(([role, hex], index) => {
    const x = 104 + (index % columns) * 356
    const y = 218 + Math.floor(index / columns) * 204
    context.fillStyle = hex
    context.fillRect(x, y, cardWidth, 112)
    context.fillStyle = text
    context.font = '600 22px ui-monospace, monospace'
    context.fillText(role, x, y + 140)
    context.fillStyle = muted
    context.font = '20px ui-monospace, monospace'
    context.fillText(hex.toUpperCase(), x + 174, y + 140)
  })

  const exceptionY = 650
  context.fillStyle = text
  context.font = '600 24px system-ui, sans-serif'
  context.fillText('独立保留', 104, exceptionY)
  context.fillStyle = muted
  context.font = '21px system-ui, sans-serif'
  const exceptions = Object.entries(unified.exceptions)
  if (exceptions.length === 0) {
    context.fillText('无 · 所有作品使用当前统一角色', 104, exceptionY + 48)
  } else {
    exceptions.slice(0, 5).forEach(([id, roles], index) => {
      const rolesText = Object.entries(roles).map(([role, hex]) => `${role} ${hex}`).join(' · ')
      context.fillText(`${imageLabels[id] ?? id} · ${rolesText}`, 104, exceptionY + 48 + index * 42)
    })
  }

  context.fillStyle = muted
  context.font = '19px system-ui, sans-serif'
  context.fillText(unified.rationale, 104, 910)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('系列总览图编码失败')
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `palette-lab-series-${unified.strategy}.png`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
