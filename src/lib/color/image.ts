import type { RGBPixel } from './extract'

const supportedTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxFileSize = 15 * 1024 * 1024

export type ProcessedImage = {
  pixels: RGBPixel[]
  previewUrl: string
  width: number
  height: number
}

export async function imageFileToPixels(file: File, maxEdge = 320): Promise<ProcessedImage> {
  if (!supportedTypes.includes(file.type)) throw new Error('请选择 PNG、JPG 或 WebP 图片')
  if (file.size === 0) throw new Error('图片文件为空，请重新选择')
  if (file.size > maxFileSize) throw new Error('图片不能超过 15 MB')

  const previewUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('无法读取图片，请确认文件没有损坏'))
      element.src = previewUrl
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
    const pixels: RGBPixel[] = []
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 128) continue
      pixels.push([data[index], data[index + 1], data[index + 2]])
    }
    if (pixels.length === 0) throw new Error('图片没有可分析的不透明像素')

    return { pixels, previewUrl, width: image.naturalWidth, height: image.naturalHeight }
  } catch (error) {
    URL.revokeObjectURL(previewUrl)
    throw error
  }
}
