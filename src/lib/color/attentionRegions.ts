export const ATTENTION_MODEL_VERSION = '1.2.0-prototype'
export const ATTENTION_SCOPE = 'contrast-only' as const
export type AttentionFocus = {
  x: number; y: number; share: number
  bounds: { x: number; y: number; width: number; height: number }
}
export type AttentionResponseRegion = {
  bounds: AttentionFocus['bounds']
  share: number
  geometry: 'compact' | 'extended' | 'outline' | 'frame'
  // Row-major cells on the contrast grid; these are measured support, not an
  // object segmentation. Transparent/zero-response cells are never filled.
  cells: number[]
  coreCount: number
}
export type AttentionRegionResult = {
  state: 'empty' | 'uniform' | 'distributed' | 'uncertain' | 'single' | 'multiple' | 'regions'
  reason: 'no-opaque-pixels' | 'low-contrast' | 'broad-response' | 'fragmented-response' | 'ambiguous-location' | 'localized-response' | 'extended-response'
  foci: AttentionFocus[]
  regions: AttentionResponseRegion[]
  concentration: number
  diagnostics: { strongSupportShare: number; grownSupportShare: number; componentCount: number; qualifiedCount: number }
}
export type AttentionHeat = { width: number; height: number; values: Float64Array; peak: number }

// Grow only measured response connected to a strong seed. This joins interrupted
// strokes through weaker measured support, without dilation across empty space.
export function selectAttentionRegions(heat: AttentionHeat, counts: Float64Array): AttentionRegionResult {
  const { width, height, values, peak } = heat
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || values.length !== width * height || counts.length !== values.length || !Number.isFinite(peak) || peak < 0 || values.some(value => !Number.isFinite(value) || value < 0) || counts.some(count => !Number.isFinite(count) || count < 0)) throw new Error('Invalid focus grid')
  const opaque = counts.reduce((sum, count) => sum + count, 0)
  const total = values.reduce((sum, value, i) => sum + value * counts[i], 0)
  const diagnostics = { strongSupportShare: 0, grownSupportShare: 0, componentCount: 0, qualifiedCount: 0 }
  if (!opaque) return { state: 'empty', reason: 'no-opaque-pixels', foci: [], regions: [], concentration: 0, diagnostics }
  if (peak < .018 || !total) return { state: 'uniform', reason: 'low-contrast', foci: [], regions: [], concentration: 0, diagnostics }
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
    const stable = queue.includes(centerCell)
    const spanX = (maxX - minX + 1) / width, spanY = (maxY - minY + 1) / height
    const fill = queue.length / ((maxX - minX + 1) * (maxY - minY + 1))
    // Geometry, not semantic identity: a thin connected outline needs a region,
    // not a projected point. Compact targets at an image edge remain eligible.
    const sideCoverage = [
      new Set(queue.filter(i => i % width === 0).map(i => Math.floor(i / width))).size / height,
      new Set(queue.filter(i => i % width === width - 1).map(i => Math.floor(i / width))).size / height,
      new Set(queue.filter(i => Math.floor(i / width) === 0).map(i => i % width)).size / width,
      new Set(queue.filter(i => Math.floor(i / width) === height - 1).map(i => i % width)).size / width,
    ]
    const geometry: AttentionResponseRegion['geometry'] = spanX >= .85 && spanY >= .85 && sideCoverage.every(coverage => coverage >= .65) ? 'frame'
      : !stable ? 'outline' : Math.max(spanX, spanY) > .55 && fill < .5 ? 'extended' : 'compact'
    return { x: cx, y: cy, share: mass / total, support: pixels / opaque, stable, seed, geometry,
      bounds: { x: minX / width, y: minY / height, width: (maxX - minX + 1) / width, height: (maxY - minY + 1) / height } }
  }
  const strong = components(.5).map(indices => ({ indices, measured: measure(indices) }))
  const leadingStrongShare = Math.max(0, ...strong.map(component => component.measured.share))
  const grown = components(.35).map(indices => ({ indices, measured: measure(indices) })).filter(component => component.measured.seed)
  const parent = new Int32Array(values.length).fill(-1)
  grown.forEach((component, index) => component.indices.forEach(i => { parent[i] = index }))
  const candidates: Array<ReturnType<typeof measure> & { indices: number[]; parent: number }> = []
  grown.forEach((component, index) => {
    const protectedCores = strong.filter(core => parent[core.indices[0]] === index && core.measured.share >= .08 && core.measured.share >= leadingStrongShare * .3)
    // Weak bridges must not collapse previously distinct, independently qualified
    // strong targets. Only sub-threshold fragments are merged into a grown region.
    candidates.push(...(protectedCores.length >= 2
      ? protectedCores.map(core => ({ ...core.measured, indices: core.indices, parent: index }))
      : [{ ...component.measured, indices: component.indices, parent: index }]))
  })
  candidates.sort((a, b) => b.share - a.share)
  const eligible = candidates.filter(candidate => candidate.share >= .08 && candidate.share >= candidates[0].share * .3)
  const concentration = grown.reduce((sum, component) => sum + component.measured.share, 0)
  diagnostics.grownSupportShare = grown.reduce((sum, component) => sum + component.measured.support, 0)
  diagnostics.componentCount = candidates.length; diagnostics.qualifiedCount = eligible.length
  if (diagnostics.strongSupportShare > .4 || eligible.some(candidate => candidate.support > .4)) {
    return { state: 'distributed', reason: 'broad-response', foci: [], regions: [], concentration, diagnostics }
  }
  // Deduplicate by measured connected parent only. A shared parent is not proof
  // of one object, just as separate cores are not proof of separate people.
  const parents = [...new Set(eligible.map(candidate => candidate.parent))].slice(0, 3)
  const regions: AttentionResponseRegion[] = parents.map(index => {
    const component = grown[index]
    return { bounds: component.measured.bounds, share: component.measured.share, geometry: component.measured.geometry, cells: [...component.indices].sort((a, b) => a - b), coreCount: eligible.filter(candidate => candidate.parent === index).length }
  })
  const foci = eligible.filter(candidate => parents.includes(candidate.parent) && candidate.stable && candidate.geometry === 'compact').slice(0, 3).map(({ x, y, share, bounds }) => ({ x, y, share, bounds }))
  if (!regions.length) return { state: 'uncertain', reason: 'fragmented-response', foci, regions, concentration, diagnostics }
  if (!foci.length) return { state: 'regions', reason: 'extended-response', foci, regions, concentration, diagnostics }
  return { state: foci.length > 1 ? 'multiple' : 'single', reason: 'localized-response', foci, regions, concentration, diagnostics }
}
