import Color from 'colorjs.io'

export type RGBPixel = readonly [number, number, number]

export type PaletteSwatch = {
  hex: string
  rgb: RGBPixel
  oklch: RGBPixel
  share: number
}

type WeightedSample = {
  rgb: RGBPixel
  oklch: RGBPixel
  weight: number
}

const toHex = (rgb: RGBPixel) =>
  `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`

const toOklch = (rgb: RGBPixel): RGBPixel => {
  const [l, a, b] = new Color('srgb', [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]).to('oklch').coords
  return [l ?? 0, a ?? 0, b ?? 0]
}

const toOklab = (lch: RGBPixel): RGBPixel => {
  const radians = lch[2] * Math.PI / 180
  return [lch[0], lch[1] * Math.cos(radians), lch[1] * Math.sin(radians)]
}

const fromOklab = (lab: RGBPixel): RGBPixel => {
  const chroma = Math.hypot(lab[1], lab[2])
  const hue = ((Math.atan2(lab[2], lab[1]) * 180 / Math.PI) + 360) % 360
  return [lab[0], chroma, hue]
}

const toRgb = (lch: RGBPixel): RGBPixel => new Color('oklch', [lch[0], lch[1], lch[2]]).to('srgb').coords
  .map((channel) => Math.max(0, Math.min(255, Math.round((channel ?? 0) * 255)))) as unknown as RGBPixel

const distanceSquared = (a: RGBPixel, b: RGBPixel) => {
  const labA = toOklab(a)
  const labB = toOklab(b)
  return (labA[0] - labB[0]) ** 2 + (labA[1] - labB[1]) ** 2 + (labA[2] - labB[2]) ** 2
}

function buildSamples(pixels: readonly RGBPixel[], maxSamples = 8000): WeightedSample[] {
  const stride = Math.max(1, Math.ceil(pixels.length / maxSamples))
  const histogram = new Map<string, { rgb: RGBPixel; weight: number }>()

  for (let index = 0; index < pixels.length; index += stride) {
    const source = pixels[index]
    const rgb = source.map((channel) => Math.round(channel / 8) * 8) as unknown as RGBPixel
    const clamped = rgb.map((channel) => Math.min(255, channel)) as unknown as RGBPixel
    const key = clamped.join(',')
    const existing = histogram.get(key)
    if (existing) existing.weight += 1
    else histogram.set(key, { rgb: clamped, weight: 1 })
  }

  return [...histogram.values()].map((sample) => ({
    ...sample,
    oklch: toOklch(sample.rgb),
  }))
}

function findSalientCenters(samples: WeightedSample[], dominant: RGBPixel): RGBPixel[] {
  const totalWeight = samples.reduce((sum, sample) => sum + sample.weight, 0)
  const bins = new Map<number, { weight: number; score: number; center: RGBPixel }>()
  for (const sample of samples) {
    const [lightness, chroma, hue] = sample.oklch
    if (chroma < 0.08) continue
    const binIndex = Math.floor(hue / 30)
    const score = sample.weight * chroma
    const lab = toOklab(sample.oklch)
    const bin = bins.get(binIndex) ?? { weight: 0, score: 0, center: [0, 0, 0] }
    bin.weight += sample.weight
    bin.score += score
    bin.center = [
      bin.center[0] + lightness * score,
      bin.center[1] + lab[1] * score,
      bin.center[2] + lab[2] * score,
    ]
    bins.set(binIndex, bin)
  }
  return [...bins.values()]
    .filter((bin) => bin.weight / totalWeight >= 0.005 && bin.score > 0)
    .sort((a, b) => (b.score / b.weight) - (a.score / a.weight))
    .map((bin) => fromOklab(bin.center.map((channel) => channel / bin.score) as unknown as RGBPixel))
    .filter((center) => distanceSquared(center, dominant) > 0.0064)
}

