import { buildSpatialAssignments } from './spatial'
import type { PaletteSwatch, RGBPixel } from './extract'

export type DistributionHotspot = {
  x: number
  y: number
  share: number
}

export type PaletteDistribution = {
  hex: string
  centroid: { x: number; y: number } | null
  dispersion: number
  hotspotCount: number
  hotspotShare: number
  significanceShare: number
  hotspots: DistributionHotspot[]
  heat: { width: number; height: number; values: Float64Array; peak: number }
}

function blurField(source: Float64Array, width: number, height: number, sigma: number) {
  const radius = Math.max(1, Math.ceil(sigma * 3))
  const kernel = Array.from({ length: radius * 2 + 1 }, (_, index) => Math.exp(-((index - radius) ** 2) / (2 * sigma ** 2)))
  const kernelSum = kernel.reduce((sum, value) => sum + value, 0)
  const normalized = kernel.map((value) => value / kernelSum)
  const horizontal = new Float64Array(source.length)
  const result = new Float64Array(source.length)
  const padding = source.reduce((sum, value) => sum + value, 0) / source.length

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleX = x + offset
        const value = sampleX < 0 || sampleX >= width ? padding : source[y * width + sampleX]
        sum += value * normalized[offset + radius]
      }
      horizontal[y * width + x] = sum
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleY = y + offset
        const value = sampleY < 0 || sampleY >= height ? padding : horizontal[sampleY * width + x]
        sum += value * normalized[offset + radius]
      }
      result[y * width + x] = sum
    }
  }
  return result
}

function localContrast(pixels: readonly (RGBPixel | null)[], width: number, height: number) {
  const lightness = new Float64Array(pixels.length)
  const counts = new Float64Array(pixels.length)
  pixels.forEach((pixel, index) => {
    if (!pixel) return
    lightness[index] = (0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]) / 255
    counts[index] = 1
  })
  const radius = 3
  const mean = new Float64Array(pixels.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      let count = 0
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const index = ny * width + nx
          sum += lightness[index]
          count += counts[index]
        }
      }
      const index = y * width + x
      mean[index] = count ? lightness[index] - sum / count : 0
    }
  }
  return mean.map((value) => Math.min(1, Math.abs(value) / 0.25))
}

function findHotspots(heat: Float64Array, width: number, height: number, total: number, peak: number) {
  if (total <= 1e-12 || peak <= 1e-12) return { count: 0, share: 0, hotspots: [] as DistributionHotspot[] }
  const mean = total / heat.length
  const variance = heat.reduce((sum, value) => sum + (value - mean) ** 2, 0) / heat.length
  const deviation = Math.sqrt(variance)
  const threshold = Math.max(peak * 0.58, mean + Math.max(deviation * 0.85, peak * 0.05))
  const visited = new Uint8Array(heat.length)
  const components: Array<{ weight: number; x: number; y: number; cells: number }> = []

  for (let start = 0; start < heat.length; start += 1) {
    if (visited[start] || heat[start] < threshold) continue
    const queue = [start]
    visited[start] = 1
    let head = 0
    let weight = 0
    let x = 0
    let y = 0
    let cells = 0
    while (head < queue.length) {
      const current = queue[head++]
      const currentX = current % width
      const currentY = Math.floor(current / width)
      const value = heat[current]
      weight += value
      x += ((currentX + 0.5) / width) * value
      y += ((currentY + 0.5) / height) * value
      cells += 1
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue
          const nx = currentX + dx
          const ny = currentY + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const next = ny * width + nx
          if (!visited[next] && heat[next] >= threshold) {
            visited[next] = 1
            queue.push(next)
          }
        }
      }
    }
    components.push({ weight, x: x / weight, y: y / weight, cells })
  }

  const significant = components
    .filter((component) => component.weight / total >= 0.03 || component.cells >= 2)
    .sort((a, b) => b.weight - a.weight)
  return {
    count: significant.length,
    share: significant.reduce((sum, component) => sum + component.weight, 0) / total,
    hotspots: significant.slice(0, 3).map((component) => ({
      x: component.x,
      y: component.y,
      share: component.weight / total,
    })),
  }
}

