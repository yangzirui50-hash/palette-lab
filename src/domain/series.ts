import Color from 'colorjs.io'
import type { PaletteSwatch } from '../lib/color/extract'
import type { RoleAssignments } from './assign'

export type SeriesImageAnalysis = {
  id: string
  label: string
  palette: PaletteSwatch[]
  roles: RoleAssignments
}

export type SharedColorDifference = {
  type: 'shared'
  primary: PaletteSwatch
  candidate: PaletteSwatch
  distance: number
  shareDelta: number
}

export type MissingColorDifference = {
  type: 'missing'
  primary: PaletteSwatch
}

export type AdditionalColorDifference = {
  type: 'additional'
  candidate: PaletteSwatch
}

export type SeriesColorDifference = SharedColorDifference | MissingColorDifference | AdditionalColorDifference

export type SeriesRoleDifference = {
  role: string
  primaryHex: string
  candidateHex: string
  distance: number
}

export type SeriesImageComparison = {
  candidateId: string
  colorDifferences: SeriesColorDifference[]
  roleDifferences: SeriesRoleDifference[]
}

export type SeriesSharedColor = {
  primaryHex: string
  shares: Record<string, number>
  maxDistance: number
  minShare: number
  maxShare: number
}

export type SeriesComparisonReport = {
  primaryId: string
  sharedColors: SeriesSharedColor[]
  comparisons: SeriesImageComparison[]
}

const COLOR_MATCH_THRESHOLD = 0.08
const ROLE_DIFFERENCE_THRESHOLD = 0.02

function coordinates(hex: string) {
  const [lightness, a, b] = new Color(hex).to('oklch').coords
  return [lightness ?? 0, a ?? 0, b ?? 0] as const
}

export function seriesColorDistance(primaryHex: string, candidateHex: string) {
  const primary = coordinates(primaryHex)
  const candidate = coordinates(candidateHex)
  return Math.sqrt(
    (primary[0] - candidate[0]) ** 2
    + (primary[1] - candidate[1]) ** 2
    + (primary[2] - candidate[2]) ** 2,
  )
}

function matchPalettes(primary: PaletteSwatch[], candidate: PaletteSwatch[]) {
  const pairs = primary.flatMap((primarySwatch, primaryIndex) =>
    candidate.map((candidateSwatch, candidateIndex) => ({
      primaryIndex,
      candidateIndex,
      distance: seriesColorDistance(primarySwatch.hex, candidateSwatch.hex),
    })),
  ).sort((a, b) => a.distance - b.distance
    || primary[a.primaryIndex].hex.localeCompare(primary[b.primaryIndex].hex)
    || candidate[a.candidateIndex].hex.localeCompare(candidate[b.candidateIndex].hex))

  const matchedPrimary = new Set<number>()
  const matchedCandidate = new Set<number>()
  const differences: SeriesColorDifference[] = []

  for (const pair of pairs) {
    if (pair.distance > COLOR_MATCH_THRESHOLD) break
    if (matchedPrimary.has(pair.primaryIndex) || matchedCandidate.has(pair.candidateIndex)) continue
    matchedPrimary.add(pair.primaryIndex)
    matchedCandidate.add(pair.candidateIndex)
    const primarySwatch = primary[pair.primaryIndex]
    const candidateSwatch = candidate[pair.candidateIndex]
    differences.push({
      type: 'shared',
      primary: primarySwatch,
      candidate: candidateSwatch,
      distance: pair.distance,
      shareDelta: Number((candidateSwatch.share - primarySwatch.share).toFixed(6)),
    })
  }

  primary.forEach((swatch, index) => {
    if (!matchedPrimary.has(index)) differences.push({ type: 'missing', primary: swatch })
  })
  candidate.forEach((swatch, index) => {
    if (!matchedCandidate.has(index)) differences.push({ type: 'additional', candidate: swatch })
  })
  return differences
}

export function compareSeriesImage(primary: SeriesImageAnalysis, candidate: SeriesImageAnalysis): SeriesImageComparison {
  const roles = new Set([...Object.keys(primary.roles), ...Object.keys(candidate.roles)])
  const roleDifferences = [...roles].sort().flatMap((role) => {
    const primaryHex = primary.roles[role]
    const candidateHex = candidate.roles[role]
    if (!primaryHex || !candidateHex) return []
    const distance = seriesColorDistance(primaryHex, candidateHex)
    return distance > ROLE_DIFFERENCE_THRESHOLD ? [{ role, primaryHex, candidateHex, distance }] : []
  })

  return {
    candidateId: candidate.id,
    colorDifferences: matchPalettes(primary.palette, candidate.palette),
    roleDifferences,
  }
}

export function compareSeries(images: SeriesImageAnalysis[], primaryId: string): SeriesComparisonReport {
  if (images.length < 2 || images.length > 6) throw new Error('Series requires between 2 and 6 images')
  if (new Set(images.map((image) => image.id)).size !== images.length) throw new Error('Series image IDs must be unique')
  const primary = images.find((image) => image.id === primaryId)
  if (!primary) throw new Error('Primary image must belong to the series')

  const comparisons = images
    .filter((image) => image.id !== primaryId)
    .map((image) => compareSeriesImage(primary, image))
    .sort((a, b) => a.candidateId.localeCompare(b.candidateId))

  const sharedColors = primary.palette.flatMap((primarySwatch) => {
    const matches = comparisons.map((comparison) => comparison.colorDifferences.find((difference) =>
      difference.type === 'shared' && difference.primary.hex === primarySwatch.hex,
    ))
    if (matches.some((match) => !match || match.type !== 'shared')) return []
    const validMatches = matches as SharedColorDifference[]
    const shares: Record<string, number> = { [primaryId]: primarySwatch.share }
    comparisons.forEach((comparison, index) => {
      shares[comparison.candidateId] = validMatches[index].candidate.share
    })
    const allShares = Object.values(shares)
    return [{
      primaryHex: primarySwatch.hex,
      shares,
      maxDistance: Math.max(...validMatches.map((match) => match.distance)),
      minShare: Math.min(...allShares),
      maxShare: Math.max(...allShares),
    }]
  })

  return { primaryId, sharedColors, comparisons }
}
