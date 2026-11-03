import { extractPalette } from './extract'
import { validateImageFile } from './image'
import { loadRaster, createRasterCanvas, rasterContext, rasterDataUrl } from './raster'
import { analyzeAttention } from './attention'
import { analyzePaletteSpatialDetailed } from './spatial'
import { analyzePaletteDistribution } from './distribution'
import { renderSpatialViews } from './spatialOverlay'
import type { SpatialRenderCache } from './spatialOverlay'
import type { ColorResponse, ColorTask, SpatialResult } from './analysisClient'
import { analyzeImagePalette } from './palettePipeline'

let cached: { key: string; result: SpatialResult; render: SpatialRenderCache } | null = null

async function scope(task: Exclude<ColorTask, { kind: 'palette' }>) {
  const key = `${task.file.name}:${task.file.size}:${task.file.lastModified}|${task.palette.map(color => color.hex).join(',')}|${JSON.stringify(task.roi)}`
  if (cached?.key === key) return cached
  const frame = await loadRaster(task.file, 512, task.roi)
  const pixels = frame.pixels.filter(pixel => pixel !== null)
  if (!pixels.length) throw new Error('框选区域内没有可分析的不透明像素')
  const palette = task.roi ? extractPalette(pixels, Math.max(2, Math.min(8, task.palette.length))) : task.palette
  const spatial = analyzePaletteSpatialDetailed(frame.pixels, frame.width, frame.height, palette)
  const distributions = analyzePaletteDistribution(frame.pixels, frame.width, frame.height, palette)
  const overview = task.roi ? await loadRaster(task.file, 512) : frame
  const attention = analyzeAttention(frame.pixels, frame.width, frame.height)
  const attentionCanvas = createRasterCanvas(frame.width, frame.height)
  const attentionContext = rasterContext(attentionCanvas)
  attentionContext.drawImage(frame.canvas, 0, 0)
  const heatCanvas = createRasterCanvas(attention.heat.width, attention.heat.height)
  const heatContext = rasterContext(heatCanvas)
  const heatData = heatContext.createImageData(attention.heat.width, attention.heat.height)
  attention.heat.values.forEach((value, index) => {
    const strength = attention.heat.peak > 0 ? value / attention.heat.peak : 0
    heatData.data.set([255, 100, 25, Math.round(strength * 140)], index * 4)
  })
  heatContext.putImageData(heatData, 0, 0)
  attentionContext.drawImage(heatCanvas, 0, 0, frame.width, frame.height)
  const [attentionSourceUrl, attentionUrl] = await Promise.all([rasterDataUrl(frame.canvas), rasterDataUrl(attentionCanvas)])
  const result: SpatialResult = { palette, regions: spatial.regions, unassignedShare: spatial.unassignedShare, distributions, attention, attentionUrl, attentionSourceUrl, width: frame.width, height: frame.height }
  cached = { key, result, render: { frame, overview, components: spatial.components, distributions } }
  return cached
}

const worker = self as unknown as { onmessage: (event: MessageEvent<{ id: number; task: ColorTask }>) => void; postMessage: (response: ColorResponse) => void }
worker.onmessage = async ({ data: { id, task } }) => {
  try {
    validateImageFile(task.file)
    if (task.kind === 'palette') {
      worker.postMessage({ id, result: await analyzeImagePalette(task.file, task.count) })
    } else {
      const analysis = await scope(task)
      const result = task.kind === 'spatial' ? analysis.result : await renderSpatialViews(task.file, analysis.result.palette, task.hex, 512, task.mode, task.roi, task.view, analysis.render)
      worker.postMessage({ id, result })
    }
  } catch (error) { worker.postMessage({ id, error: error instanceof Error ? error.message : '图片分析失败' }) }
}
