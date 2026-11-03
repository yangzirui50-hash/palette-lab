import Color from 'colorjs.io'
import type { PaletteSwatch, RGBPixel } from './extract'

export type SpatialRegionEvidence = {
  hex: string
  pixelCount: number
  share: number
  centroid: { x: number; y: number }
  dominantCentroid: { x: number; y: number }
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

function forEachNeighbor(index: number, width: number, height: number, callback: (next: number) => void) {
  const x = index % width
  const y = Math.floor(index / width)
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      callback(ny * width + nx)
    }
  }
}

export type SpatialRoi = { x: number; y: number; width: number; height: number }

export function cropSpatialPixels(pixels: readonly (RGBPixel | null)[], width: number, height: number, roi: SpatialRoi) {
  const x = Math.max(0, Math.min(width - 1, Math.floor(roi.x * width)))
  const y = Math.max(0, Math.min(height - 1, Math.floor(roi.y * height)))
  const cropWidth = Math.max(1, Math.min(width - x, Math.ceil(roi.width * width)))
  const cropHeight = Math.max(1, Math.min(height - y, Math.ceil(roi.height * height)))
  const cropped: Array<RGBPixel | null> = []
  for (let row = y; row < y + cropHeight; row += 1) {
    for (let column = x; column < x + cropWidth; column += 1) {
      cropped.push(pixels[row * width + column])
    }
  }
  return { pixels: cropped, width: cropWidth, height: cropHeight, offsetX: x, offsetY: y }
}

export function buildSpatialAssignments(pixels: readonly (RGBPixel | null)[], width: number, height: number, palette: PaletteSwatch[], denoise = true) {
  if (pixels.length !== width * height) throw new Error('Pixel count must match spatial dimensions')
  const paletteLab = palette.map((color) => oklab(color.rgb))
  const separations = new Float64Array(pixels.length)
  const confidence = new Float64Array(pixels.length)
  let assignments = new Uint16Array(pixels.length).fill(65535)

  pixels.forEach((pixel, index) => {
    if (!pixel) return
    const lab = oklab(pixel)
    const distances = paletteLab.map((candidate) => distanceSquared(lab, candidate))
    const sorted = [...distances].sort((a, b) => a - b)
    const nearest = distances.indexOf(sorted[0])
    const nearestDistance = Math.sqrt(sorted[0])
    const pixelChroma = Math.hypot(lab[1], lab[2])
    const pixelHue = ((Math.atan2(lab[2], lab[1]) * 180 / Math.PI) + 360) % 360
    const hueDistanceTo = (candidate: RGBPixel) => Math.abs(((pixelHue - candidate[2] + 540) % 360) - 180)
    const candidate = palette[nearest].oklch
    // Dim chromatic colors can have a small absolute distance despite opposing
    // hue families. Do not waive that conflict just because both are dark.
    const hueConflict = candidate[1] >= 0.02 && hueDistanceTo(candidate) > 75
    const chromaticConflict = pixelChroma >= 0.02 && (hueConflict ||
      (nearestDistance > 0.045 && (candidate[1] < 0.02 || hueDistanceTo(candidate) > 55)))
    let assigned = nearest
    let assignedDistance = nearestDistance
    let reliable = palette.length <= 1 || (nearestDistance <= 0.14 && !chromaticConflict)
    if (!reliable && pixelChroma >= 0.02) {
      const compatible = palette.map((color, candidateIndex) => ({
        candidateIndex,
        distance: Math.sqrt(distances[candidateIndex]),
        hueDistance: hueDistanceTo(color.oklch),
        chroma: color.oklch[1],
      })).filter((option) => option.chroma >= 0.02 && option.hueDistance <= 50 && option.distance <= 0.18)
        .sort((a, b) => (a.distance + a.hueDistance / 180 * 0.02) - (b.distance + b.hueDistance / 180 * 0.02))[0]
      if (compatible) {
        assigned = compatible.candidateIndex
        assignedDistance = compatible.distance
        reliable = true
      }
    }
    if (reliable) assignments[index] = assigned
    confidence[index] = reliable ? 1 - Math.min(1, assignedDistance / 0.18) : 0
    separations[index] = Math.sqrt(sorted[1] ?? sorted[0])
  })

  const visited = new Uint8Array(pixels.length)
  const queue = new Int32Array(pixels.length)
  const smallComponents = new Set<number>()
  for (let start = 0; start < pixels.length; start += 1) {
    if (assignments[start] === 65535 || visited[start]) continue
    const label = assignments[start]
    const component: number[] = []
    let head = 0
    let tail = 0
    queue[tail++] = start
    visited[start] = 1
    while (head < tail) {
      const current = queue[head++]
      component.push(current)
      forEachNeighbor(current, width, height, (next) => {
        if (assignments[next] === label && !visited[next]) {
          visited[next] = 1
          queue[tail++] = next
        }
      })
    }
    if (component.length <= 2) component.forEach((index) => smallComponents.add(index))
  }

  for (let pass = 0; denoise && pass < 2; pass += 1) {
    const next = new Uint16Array(assignments)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        if (assignments[index] === 65535 || !smallComponents.has(index)) continue
        const counts = new Map<number, number>()
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
            const label = assignments[ny * width + nx]
            if (label !== 65535) counts.set(label, (counts.get(label) ?? 0) + 1)
          }
        }
        const majority = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
        if (majority && majority[1] >= 6) {
          const pixel = pixels[index]
          if (!pixel) continue
          const lab = oklab(pixel)
          const candidate = palette[majority[0]].oklch
          const chroma = Math.hypot(lab[1], lab[2])
          const hue = ((Math.atan2(lab[2], lab[1]) * 180 / Math.PI) + 360) % 360
          const hueGap = Math.abs(((hue - candidate[2] + 540) % 360) - 180)
          const compatible = chroma < 0.02 ? candidate[1] < 0.035 : candidate[1] >= 0.02 && hueGap <= 30
          const currentDistance = Math.sqrt(distanceSquared(lab, paletteLab[assignments[index]]))
          const candidateDistance = Math.sqrt(distanceSquared(lab, paletteLab[majority[0]]))
          // Neighborhood agreement cannot override reliable, incompatible color evidence.
          if (compatible && candidateDistance <= currentDistance + 0.01) next[index] = majority[0]
        }
      }
    }
    assignments = next
  }
  const components = Array.from({ length: palette.length }, () => [] as number[][])
  const componentVisited = new Uint8Array(pixels.length)
  const componentQueue = new Int32Array(pixels.length)
  for (let start = 0; start < pixels.length; start += 1) {
    const label = assignments[start]
    if (label === 65535 || componentVisited[start]) continue
    const indices: number[] = []
    let head = 0
    let tail = 0
    componentQueue[tail++] = start
    componentVisited[start] = 1
    while (head < tail) {
      const current = componentQueue[head++]
      indices.push(current)
      forEachNeighbor(current, width, height, (next) => {
        if (assignments[next] === label && !componentVisited[next]) {
          componentVisited[next] = 1
          componentQueue[tail++] = next
        }
      })
    }
    components[label].push(indices)
  }
  return { assignments, separations, confidence, components }
}

