import { extractPalette } from './extract'
import type { PaletteSwatch } from './extract'
import { validateImageFile } from './image'
import { loadRaster } from './raster'
import { COLOR_PIPELINE } from './pipelineConfig'
import type { ImageAnalysisMetadata } from './pipelineConfig'

export type ImagePaletteResult = {
  palette: PaletteSwatch[]
  width: number
  height: number
  analysis: ImageAnalysisMetadata
}

export async function analyzeImagePalette(file: File, colorCount: number): Promise<ImagePaletteResult> {
  validateImageFile(file)
  const frame = await loadRaster(file)
  const pixels = frame.pixels.filter(pixel => pixel !== null)
  if (!pixels.length) throw new Error('图片没有可分析的不透明像素')
  return {
    palette: extractPalette(pixels, colorCount),
    width: frame.originalWidth,
    height: frame.originalHeight,
    analysis: { ...COLOR_PIPELINE, requestedColorCount: colorCount },
  }
}
