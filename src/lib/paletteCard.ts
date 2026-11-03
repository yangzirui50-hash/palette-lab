import type { DomainId } from '../domain/profiles'
import { roleLabels } from '../domain/assign'
import type { RoleAssignments } from '../domain/assign'
import type { PaletteSwatch } from './color/extract'

export async function createPaletteCard(domain: DomainId, assignments: RoleAssignments, palette: PaletteSwatch[]): Promise<Blob> {
  if (!palette.length) throw new Error('请先提取图像色板')
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 720
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法绘制色板卡')
  context.fillStyle = '#f5f3ec'; context.fillRect(0, 0, 1200, 720)
  context.fillStyle = '#153f3a'; context.font = 'bold 13px sans-serif'; context.fillText('PALETTE LAB / COLOR SYSTEM', 48, 43)
  context.font = 'bold 30px sans-serif'; context.fillText(domain === 'web-ui' ? '配色方案 · Web / UI' : '配色方案 · Art / Poster', 48, 88)
  context.fillStyle = '#4f5d55'; context.font = '17px sans-serif'; context.fillText('源图色板 · 采样占比（近似）', 48, 126)
  const gap = 12, swatchWidth = (1104 - (palette.length - 1) * gap) / palette.length
  palette.forEach((color, index) => {
    const x = 48 + index * (swatchWidth + gap)
    context.fillStyle = color.hex; context.fillRect(x, 148, swatchWidth, 90)
    context.strokeStyle = '#d8d9d1'; context.strokeRect(x, 148, swatchWidth, 90)
    context.fillStyle = '#20362f'; context.font = 'bold 17px monospace'; context.fillText(color.hex, x, 266)
    context.fillStyle = '#55655d'; context.font = '15px sans-serif'; context.fillText(`≈ ${(color.share * 100).toFixed(1)}%`, x, 290)
  })
  context.fillStyle = '#203c33'; context.font = 'bold 20px sans-serif'; context.fillText('当前应用角色', 48, 340)
  Object.entries(roleLabels[domain]).forEach(([role, label], index) => {
    const x = 48 + (index % 4) * 282, y = 362 + Math.floor(index / 4) * 138, hex = assignments[role]
    const valid = Boolean(hex && /^#[0-9a-fA-F]{6}$/.test(hex))
    context.fillStyle = '#ffffff'; context.fillRect(x, y, 258, 116)
    context.fillStyle = valid ? hex : '#e2e3dc'; context.fillRect(x, y, 258, 44)
    context.strokeStyle = '#d8d9d1'; context.strokeRect(x, y, 258, 116)
    context.fillStyle = '#294339'; context.font = '15px sans-serif'; context.fillText(label, x + 12, y + 71)
    context.font = 'bold 17px monospace'; context.fillText(valid ? hex.toLowerCase() : '未分配', x + 12, y + 98)
  })
  context.fillStyle = '#5c675f'; context.font = '14px sans-serif'; context.fillText('源图占比为采样估计；应用角色包含你的手动选择。', 48, 682)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('色板卡 PNG 导出失败')), 'image/png'))
}
