import { analyzePaletteDistribution } from './distribution'
import { buildSpatialAssignments, cropSpatialPixels } from './spatial'
import type { SpatialRoi } from './spatial'
import type { PaletteSwatch, RGBPixel } from './extract'

export type SpatialImageData = {
  pixels: Array<RGBPixel | null>
  width: number
  height: number
}

async function loadSpatialImage(file: File, maxEdge: number): Promise<SpatialImageData & { canvas: HTMLCanvasElement }> {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('无法读取图片，请确认文件没有损坏'))
      element.src = url
    })
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('当前浏览器无法启动图片处理器')
    context.drawImage(image, 0, 0, width, height)
    const data = context.getImageData(0, 0, width, height).data
    const pixels: Array<RGBPixel | null> = []
    for (let index = 0; index < data.length; index += 4) {
      pixels.push(data[index + 3] < 128 ? null : [data[index], data[index + 1], data[index + 2]])
    }
    return { pixels, width, height, canvas }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function imageFileToSpatialData(file: File, maxEdge = 320): Promise<SpatialImageData> {
  const { pixels, width, height } = await loadSpatialImage(file, maxEdge)
  return { pixels, width, height }
}

export async function createSpatialOverlay(file: File, palette: PaletteSwatch[], selectedHex: string, maxEdge = 320, mode: 'largest' | 'all' = 'largest', roi?: SpatialRoi) {
  const { canvas, pixels } = await loadSpatialImage(file, maxEdge)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('无法生成空间高亮')
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const originalData = new Uint8ClampedArray(imageData.data)
  const crop = roi ? cropSpatialPixels(pixels, canvas.width, canvas.height, roi) : null
  const { components } = buildSpatialAssignments(crop?.pixels ?? pixels, crop?.width ?? canvas.width, crop?.height ?? canvas.height, palette)
  const selectedIndex = Math.max(0, palette.findIndex((color) => color.hex.toLowerCase() === selectedHex.toLowerCase()))
  const largest = [...components[selectedIndex]].sort((a, b) => b.length - a.length)[0]
  const localize = (indices: number[]) => indices.map((index) => crop
    ? (Math.floor(index / crop.width) + crop.offsetY) * canvas.width + (index % crop.width) + crop.offsetX
    : index)
  const allowed = new Set(localize(mode === 'largest' && largest ? largest : components[selectedIndex].flat()))
  pixels.forEach((pixel, index) => {
    if (!pixel) return
    if (!allowed.has(index)) {
      const offset = index * 4
      const gray = (imageData.data[offset] + imageData.data[offset + 1] + imageData.data[offset + 2]) / 3 * 0.22
      imageData.data[offset] = gray
      imageData.data[offset + 1] = gray
      imageData.data[offset + 2] = gray
    }
  })
  context.putImageData(imageData, 0, 0)

  const selectedCanvas = document.createElement('canvas')
  selectedCanvas.width = canvas.width
  selectedCanvas.height = canvas.height
  const selectedContext = selectedCanvas.getContext('2d')
  if (!selectedContext) throw new Error('无法柔化高亮边缘')
  selectedContext.putImageData(new ImageData(originalData, canvas.width, canvas.height), 0, 0)
  const mask = document.createElement('canvas')
  mask.width = canvas.width
  mask.height = canvas.height
  const maskContext = mask.getContext('2d')
  if (!maskContext) throw new Error('无法创建高亮蒙版')
  maskContext.fillStyle = '#ffffff'
  const drawMask = (indices: number[]) => indices.forEach((index) => maskContext.fillRect(index % canvas.width, Math.floor(index / canvas.width), 1, 1))
  if (allowed) drawMask([...allowed])
  else components[selectedIndex].forEach(drawMask)
  selectedContext.filter = 'blur(1px)'
  selectedContext.globalCompositeOperation = 'destination-in'
  selectedContext.drawImage(mask, 0, 0)
  selectedContext.filter = 'none'
  selectedContext.globalCompositeOperation = 'source-over'
  context.drawImage(selectedCanvas, 0, 0)
  if (roi) {
    context.strokeStyle = '#e0ff50'
    context.lineWidth = 2
    context.strokeRect(roi.x * canvas.width, roi.y * canvas.height, roi.width * canvas.width, roi.height * canvas.height)
  }
  return canvas.toDataURL('image/png')
}

