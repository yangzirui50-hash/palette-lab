import Color from 'colorjs.io'
import type { PaletteSwatch, RGBPixel } from '../lib/color/extract'
import type { RoleAssignments } from './assign'
import type { DomainId } from './profiles'
import { domainProfiles } from './profiles'
import type { SeriesImageAnalysis } from './series'
import { seriesColorDistance } from './series'

export type SeriesStrategy = 'follow-primary' | 'balanced' | 'preserve-accents'

export type SeriesStrategyImage = SeriesImageAnalysis & {
  lockedRoles?: string[]
}

export type UnifiedSeriesPalette = {
  strategy: SeriesStrategy
  domain: DomainId
  roles: RoleAssignments
  palette: PaletteSwatch[]
  exceptions: Record<string, RoleAssignments>
  rationale: string
}

function swatch(hex: string, share: number): PaletteSwatch {
  const color = new Color(hex)
  return {
    hex,
    rgb: color.to('srgb').coords.map((channel) => Math.round((channel ?? 0) * 255)) as unknown as RGBPixel,
    oklch: color.to('oklch').coords.map((channel) => channel ?? 0) as unknown as RGBPixel,
    share,
  }
}

function representativeRole(images: SeriesStrategyImage[], role: string) {
  const candidates = [...new Set(images.map((image) => image.roles[role]).filter(Boolean))]
  return candidates.sort((a, b) => a.localeCompare(b)).reduce((best, hex) => {
    const cost = images.reduce((sum, image) => sum + (image.roles[role] ? seriesColorDistance(hex, image.roles[role]) : 0), 0)
    const support = images.filter((image) => image.roles[role]?.toLowerCase() === hex.toLowerCase()).length
    return cost < best.cost || (cost === best.cost && support > best.support) ? { hex, cost, support } : best
  }, { hex: candidates[0] ?? '', cost: Number.POSITIVE_INFINITY, support: 0 }).hex
}

export function generateUnifiedSeriesPalette(images: SeriesStrategyImage[], primaryId: string, domain: DomainId, strategy: SeriesStrategy): UnifiedSeriesPalette {
  if (images.length < 2 || images.length > 6) throw new Error('Series requires between 2 and 6 images')
  const primary = images.find((image) => image.id === primaryId)
  if (!primary) throw new Error('Primary image must belong to the series')

  const roles: RoleAssignments = {}
  const exceptions: Record<string, RoleAssignments> = {}
  for (const role of domainProfiles[domain].colorRoles) {
    const value = strategy === 'balanced' && !primary.lockedRoles?.includes(role)
      ? representativeRole(images, role) || primary.roles[role]
      : primary.roles[role]
    if (value) roles[role] = value
  }

  for (const image of images) {
    const imageExceptions: RoleAssignments = {}
    for (const role of domainProfiles[domain].colorRoles) {
      const preserveAccent = strategy === 'preserve-accents' && role === 'accent' && image.id !== primaryId
      const locked = image.lockedRoles?.includes(role)
      if ((preserveAccent || locked) && image.roles[role] && image.roles[role] !== roles[role]) {
        imageExceptions[role] = image.roles[role]
      }
    }
    if (Object.keys(imageExceptions).length > 0) exceptions[image.id] = imageExceptions
  }

  const uniqueHexes = [...new Set(Object.values(roles))]
  const palette = uniqueHexes.map((hex) => {
    const source = images.flatMap((image) => image.palette).find((color) => color.hex.toLowerCase() === hex.toLowerCase())
    return source ?? swatch(hex, 0)
  })
  const rationale = strategy === 'follow-primary'
    ? '基础角色跟随主图，锁定的独立角色保留。'
    : strategy === 'balanced'
      ? '每个角色选择现有作品中的代表色，使全系列总 OKLCH 距离最小；不是 RGB 平均色。'
      : '基础角色跟随主图，每张作品保留自己的强调色与锁定角色。'

  return { strategy, domain, roles, palette, exceptions, rationale }
}
