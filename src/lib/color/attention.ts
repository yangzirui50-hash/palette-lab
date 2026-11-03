import Color from 'colorjs.io'
import type { RGBPixel } from './extract'
import { ATTENTION_MODEL_VERSION, selectAttentionRegions } from './attentionRegions'
import type { AttentionRegionResult } from './attentionRegions'

export type { AttentionFocus } from './attentionRegions'
export type AttentionEvidence = AttentionRegionResult & {
  version: string
  centroid: { x: number; y: number } | null
  contrast: number
  heat: { width: number; height: number; values: Float64Array; peak: number }
}

// Palette-independent bottom-up evidence. No location/center prior, semantic
// detector or human-attention probability is implied by these model weights.
export function analyzeAttention(pixels: readonly (RGBPixel | null)[], width: number, height: number): AttentionEvidence {
  if (width < 1 || height < 1 || !Number.isInteger(width) || !Number.isInteger(height) || pixels.length !== width * height) throw new Error('Invalid attention dimensions')
  const scale = Math.min(64 / Math.max(width, height), 1)
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale))
  const n = w * h
  const counts = new Float64Array(n)
  const channels = [new Float64Array(n), new Float64Array(n), new Float64Array(n)]
  const cache = new Map<number, readonly number[]>()
  pixels.forEach((rgb, index) => {
    if (!rgb) return
    const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]
    let lab = cache.get(key)
    if (!lab) { lab = new Color('srgb', [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]).to('oklab').coords.map(value => value ?? 0); cache.set(key, lab) }
    const x = Math.min(w - 1, Math.floor((index % width) * w / width))
    const y = Math.min(h - 1, Math.floor(Math.floor(index / width) * h / height))
    const cell = y * w + x
    counts[cell] += 1
    channels.forEach((channel, c) => { channel[cell] += lab[c] })
  })
  channels.forEach(channel => channel.forEach((value, i) => { channel[i] = counts[i] ? value / counts[i] : 0 }))
  const valid = Array.from(counts.keys()).filter(i => counts[i] > 0)
  const distance = (a: number, b: readonly number[]) => Math.hypot(...channels.map((channel, c) => channel[a] - b[c]))
  // Quantized Lab histogram, weighted by opaque pixel count; alpha padding has
  // no color and cannot attract a focus or dilute the surrounding mean.
  const histogram = new Map<string, { lab: number[]; weight: number }>()
  valid.forEach(i => {
    const key = channels.map(channel => Math.round(channel[i] / .05)).join(',')
    const entry = histogram.get(key) ?? { lab: [0, 0, 0], weight: 0 }
    entry.weight += counts[i]
    channels.forEach((channel, c) => { entry.lab[c] += channel[i] * counts[i] })
    histogram.set(key, entry)
  })
  const bins = [...histogram.values()]
  const opaque = counts.reduce((sum, count) => sum + count, 0)
  bins.forEach(bin => { bin.lab = bin.lab.map(value => value / bin.weight) })
  const radii = [.04, .12].map(fraction => Math.max(1, Math.round(Math.min(w, h) * fraction)))
  const raw = new Float64Array(n)
  valid.forEach(i => {
    const x = i % w, y = Math.floor(i / w)
    const local = radii.map(radius => {
      const mean = [0, 0, 0]; let weight = 0
      for (let yy = Math.max(0, y - radius); yy <= Math.min(h - 1, y + radius); yy++) {
        for (let xx = Math.max(0, x - radius); xx <= Math.min(w - 1, x + radius); xx++) {
          const j = yy * w + xx
          weight += counts[j]
          channels.forEach((channel, c) => { mean[c] += channel[j] * counts[j] })
        }
      }
      return weight ? distance(i, mean.map(value => value / weight)) : 0
    })
    const global = bins.reduce((sum, bin) => sum + distance(i, bin.lab) * bin.weight, 0) / opaque
    raw[i] = .55 * (local[0] * .6 + local[1] * .4) + .45 * global
  })
  const ordered = valid.map(i => raw[i]).sort((a, b) => a - b)
  const floor = ordered[Math.floor(ordered.length / 2)] ?? 0
  // Absolute contrast floor prevents relative normalization from turning tiny
  // quantization/noise differences into a strong-looking hotspot.
  const values = raw.map((value, i) => counts[i] ? Math.max(0, value - floor - .008) : 0)
  const peak = values.reduce((max, value) => Math.max(max, value), 0)
  const heat = { width: w, height: h, values, peak }
  if (!opaque || peak < .018) {
    values.fill(0); heat.peak = 0
    return { ...selectAttentionRegions(heat, counts), version: ATTENTION_MODEL_VERSION, centroid: null, contrast: peak, heat }
  }
  const total = values.reduce((sum, value, i) => sum + value * counts[i], 0)
  let cx = 0, cy = 0
  values.forEach((value, i) => { const mass = value * counts[i]; cx += (i % w + .5) / w * mass; cy += (Math.floor(i / w) + .5) / h * mass })
  const centroid = { x: cx / total, y: cy / total }
  return { ...selectAttentionRegions(heat, counts), version: ATTENTION_MODEL_VERSION, centroid, contrast: peak, heat }
}