export function analyzePaletteSpatialDetailed(pixels: readonly (RGBPixel | null)[], width: number, height: number, palette: PaletteSwatch[]) {
  if (pixels.length !== width * height) throw new Error('Pixel count must match spatial dimensions')
  if (palette.length === 0) return { regions: [], unassignedShare: pixels.some(Boolean) ? 1 : 0, assignments: new Uint16Array(pixels.length).fill(65535), components: [] }
  const opaqueCount = pixels.filter(Boolean).length
  const { assignments, separations, components } = buildSpatialAssignments(pixels, width, height, palette)
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

  pixels.forEach((pixel, index) => {
    if (!pixel) return
    const nearest = assignments[index]
    if (nearest === 65535) return
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
    state.separation += separations[index]
  })

  const regions = palette.map((color, paletteIndex) => {
    const state = states[paletteIndex]
    if (state.count === 0) {
      return {
        hex: color.hex,
        pixelCount: 0,
        share: 0,
        centroid: { x: 0, y: 0 },
        dominantCentroid: { x: 0, y: 0 },
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
        forEachNeighbor(current, width, height, (next) => {
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
    const centroid = { x: (state.x / state.count + 0.5) / width, y: (state.y / state.count + 0.5) / height }
    const dominant = [...components[paletteIndex]].sort((a, b) => b.length - a.length)[0]
    const dominantCentroid = dominant ? {
      x: (dominant.reduce((sum, index) => sum + index % width, 0) / dominant.length + 0.5) / width,
      y: (dominant.reduce((sum, index) => sum + Math.floor(index / width), 0) / dominant.length + 0.5) / height,
    } : centroid

    return {
      hex: color.hex,
      pixelCount: state.count,
      share: opaqueCount > 0 ? state.count / opaqueCount : 0,
      centroid,
      dominantCentroid,
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
  const unassignedCount = pixels.reduce((count, pixel, index) => count + (pixel && assignments[index] === 65535 ? 1 : 0), 0)
  return { regions, unassignedShare: opaqueCount ? unassignedCount / opaqueCount : 0, assignments, components }
}

export function analyzePaletteSpatial(pixels: readonly (RGBPixel | null)[], width: number, height: number, palette: PaletteSwatch[]): SpatialRegionEvidence[] {
  return analyzePaletteSpatialDetailed(pixels, width, height, palette).regions
}
