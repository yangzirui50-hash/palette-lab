import Color from 'colorjs.io'
import type { PaletteSwatch, RGBPixel } from './extract'

export type SpatialRegionEvidence = {
  hex: string
  pixelCount: number
  share: number
  centroid: { x: number; y: number }
  bounds: { x: number; y: number; width: number; height: number }
  centerShare: number
  edgeShare: number
  largestComponentShare: number
  componentCount: number
  meanColorSeparation: number
}

function oklab(rgb: RGBPixel) {
  const [lightness, a, b] = new Color('srgb', [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]).to('oklab').coords
  return [lightness ?? 0, a ?? 0, b ?? 0] as const
}

function distanceSquared(a: readonly number[], b: readonly number[]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

export function analyzePaletteSpatial(pixels: readonly (RGBPixel | null)[], width: number, height: number, palette: PaletteSwatch[]): SpatialRegionEvidence[] {
  if (pixels.length !== width * height) throw new Error('Pixel count must match spatial dimensions')
  if (palette.length === 0) return []
  const opaqueCount = pixels.filter(Boolean).length
  const paletteLab = palette.map((color) => oklab(color.rgb))
  const states = palette.map(() => ({
    count: 0,
    x: 0,
    y: 0,
    minX: width,
    minY: height,
    maxX: -1,
    maxY: -1,
    center: 0,
    edge: 0,
    separation: 0,
  }))
  const assignments = new Uint16Array(pixels.length).fill(65535)

  pixels.forEach((pixel, index) => {
    if (!pixel) return
    const lab = oklab(pixel)
    const distances = paletteLab.map((candidate) => distanceSquared(lab, candidate))
    const sorted = [...distances].sort((a, b) => a - b)
    const nearest = distances.indexOf(sorted[0])
    const x = index % width
    const y = Math.floor(index / width)
    const state = states[nearest]
    state.count += 1
    state.x += x
    state.y += y
    state.minX = Math.min(state.minX, x)
    state.minY = Math.min(state.minY, y)
    state.maxX = Math.max(state.maxX, x)
    state.maxY = Math.max(state.maxY, y)
    if (x >= width * 0.25 && x < width * 0.75 && y >= height * 0.25 && y < height * 0.75) state.center += 1
    const normalizedX = width === 1 ? 0 : x / (width - 1)
    const normalizedY = height === 1 ? 0 : y / (height - 1)
    if (normalizedX <= 0.1 || normalizedX >= 0.9 || normalizedY <= 0.1 || normalizedY >= 0.9) state.edge += 1
    state.separation += Math.sqrt(sorted[1] ?? sorted[0])
    assignments[index] = nearest
  })

  return palette.map((color, paletteIndex) => {
    const state = states[paletteIndex]
    if (state.count === 0) {
      return {
        hex: color.hex,
        pixelCount: 0,
        share: 0,
        centroid: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        centerShare: 0,
        edgeShare: 0,
        largestComponentShare: 0,
        componentCount: 0,
        meanColorSeparation: 0,
      }
    }

    const mask = new Uint8Array(pixels.length)
    for (let index = 0; index < pixels.length; index += 1) {
      if (assignments[index] === paletteIndex) mask[index] = 1
    }
    const visited = new Uint8Array(pixels.length)
    const queue = new Int32Array(pixels.length)
    const componentSizes: number[] = []
    for (let start = 0; start < pixels.length; start += 1) {
      if (!mask[start] || visited[start]) continue
      let head = 0
      let tail = 0
      let size = 0
      queue[tail++] = start
      visited[start] = 1
      while (head < tail) {
        const current = queue[head++]
        size += 1
        const x = current % width
        const neighbors = [current - 1, current + 1, current - width, current + width]
        neighbors.forEach((next, direction) => {
          if (next < 0 || next >= pixels.length) return
          if (direction === 0 && x === 0) return
          if (direction === 1 && x === width - 1) return
          if (mask[next] && !visited[next]) {
            visited[next] = 1
            queue[tail++] = next
          }
        })
      }
      componentSizes.push(size)
    }
    const minimumSignificantSize = Math.max(1, Math.floor(state.count * 0.01))
    const significant = componentSizes.filter((size) => size >= minimumSignificantSize)

    return {
      hex: color.hex,
      pixelCount: state.count,
      share: opaqueCount > 0 ? state.count / opaqueCount : 0,
      centroid: { x: (state.x / state.count + 0.5) / width, y: (state.y / state.count + 0.5) / height },
      bounds: {
        x: state.minX / width,
        y: state.minY / height,
        width: (state.maxX - state.minX + 1) / width,
        height: (state.maxY - state.minY + 1) / height,
      },
      centerShare: state.center / state.count,
      edgeShare: state.edge / state.count,
      largestComponentShare: Math.max(...componentSizes) / state.count,
      componentCount: significant.length,
      meanColorSeparation: state.separation / state.count,
    }
  })
}
