import type { RoleAssignments } from '../domain/assign'
import type { UnifiedSeriesPalette } from '../domain/unify'
import { wrapCanvasText } from './canvasText'
import { downloadBlob } from './exporters'

const strategyLabels = {
  'follow-primary': '跟随主图',
  balanced: '折中统一',
  'preserve-accents': '保留个性',
}

export async function downloadSeriesOverviewPng(unified: UnifiedSeriesPalette, assignments: RoleAssignments, imageLabels: Record<string, string>) {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法生成系列总览图')

  const entries = Object.entries(assignments), exceptions = Object.entries(unified.exceptions)
  const exceptionY = 218 + Math.ceil(entries.length / 4) * 204 + 24
  context.font = '600 21px system-ui, sans-serif'
  const measured = exceptions.map(([id, roles]) => ({
    labels: wrapCanvasText(imageLabels[id] ?? id, 1392, text => context.measureText(text).width),
    roles: wrapCanvasText(Object.entries(roles).map(([role, hex]) => `${role} ${hex}`).join(' · '), 1392, text => context.measureText(text).width),
  }))
  const exceptionBottom = exceptionY + 48 + (measured.length ? measured.reduce((sum, row) => sum + (row.labels.length + row.roles.length) * 30 + 20, 0) : 30)
  context.font = '19px system-ui, sans-serif'
  const rationale = wrapCanvasText(unified.rationale, 1392, text => context.measureText(text).width)
  const footerY = Math.max(910, exceptionBottom + 36)
  canvas.height = Math.max(1000, footerY + rationale.length * 28 + 56)

  const dark = document.documentElement.dataset.theme === 'dark'
  const background = dark ? '#151716' : '#f3f4f0'
  const panel = dark ? '#202321' : '#ffffff'
  const text = dark ? '#f1f3ef' : '#171a18'
  const muted = dark ? '#a4aaa2' : '#646b65'
  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = panel
  context.fillRect(56, 56, 1488, canvas.height - 112)

  context.fillStyle = text
  context.font = '600 32px system-ui, sans-serif'
  context.fillText('PALETTE LAB / SERIES COLOR SYSTEM', 104, 122)
  context.fillStyle = muted
  context.font = '22px system-ui, sans-serif'
  context.fillText(`${strategyLabels[unified.strategy]} · ${unified.domain}`, 104, 166)

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

  context.fillStyle = text
  context.font = '600 24px system-ui, sans-serif'
  context.fillText(`独立保留 · ${exceptions.length} 张作品`, 104, exceptionY)
  context.fillStyle = muted
  context.font = '21px system-ui, sans-serif'
  if (exceptions.length === 0) {
    context.fillText('无 · 所有作品使用当前统一角色', 104, exceptionY + 48)
  } else {
    let y = exceptionY + 48
    for (const row of measured) {
      context.fillStyle = text; context.font = '600 20px system-ui, sans-serif'
      for (const label of row.labels) { context.fillText(label, 104, y); y += 30 }
      context.fillStyle = muted; context.font = '20px system-ui, sans-serif'
      for (const roles of row.roles) { context.fillText(roles, 104, y); y += 30 }
      y += 20
    }
  }

  context.fillStyle = muted
  context.font = '19px system-ui, sans-serif'
  rationale.forEach((line, index) => context.fillText(line, 104, footerY + index * 28))

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('系列总览图编码失败')
  downloadBlob(`palette-lab-series-${unified.strategy}.png`, blob)
}
