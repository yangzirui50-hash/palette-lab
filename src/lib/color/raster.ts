import type { RGBPixel } from './extract'
import type { SpatialRoi } from './spatial'

export type RasterCanvas = HTMLCanvasElement | OffscreenCanvas
export type RasterFrame = {
  canvas: RasterCanvas
  pixels: Array<RGBPixel | null>
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

export function createRasterCanvas(width: number, height: number): RasterCanvas {
  if (typeof document === 'undefined') return new OffscreenCanvas(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function rasterContext(canvas: RasterCanvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  if (!context) throw new Error('当前浏览器无法启动图片处理器')
  return context
}

export async function rasterDataUrl(canvas: RasterCanvas): Promise<string> {
  if ('toDataURL' in canvas) return canvas.toDataURL('image/png')
  const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
  return `data:image/png;base64,${btoa(binary)}`
}

export async function loadRaster(file: File, maxEdge = 512, roi?: SpatialRoi): Promise<RasterFrame> {
  let image: ImageBitmap
  try { image = await createImageBitmap(file) } catch { throw new Error('无法读取图片，请确认文件没有损坏') }
  try {
    const x = roi ? Math.max(0, Math.min(image.width - 1, Math.floor(roi.x * image.width))) : 0
    const y = roi ? Math.max(0, Math.min(image.height - 1, Math.floor(roi.y * image.height))) : 0
    const right = roi ? Math.min(image.width, Math.ceil((roi.x + roi.width) * image.width)) : image.width
    const bottom = roi ? Math.min(image.height, Math.ceil((roi.y + roi.height) * image.height)) : image.height
    const cropWidth = Math.max(1, right - x)
    const cropHeight = Math.max(1, bottom - y)
    const scale = Math.min(1, maxEdge / Math.max(cropWidth, cropHeight))
    const width = Math.max(1, Math.round(cropWidth * scale))
    const height = Math.max(1, Math.round(cropHeight * scale))
    const canvas = createRasterCanvas(width, height)
    const context = rasterContext(canvas)
    // ImageBitmap bypasses the HTMLImage decoder's staged reduction. Explicit
    // high-quality filtering avoids single-sample aliasing in fine textures.
    context.imageSmoothingQuality = scale <= .5 ? 'high' : 'low'
    context.drawImage(image, x, y, cropWidth, cropHeight, 0, 0, width, height)
    const rgba = context.getImageData(0, 0, width, height).data
    const pixels: Array<RGBPixel | null> = []
    for (let offset = 0; offset < rgba.length; offset += 4) pixels.push(rgba[offset + 3] < 128 ? null : [rgba[offset], rgba[offset + 1], rgba[offset + 2]])
    return { canvas, pixels, width, height, originalWidth: image.width, originalHeight: image.height }
  } finally { image.close() }
}