function initialCenters(samples: WeightedSample[], count: number): { centers: RGBPixel[]; protectedCount: number } {
  const remaining = [...samples]
  const centers: RGBPixel[] = []
  const first = remaining.reduce((best, sample) => sample.weight > best.weight ? sample : best)
  centers.push(first.oklch)
  for (const salient of findSalientCenters(samples, first.oklch)) {
    if (centers.length >= count) break
    if (centers.every((center) => distanceSquared(center, salient) > 0.0064)) centers.push(salient)
  }

  const protectedCount = centers.length
  while (centers.length < count && remaining.length > centers.length) {
    const next = remaining.reduce((best, sample) => {
      const nearest = Math.min(...centers.map((center) => distanceSquared(sample.oklch, center)))
      const score = nearest * Math.sqrt(sample.weight)
      return score > best.score ? { sample, score } : best
    }, { sample: remaining[0], score: -1 })
    centers.push(next.sample.oklch)
  }

  return { centers, protectedCount }
}

function directSwatches(samples: WeightedSample[]): PaletteSwatch[] {
  const total = samples.reduce((sum, sample) => sum + sample.weight, 0)
  return samples
    .map((sample) => ({
      hex: toHex(sample.rgb),
      rgb: sample.rgb,
      oklch: sample.oklch,
      share: sample.weight / total,
    }))
    .sort((a, b) => b.share - a.share)
}

export function extractPalette(pixels: readonly RGBPixel[], colorCount = 6): PaletteSwatch[] {
  if (pixels.length === 0) throw new Error('At least one pixel is required')
  if (!Number.isInteger(colorCount) || colorCount < 2 || colorCount > 8) {
    throw new Error('colorCount must be an integer between 2 and 8')
  }

  const samples = buildSamples(pixels)
  if (samples.length <= colorCount) return directSwatches(samples)

  const initialization = initialCenters(samples, colorCount)
  let centers = initialization.centers
  const protectedCount = initialization.protectedCount
  const assignments = new Array<number>(samples.length).fill(0)

  for (let iteration = 0; iteration < 14; iteration += 1) {
    samples.forEach((sample, index) => {
      let nearest = 0
      let nearestDistance = Number.POSITIVE_INFINITY
      centers.forEach((center, centerIndex) => {
        const distance = distanceSquared(sample.oklch, center)
        if (distance < nearestDistance) {
          nearest = centerIndex
          nearestDistance = distance
        }
      })
      assignments[index] = nearest
    })

    const nextCenters = centers.map((center, centerIndex): RGBPixel => {
      if (centerIndex > 0 && centerIndex < protectedCount) return center
      const members = samples.filter((_, index) => assignments[index] === centerIndex)
      if (members.length === 0) return center
      const weight = members.reduce((sum, sample) => sum + sample.weight, 0)
      const lab = [0, 1, 2].map((channel) =>
        members.reduce((sum, sample) => sum + toOklab(sample.oklch)[channel] * sample.weight, 0) / weight,
      ) as unknown as RGBPixel
      return fromOklab(lab)
    })

    const changed = nextCenters.some((center, index) => distanceSquared(center, centers[index]) > 1e-10)
    centers = nextCenters
    if (!changed) break
  }

  const total = samples.reduce((sum, sample) => sum + sample.weight, 0)
  return centers
    .map((center, centerIndex) => {
      const members = samples.filter((_, index) => assignments[index] === centerIndex)
      const weight = members.reduce((sum, sample) => sum + sample.weight, 0)
      if (members.length === 0) return null
      const mean = (channel: 0 | 1 | 2) =>
        Math.round(members.reduce((sum, sample) => sum + sample.rgb[channel] * sample.weight, 0) / weight)
      const rgb = centerIndex > 0 && centerIndex < protectedCount ? toRgb(center) : [mean(0), mean(1), mean(2)] as RGBPixel
      return {
        hex: toHex(rgb),
        rgb,
        oklch: toOklch(rgb),
        share: weight / total,
      }
    })
    .filter((swatch): swatch is PaletteSwatch => swatch !== null)
    .sort((a, b) => b.share - a.share)
}
