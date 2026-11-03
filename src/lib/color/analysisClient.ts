import type { PaletteSwatch } from './extract'
import type { SpatialRegionEvidence, SpatialRoi } from './spatial'
import type { PaletteDistribution } from './distribution'
import type { AttentionEvidence } from './attention'

type Scope = { file: File; palette: PaletteSwatch[]; roi?: SpatialRoi }
export type ColorTask =
  | { kind: 'palette'; file: File; count: number }
  | ({ kind: 'spatial' } & Scope)
  | ({ kind: 'render'; hex: string; mode: 'largest' | 'all'; view: 'regions' | 'distribution' } & Scope)
export type PaletteResult = { palette: PaletteSwatch[]; width: number; height: number }
export type SpatialResult = { palette: PaletteSwatch[]; regions: SpatialRegionEvidence[]; distributions: PaletteDistribution[]; attention: AttentionEvidence; attentionUrl: string; unassignedShare: number; width: number; height: number }
export type ColorResponse = { id: number; result?: unknown; error?: string }

export class ColorAnalysisClient {
  private worker: Worker | null = null
  private sequence = 0
  private pending: { id: number; resolve: (value: unknown) => void; reject: (error: Error) => void } | null = null

  cancel() {
    this.pending?.reject(new DOMException('已取消过期分析', 'AbortError'))
    this.pending = null
    this.worker?.terminate()
    this.worker = null
  }

  run<T>(task: ColorTask): Promise<T> {
    if (task.kind !== 'render' && this.pending) this.cancel()
    else if (this.pending) {
      this.pending.reject(new DOMException('已取消过期显示', 'AbortError'))
      this.pending = null
    }
    if (!this.worker) {
      this.worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = (event: MessageEvent<ColorResponse>) => {
        if (event.data.id !== this.pending?.id) return
        const pending = this.pending
        this.pending = null
        if (event.data.error) pending.reject(new Error(event.data.error))
        else pending.resolve(event.data.result)
      }
      this.worker.onerror = () => {
        this.pending?.reject(new Error('图片分析进程无法运行，请重新导入图片'))
        this.pending = null
        this.worker?.terminate()
        this.worker = null
      }
    }
    const id = ++this.sequence
    return new Promise<T>((resolve, reject) => {
      this.pending = { id, resolve: value => resolve(value as T), reject }
      this.worker!.postMessage({ id, task })
    })
  }
}
