import { analyzePaletteDistribution } from './distribution'
import type { PaletteDistribution } from './distribution'
import { buildSpatialAssignments } from './spatial'
import type { SpatialRoi } from './spatial'
import type { PaletteSwatch, RGBPixel } from './extract'
import { createRasterCanvas, loadRaster, rasterContext, rasterDataUrl } from './raster'
import type { RasterCanvas, RasterFrame } from './raster'

export type SpatialImageData = { pixels: Array<RGBPixel | null>; width: number; height: number }
export type SpatialViews = { url: string; detailUrl: string }
export type SpatialRenderCache = { frame: RasterFrame; overview: RasterFrame; components: number[][][]; distributions: PaletteDistribution[] }

export async function imageFileToSpatialData(file: File, maxEdge = 512, roi?: SpatialRoi): Promise<SpatialImageData> {
  const { pixels, width, height } = await loadRaster(file, maxEdge, roi)
  return { pixels, width, height }
}

function dimmed(frame: RasterFrame, factor: number) {
  const canvas = createRasterCanvas(frame.width, frame.height)
  const context = rasterContext(canvas)
  context.drawImage(frame.canvas, 0, 0)
  const image = context.getImageData(0, 0, frame.width, frame.height)
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const gray = (image.data[offset] + image.data[offset + 1] + image.data[offset + 2]) / 3 * factor
    image.data[offset] = gray
    image.data[offset + 1] = gray
    image.data[offset + 2] = gray
  }
  context.putImageData(image, 0, 0)
  return canvas
}

function regionCanvas(frame: RasterFrame, components: number[][][], selectedIndex: number, mode: 'largest' | 'all') {
  const canvas = dimmed(frame, 0.22)
  const context = rasterContext(canvas)
  const groups = components[selectedIndex] ?? []
  const largest = [...groups].sort((a, b) => b.length - a.length)[0]
  const allowed = mode === 'largest' && largest ? largest : groups.flat()
  const mask = createRasterCanvas(frame.width, frame.height)
  const maskContext = rasterContext(mask)
  maskContext.fillStyle = '#ffffff'
  allowed.forEach(index => maskContext.fillRect(index % frame.width, Math.floor(index / frame.width), 1, 1))
  const softMask = createRasterCanvas(frame.width, frame.height)
  const softContext = rasterContext(softMask)
  softContext.filter = 'blur(0.65px)'
  softContext.drawImage(mask, 0, 0)
  softContext.filter = 'none'
  // Feather inward only: a mask may never reveal colors outside its assignments.
  softContext.globalCompositeOperation = 'destination-in'
  softContext.drawImage(mask, 0, 0)
  const selected = createRasterCanvas(frame.width, frame.height)
  const selectedContext = rasterContext(selected)
  selectedContext.drawImage(frame.canvas, 0, 0)
  selectedContext.globalCompositeOperation = 'destination-in'
  selectedContext.drawImage(softMask, 0, 0)
  context.drawImage(selected, 0, 0)
  return canvas
}

function distributionCanvas(frame: RasterFrame, palette: PaletteSwatch[], selectedHex: string, distributions: PaletteDistribution[]) {
  const canvas = dimmed(frame, 0.26)
  const context = rasterContext(canvas)
  const selected = distributions.find(item => item.hex.toLowerCase() === selectedHex.toLowerCase())
  const color = palette.find(item => item.hex.toLowerCase() === selectedHex.toLowerCase())
  if (!selected || !color) return canvas
  const heatCanvas = createRasterCanvas(selected.heat.width, selected.heat.height)
  const heatContext = rasterContext(heatCanvas)
  const heat = heatContext.createImageData(selected.heat.width, selected.heat.height)
  selected.heat.values.forEach((value, index) => {
    const normalized = selected.heat.peak > 0 ? value / selected.heat.peak : 0
    heat.data.set([...color.rgb, Math.round(Math.pow(normalized, 0.72) * 220)], index * 4)
  })
  heatContext.putImageData(heat, 0, 0)
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = 0.85
  context.drawImage(heatCanvas, 0, 0, frame.width, frame.height)
  context.filter = 'blur(6px)'
  context.globalAlpha = 0.35
  context.drawImage(heatCanvas, 0, 0, frame.width, frame.height)
  context.filter = 'none'
  context.globalCompositeOperation = 'source-over'
  context.globalAlpha = 1
  context.strokeStyle = selected.hex
  context.lineWidth = 1.5
  selected.hotspots.forEach(hotspot => {
    context.beginPath()
    context.arc(hotspot.x * frame.width, hotspot.y * frame.height, 7 + hotspot.share * 18, 0, Math.PI * 2)
    context.stroke()
  })
  return canvas
}

async function composeViews(scoped: RasterCanvas, overview: RasterFrame, roi?: SpatialRoi): Promise<SpatialViews> {
  if (!roi) return { url: await rasterDataUrl(scoped), detailUrl: '' }
  const contextCanvas = dimmed(overview, 0.22)
  rasterContext(contextCanvas).drawImage(scoped, roi.x * overview.width, roi.y * overview.height, roi.width * overview.width, roi.height * overview.height)
  return { url: await rasterDataUrl(contextCanvas), detailUrl: await rasterDataUrl(scoped) }
}

export async function renderSpatialViews(file: File, palette: PaletteSwatch[], selectedHex: string, maxEdge = 512, mode: 'largest' | 'all' = 'all', roi?: SpatialRoi, view: 'regions' | 'distribution' = 'regions', cache?: SpatialRenderCache): Promise<SpatialViews> {
  const frame = cache?.frame ?? await loadRaster(file, maxEdge, roi)
  const overview = cache?.overview ?? (roi ? await loadRaster(file, maxEdge) : frame)
  const selectedIndex = palette.findIndex(color => color.hex.toLowerCase() === selectedHex.toLowerCase())
  if (selectedIndex < 0) throw new Error('所选颜色已失效，请重新选择')
  const canvas = view === 'distribution'
    ? distributionCanvas(frame, palette, selectedHex, cache?.distributions ?? analyzePaletteDistribution(frame.pixels, frame.width, frame.height, palette))
    : regionCanvas(frame, cache?.components ?? buildSpatialAssignments(frame.pixels, frame.width, frame.height, palette).components, selectedIndex, mode)
  return composeViews(canvas, overview, roi)
}

export async function createSpatialOverlay(file: File, palette: PaletteSwatch[], selectedHex: string, maxEdge = 512, mode: 'largest' | 'all' = 'largest', roi?: SpatialRoi) {
  return (await renderSpatialViews(file, palette, selectedHex, maxEdge, mode, roi)).url
}

export async function createDistributionOverlay(file: File, palette: PaletteSwatch[], selectedHex: string, maxEdge = 512, roi?: SpatialRoi) {
  return (await renderSpatialViews(file, palette, selectedHex, maxEdge, 'all', roi, 'distribution')).url
}
