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

const distanceSquared = (a: RGBPixel, b: RGBPixel) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

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

function initialCenters(samples: WeightedSample[], count: number): RGBPixel[] {
  const remaining = [...samples]
  const centers: RGBPixel[] = []
  const first = remaining.reduce((best, sample) => sample.weight > best.weight ? sample : best)
  centers.push(first.oklch)

  while (centers.length < count && remaining.length > centers.length) {
    const next = remaining.reduce((best, sample) => {
      const nearest = Math.min(...centers.map((center) => distanceSquared(sample.oklch, center)))
      const score = nearest * Math.sqrt(sample.weight)
      return score > best.score ? { sample, score } : best
    }, { sample: remaining[0], score: -1 })
    centers.push(next.sample.oklch)
  }

  return centers
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

  let centers = initialCenters(samples, colorCount)
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
      const members = samples.filter((_, index) => assignments[index] === centerIndex)
      if (members.length === 0) return center
      const weight = members.reduce((sum, sample) => sum + sample.weight, 0)
      const mean = (channel: 0 | 1 | 2) =>
        members.reduce((sum, sample) => sum + sample.oklch[channel] * sample.weight, 0) / weight
      return [mean(0), mean(1), mean(2)]
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
      const rgb: RGBPixel = [mean(0), mean(1), mean(2)]
      return {
        hex: toHex(rgb),
        rgb,
        oklch: center,
        share: weight / total,
      }
    })
    .filter((swatch): swatch is PaletteSwatch => swatch !== null)
    .sort((a, b) => b.share - a.share)
}
