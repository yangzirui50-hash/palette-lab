import { buildSpatialAssignments } from './spatial'
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

export async function createSpatialOverlay(file: File, palette: PaletteSwatch[], selectedHex: string, maxEdge = 320, mode: 'largest' | 'all' = 'largest') {
  const { canvas, pixels } = await loadSpatialImage(file, maxEdge)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('无法生成空间高亮')
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const originalData = new Uint8ClampedArray(imageData.data)
  const { components } = buildSpatialAssignments(pixels, canvas.width, canvas.height, palette)
  const selectedIndex = Math.max(0, palette.findIndex((color) => color.hex.toLowerCase() === selectedHex.toLowerCase()))
  const largest = [...components[selectedIndex]].sort((a, b) => b.length - a.length)[0]
  const allowed = mode === 'largest' && largest ? new Set(largest) : new Set(components[selectedIndex].flat())
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
  return canvas.toDataURL('image/png')
}