export async function createDistributionOverlay(file: File, palette: PaletteSwatch[], selectedHex: string, maxEdge = 320, roi?: SpatialRoi) {
  const { canvas, pixels } = await loadSpatialImage(file, maxEdge)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('无法生成分布热图')
  const crop = roi ? cropSpatialPixels(pixels, canvas.width, canvas.height, roi) : null
  const scopedPixels = crop?.pixels ?? pixels
  const scopedWidth = crop?.width ?? canvas.width
  const scopedHeight = crop?.height ?? canvas.height
  const distributions = analyzePaletteDistribution(scopedPixels, scopedWidth, scopedHeight, palette)
  const selected = distributions.find((item) => item.hex.toLowerCase() === selectedHex.toLowerCase()) ?? distributions[0]
  const selectedColor = palette.find((color) => color.hex === selected?.hex)
  if (!selected || !selectedColor) return canvas.toDataURL('image/png')

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  pixels.forEach((pixel, index) => {
    if (!pixel) return
    const offset = index * 4
    const gray = (imageData.data[offset] + imageData.data[offset + 1] + imageData.data[offset + 2]) / 3 * 0.26
    imageData.data[offset] = gray
    imageData.data[offset + 1] = gray
    imageData.data[offset + 2] = gray
  })
  context.putImageData(imageData, 0, 0)

  const targetX = crop?.offsetX ?? 0
  const targetY = crop?.offsetY ?? 0
  const targetWidth = crop?.width ?? canvas.width
  const targetHeight = crop?.height ?? canvas.height
  const heatCanvas = document.createElement('canvas')
  heatCanvas.width = selected.heat.width
  heatCanvas.height = selected.heat.height
  const heatContext = heatCanvas.getContext('2d')
  if (!heatContext) throw new Error('无法创建热图画布')
  const heatImage = heatContext.createImageData(heatCanvas.width, heatCanvas.height)
  selected.heat.values.forEach((value, index) => {
    const normalized = selected.heat.peak > 0 ? value / selected.heat.peak : 0
    const offset = index * 4
    heatImage.data[offset] = selectedColor.rgb[0]
    heatImage.data[offset + 1] = selectedColor.rgb[1]
    heatImage.data[offset + 2] = selectedColor.rgb[2]
    heatImage.data[offset + 3] = Math.round(Math.pow(normalized, 0.72) * 220)
  })
  heatContext.putImageData(heatImage, 0, 0)
  context.imageSmoothingEnabled = true
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = 0.85
  context.drawImage(heatCanvas, targetX, targetY, targetWidth, targetHeight)
  context.filter = 'blur(6px)'
  context.globalAlpha = 0.35
  context.drawImage(heatCanvas, targetX, targetY, targetWidth, targetHeight)
  context.filter = 'none'
  context.globalCompositeOperation = 'source-over'
  context.globalAlpha = 1

  context.strokeStyle = selected.hex
  context.lineWidth = 1.5
  selected.hotspots.forEach((hotspot) => {
    const x = targetX + hotspot.x * targetWidth
    const y = targetY + hotspot.y * targetHeight
    context.beginPath()
    context.arc(x, y, 7 + hotspot.share * 18, 0, Math.PI * 2)
    context.stroke()
  })
  if (roi) {
    context.strokeStyle = '#e0ff50'
    context.lineWidth = 2
    context.strokeRect(roi.x * canvas.width, roi.y * canvas.height, roi.width * canvas.width, roi.height * canvas.height)
  }
  return canvas.toDataURL('image/png')
}
