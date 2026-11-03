import Color from 'colorjs.io'
import type { PaletteSwatch, RGBPixel } from './extract'

export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '').toLowerCase()
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(hex)) return null
  return `#${hex.length === 3 ? [...hex].map(channel => channel + channel).join('') : hex}`
}

export function retainedSwatch(value: string): PaletteSwatch {
  const hex = normalizeHex(value)
  if (!hex) throw new Error('请输入 3 位或 6 位 HEX 色值')
  const rgb = [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16)) as unknown as RGBPixel
  const oklch = new Color(hex).to('oklch').coords.map(value => value ?? 0) as unknown as RGBPixel
  return { hex, rgb, oklch, share: 0 }
}
