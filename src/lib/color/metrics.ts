import Color from 'colorjs.io'
import type { PaletteSwatch } from './extract'

export type PaletteDiscrimination = {
  distance: number | null
  nearestHex: string | null
}

function oklab(swatch: PaletteSwatch) {
  const [lightness, a, b] = new Color('srgb', [
    swatch.rgb[0] / 255,
    swatch.rgb[1] / 255,
    swatch.rgb[2] / 255,
  ]).to('oklab').coords
  return [lightness ?? 0, a ?? 0, b ?? 0]
}

export function analyzePaletteDiscrimination(palette: PaletteSwatch[]): PaletteDiscrimination[] {
  const values = palette.map(oklab)
  return palette.map((_, index) => {
    let nearestHex: string | null = null
    let distance = Number.POSITIVE_INFINITY
    palette.forEach((candidate, candidateIndex) => {
      if (candidateIndex === index) return
      const current = Math.hypot(
        values[index][0] - values[candidateIndex][0],
        values[index][1] - values[candidateIndex][1],
        values[index][2] - values[candidateIndex][2],
      )
      if (current < distance) {
        distance = current
        nearestHex = candidate.hex
      }
    })
    return nearestHex ? { distance, nearestHex } : { distance: null, nearestHex: null }
  })
}
