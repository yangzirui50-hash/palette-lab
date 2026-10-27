import type { PaletteSwatch } from '../lib/color/extract'
import type { DomainId } from './profiles'

export type RoleAssignments = Record<string, string>

export const roleLabels: Record<DomainId, Record<string, string>> = {
  'web-ui': {
    background: '页面背景',
    surface: '卡片表面',
    textPrimary: '主要文字',
    textMuted: '次要文字',
    accent: '行动强调',
    focus: '焦点状态',
    success: '成功状态',
    error: '错误状态',
  },
  'art-poster': {
    canvas: '海报底色',
    primaryVisual: '主视觉色',
    secondaryVisual: '辅助视觉色',
    accent: '点缀色',
    displayText: '展示标题',
    bodyText: '正文文字',
  },
}

const byLightness = (palette: PaletteSwatch[], ascending = true) =>
  [...palette].sort((a, b) => ascending ? a.oklch[0] - b.oklch[0] : b.oklch[0] - a.oklch[0])

const byChroma = (palette: PaletteSwatch[]) =>
  [...palette].sort((a, b) => b.oklch[1] - a.oklch[1])

const nearestLightness = (palette: PaletteSwatch[], target: number) =>
  [...palette].sort((a, b) => Math.abs(a.oklch[0] - target) - Math.abs(b.oklch[0] - target))[0]

const at = (items: PaletteSwatch[], index: number) => items[Math.min(index, items.length - 1)].hex

function hueScore(color: PaletteSwatch, targetHue: number) {
  const hue = color.oklch[2]
  const distance = Math.min(Math.abs(hue - targetHue), 360 - Math.abs(hue - targetHue))
  return color.oklch[1] * Math.max(0.15, 1 - distance / 180)
}

export function assignPaletteRoles(palette: PaletteSwatch[], domain: DomainId): RoleAssignments {
  if (palette.length === 0) return {}
  const light = byLightness(palette, false)
  const dark = byLightness(palette)
  const chroma = byChroma(palette)
  const accent = chroma[0].hex

  if (domain === 'art-poster') {
    return {
      canvas: dark[0].hex,
      primaryVisual: palette[0].hex,
      secondaryVisual: at(palette, 1),
      accent,
      displayText: light[0].hex,
      bodyText: at(light, 1),
    }
  }

  const success = [...palette].sort((a, b) => hueScore(b, 145) - hueScore(a, 145))[0].hex
  const error = [...palette].sort((a, b) => hueScore(b, 30) - hueScore(a, 30))[0].hex
  return {
    background: dark[0].hex,
    surface: at(dark, 1),
    textPrimary: light[0].hex,
    textMuted: nearestLightness(palette, 0.58).hex,
    accent,
    focus: accent,
    success,
    error,
  }
}
