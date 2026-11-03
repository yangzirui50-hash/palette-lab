export const ATTENTION_MODEL_VERSION = '1.1.0'
export type AttentionFocus = {
  x: number; y: number; share: number
  bounds: { x: number; y: number; width: number; height: number }
}
export type AttentionRegionResult = {
  state: 'empty' | 'uniform' | 'distributed' | 'uncertain' | 'single' | 'multiple'
  reason: 'no-opaque-pixels' | 'low-contrast' | 'broad-response' | 'fragmented-response' | 'ambiguous-location' | 'localized-response'
  foci: AttentionFocus[]
  concentration: number
  diagnostics: { strongSupportShare: number; grownSupportShare: number; componentCount: number; qualifiedCount: number }
}
export type AttentionHeat = { width: number; height: number; values: Float64Array; peak: number }

// Grow only measured response connected to a strong seed. This joins interrupted
// strokes through weaker measured support, without dilation across empty space.
export function selectAttentionRegions(heat: AttentionHeat, counts: Float64Array): AttentionRegionResult {
  const { width, height, values, peak } = heat
  if (values.length !== width * height || counts.length !== values.length) throw new Error('Invalid focus grid')
  const opaque = counts.reduce((sum, count) => sum + count, 0)
  const total = values.reduce((sum, value, i) => sum + value * counts[i], 0)
  const diagnostics = { strongSupportShare: 0, grownSupportShare: 0, componentCount: 0, qualifiedCount: 0 }
  if (!opaque) return { state: 'empty', reason: 'no-opaque-pixels', foci: [], concentration: 0, diagnostics }
  if (peak < .018 || !total) return { state: 'uniform', reason: 'low-contrast', foci: [], concentration: 0, diagnostics }
  diagnostics.strongSupportShare = counts.reduce((sum, count, i) => sum + (values[i] >= peak * .5 ? count : 0), 0) / opaque
  const components = (fraction: number) => {
    const visited = new Uint8Array(values.length), found: number[][] = []
    for (let start = 0; start < values.length; start++) {
      if (visited[start] || !counts[start] || values[start] < peak * fraction) continue
      const queue = [start]; visited[start] = 1
      for (let head = 0; head < queue.length; head++) {
        const i = queue[head], xx = i % width, yy = Math.floor(i / width)
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = xx + dx, ny = yy + dy, j = ny * width + nx
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || visited[j] || !counts[j] || values[j] < peak * fraction) continue
          visited[j] = 1; queue.push(j)
        }
      }
      found.push(queue)
    }
    return found
  }
  const measure = (queue: number[]) => {
    let mass = 0, x = 0, y = 0, seed = false, pixels = 0
    let minX = width, minY = height, maxX = 0, maxY = 0
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head], xx = i % width, yy = Math.floor(i / width), weight = values[i] * counts[i]
      mass += weight; x += (xx + .5) / width * weight; y += (yy + .5) / height * weight; pixels += counts[i]
      seed ||= values[i] >= peak * .5
      minX = Math.min(minX, xx); maxX = Math.max(maxX, xx); minY = Math.min(minY, yy); maxY = Math.max(maxY, yy)
    }
    const cx = x / mass, cy = y / mass
    const centerCell = Math.min(height - 1, Math.floor(cy * height)) * width + Math.min(width - 1, Math.floor(cx * width))
    let ax = cx, ay = cy, stable = queue.includes(centerCell)
    if (!stable) {
      // A weighted center can lie in an L/ring's empty gap. Project only to a
      // unique closest supported cell, breaking distance ties by measured heat.
      // Symmetric unresolved ties abstain rather than selecting a scan-order side.
      const distance = (i: number) => ((i % width + .5) / width - cx) ** 2 + ((Math.floor(i / width) + .5) / height - cy) ** 2
      const nearest = Math.min(...queue.map(distance)), near = queue.filter(i => Math.abs(distance(i) - nearest) < 1e-12)
      const strongest = Math.max(...near.map(i => values[i])), best = near.filter(i => Math.abs(values[i] - strongest) < 1e-12)
      if (best.length === 1) { ax = (best[0] % width + .5) / width; ay = (Math.floor(best[0] / width) + .5) / height; stable = true }
    }
    return { x: ax, y: ay, share: mass / total, support: pixels / opaque, stable, seed,
      bounds: { x: minX / width, y: minY / height, width: (maxX - minX + 1) / width, height: (maxY - minY + 1) / height } }
  }
  const strong = components(.5).map(indices => ({ indices, measured: measure(indices) }))
  const leadingStrongShare = Math.max(0, ...strong.map(component => component.measured.share))
  const grown = components(.35).map(indices => ({ indices, measured: measure(indices) })).filter(component => component.measured.seed)
  const parent = new Int32Array(values.length).fill(-1)
  grown.forEach((component, index) => component.indices.forEach(i => { parent[i] = index }))
  const candidates: ReturnType<typeof measure>[] = []
  grown.forEach((component, index) => {
    const protectedCores = strong.filter(core => parent[core.indices[0]] === index && core.measured.share >= .08 && core.measured.share >= leadingStrongShare * .3)
    // Weak bridges must not collapse previously distinct, independently qualified
    // strong targets. Only sub-threshold fragments are merged into a grown region.
    candidates.push(...(protectedCores.length >= 2 ? protectedCores.map(core => core.measured) : [component.measured]))
  })
  candidates.sort((a, b) => b.share - a.share)
  const eligible = candidates.filter(candidate => candidate.share >= .08 && candidate.share >= candidates[0].share * .3)
  const concentration = grown.reduce((sum, component) => sum + component.measured.share, 0)
  diagnostics.grownSupportShare = grown.reduce((sum, component) => sum + component.measured.support, 0)
  diagnostics.componentCount = candidates.length; diagnostics.qualifiedCount = eligible.length
  if (diagnostics.strongSupportShare > .4 || eligible.some(candidate => candidate.support > .4)) {
    return { state: 'distributed', reason: 'broad-response', foci: [], concentration, diagnostics }
  }
  const foci = eligible.filter(candidate => candidate.stable).slice(0, 3).map(({ x, y, share, bounds }) => ({ x, y, share, bounds }))
  if (!foci.length) return { state: 'uncertain', reason: eligible.length ? 'ambiguous-location' : 'fragmented-response', foci, concentration, diagnostics }
  return { state: foci.length > 1 ? 'multiple' : 'single', reason: 'localized-response', foci, concentration, diagnostics }
}