export function analyzePaletteDistribution(
  pixels: readonly (RGBPixel | null)[],
  width: number,
  height: number,
  palette: PaletteSwatch[],
): PaletteDistribution[] {
  if (pixels.length !== width * height) throw new Error('Pixel count must match distribution dimensions')
  if (palette.length === 0) return []
  // Isolated lights and stars are evidence here, not region-map noise.
  const { assignments } = buildSpatialAssignments(pixels, width, height, palette, false)
  const contrast = localContrast(pixels, width, height)
  const scale = Math.min(40 / width, 40 / height, 1)
  const gridWidth = Math.max(1, Math.round(width * scale))
  const gridHeight = Math.max(1, Math.round(height * scale))
  const cellSizes = new Float64Array(gridWidth * gridHeight)
  const grids = palette.map(() => new Float64Array(gridWidth * gridHeight))

  pixels.forEach((pixel, index) => {
    if (!pixel) return
    const x = index % width
    const y = Math.floor(index / width)
    const gridX = Math.min(gridWidth - 1, Math.floor(x / width * gridWidth))
    const gridY = Math.min(gridHeight - 1, Math.floor(y / height * gridHeight))
    const cell = gridY * gridWidth + gridX
    cellSizes[cell] += 1
    const label = assignments[index]
    if (label === 65535) return
    const chroma = Math.min(1, palette[label].oklch[1] / 0.18)
    grids[label][cell] += 0.65 + contrast[index] * 0.45 + chroma * 0.25
  })

  const distributions = palette.map((color, paletteIndex) => {
    const density = grids[paletteIndex].map((value, index) => cellSizes[index] ? value / cellSizes[index] : 0)
    const fine = blurField(density, gridWidth, gridHeight, 0.8)
    const medium = blurField(density, gridWidth, gridHeight, 1.8)
    const broad = blurField(density, gridWidth, gridHeight, 3.6)
    const heat = density.map((_, index) => fine[index] * 0.5 + medium[index] * 0.3 + broad[index] * 0.2)
    const total = heat.reduce((sum, value) => sum + value, 0)
    const peak = heat.reduce((max, value) => Math.max(max, value), 0)
    if (total <= 1e-12) {
      return {
        hex: color.hex,
        centroid: null,
        dispersion: 0,
        hotspotCount: 0,
        hotspotShare: 0,
        energy: 0,
        hotspots: [],
        heat: { width: gridWidth, height: gridHeight, values: heat, peak },
      }
    }

    let x = 0
    let y = 0
    heat.forEach((value, index) => {
      x += ((index % gridWidth + 0.5) / gridWidth) * value
      y += ((Math.floor(index / gridWidth) + 0.5) / gridHeight) * value
    })
    const centroid = { x: x / total, y: y / total }
    const variance = heat.reduce((sum, value, index) => {
      const dx = (index % gridWidth + 0.5) / gridWidth - centroid.x
      const dy = (Math.floor(index / gridWidth) + 0.5) / gridHeight - centroid.y
      return sum + (dx ** 2 + dy ** 2) * value
    }, 0) / total
    const hotspots = findHotspots(heat, gridWidth, gridHeight, total, peak)
    return {
      hex: color.hex,
      centroid,
      dispersion: Math.min(1, Math.sqrt(variance) / Math.sqrt(0.5)),
      hotspotCount: hotspots.count,
      hotspotShare: hotspots.share,
      energy: total,
      hotspots: hotspots.hotspots,
      heat: { width: gridWidth, height: gridHeight, values: heat, peak },
    }
  })
  const totalEnergy = distributions.reduce((sum, item) => sum + item.energy, 0)
  return distributions.map(({ energy, ...item }) => ({
    ...item,
    significanceShare: totalEnergy > 0 ? energy / totalEnergy : 0,
  }))
}
