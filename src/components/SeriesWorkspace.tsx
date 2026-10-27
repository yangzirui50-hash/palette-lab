import { useEffect, useMemo, useRef, useState } from 'react'
import { compareSeries } from '../domain/series'
import type { SeriesImageAnalysis } from '../domain/series'
import { assignPaletteRoles } from '../domain/assign'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import { extractPalette } from '../lib/color/extract'
import type { PaletteSwatch } from '../lib/color/extract'
import { imageFileToPixels } from '../lib/color/image'
import RoleEditor from './RoleEditor'
import './SeriesWorkspace.css'

type SeriesImageState = Omit<SeriesImageAnalysis, 'roles'> & {
  file: File
  url: string
  width: number
  height: number
  rolesByDomain: Record<DomainId, RoleAssignments>
}

type SeriesWorkspaceProps = {
  domain: DomainId
}

export default function SeriesWorkspace({ domain }: SeriesWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const urls = useRef(new Set<string>())
  const [images, setImages] = useState<SeriesImageState[]>([])
  const [primaryId, setPrimaryId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [view, setView] = useState<'overview' | 'inspect'>('overview')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url))
    urls.current.clear()
  }, [])

  const report = useMemo(() => {
    if (images.length < 2 || !primaryId) return null
    return compareSeries(images.map(({ id, label, palette, rolesByDomain }) => ({ id, label, palette, roles: rolesByDomain[domain] })), primaryId)
  }, [images, primaryId, domain])

  const selected = images.find((image) => image.id === selectedId) ?? images[0]
  const primary = images.find((image) => image.id === primaryId) ?? images[0]

  const addFiles = async (files: File[]) => {
    if (files.length === 0 || busy) return
    if (images.length + files.length > 6) {
      setError('系列模式首版最多支持 6 张图片')
      return
    }
    setBusy(true)
    setError('')
    try {
      const additions: SeriesImageState[] = []
      for (const file of files) {
        const processed = await imageFileToPixels(file)
        const palette = extractPalette(processed.pixels, 6)
        const id = crypto.randomUUID()
        urls.current.add(processed.previewUrl)
        additions.push({
          id,
          label: file.name,
          file,
          url: processed.previewUrl,
          width: processed.width,
          height: processed.height,
          palette,
          rolesByDomain: {
            'web-ui': assignPaletteRoles(palette, 'web-ui'),
            'art-poster': assignPaletteRoles(palette, 'art-poster'),
          },
        })
      }
      setImages((current) => [...current, ...additions])
      if (!primaryId && additions[0]) setPrimaryId(additions[0].id)
      if (!selectedId && additions[0]) setSelectedId(additions[0].id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '图片处理失败，请重试')
    } finally {
      setBusy(false)
      setDragging(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    const next = images.filter((image) => image.id !== id)
    const removed = images.find((image) => image.id === id)
    if (removed) {
      URL.revokeObjectURL(removed.url)
      urls.current.delete(removed.url)
    }
    setImages(next)
    if (primaryId === id) setPrimaryId(next[0]?.id ?? '')
    if (selectedId === id) setSelectedId(next[0]?.id ?? '')
  }

  const moveImage = (id: string, offset: number) => {
    const index = images.findIndex((image) => image.id === id)
    const target = index + offset
    if (index < 0 || target < 0 || target >= images.length) return
    const next = [...images]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setImages(next)
  }

  const inspect = (id: string) => {
    setSelectedId(id)
    setView('inspect')
  }

  return (
    <section className="series-workspace" aria-label="系列色彩工作台">
      <div className="series-intro">
        <div><p className="kicker">SERIES → VISUAL SYSTEM</p><h2>系列色彩诊断</h2></div>
        <p>比较角色与比例，而不是给作品打一个笼统分数。统一策略与导出将在后续切片开放。</p>
      </div>

      <div
        className={`series-import ${dragging ? 'dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); void addFiles([...event.dataTransfer.files]) }}
      >
        <div><strong>{busy ? '正在处理图片…' : images.length === 0 ? '导入 2–6 张系列作品' : `已导入 ${images.length} / 6 张`}</strong><span>PNG、JPG 或 WebP，本地处理，不会自动上传</span></div>
        <button onClick={() => inputRef.current?.click()} disabled={busy || images.length >= 6}>{images.length === 0 ? '选择图片' : '继续添加'}</button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => void addFiles([...(event.target.files ?? [])])} hidden />
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}

      {images.length > 0 && (
        <div className="series-filmstrip" aria-label="系列图片列表">
          {images.map((image, index) => (
            <article className={`series-thumbnail ${primaryId === image.id ? 'primary' : ''}`} key={image.id}>
              <button className="thumbnail-preview" onClick={() => inspect(image.id)} aria-label={`检查图片：${image.label}`}>
                <img src={image.url} alt={image.label} />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
              <div className="thumbnail-meta"><strong>{image.label}</strong><small>{primaryId === image.id ? '主图' : '候选图'}</small></div>
              <div className="thumbnail-actions">
                <button onClick={() => setPrimaryId(image.id)} disabled={primaryId === image.id}>设为主图</button>
                <button onClick={() => moveImage(image.id, -1)} disabled={index === 0} aria-label={`前移 ${image.label}`}>←</button>
                <button onClick={() => moveImage(image.id, 1)} disabled={index === images.length - 1} aria-label={`后移 ${image.label}`}>→</button>
                <button onClick={() => removeImage(image.id)} aria-label={`移除 ${image.label}`}>×</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {images.length === 1 && <p className="series-hint">再添加至少 1 张图片，即可生成系列差异。</p>}

      {report && (
        <>
          <nav className="series-tabs" aria-label="系列任务层级">
            <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>系列总览</button>
            <button className={view === 'inspect' ? 'active' : ''} onClick={() => selected && inspect(selected.id)}>单图检查</button>
          </nav>

          {view === 'overview' ? (
            <div className="series-overview">
              <section className="series-shared">
                <div className="panel-heading"><span>01</span><h3>全系列共同色</h3><small>{report.sharedColors.length} COLORS</small></div>
                {report.sharedColors.length > 0 ? (
                  <div className="shared-color-grid">
                    {report.sharedColors.map((color) => (
                      <article key={color.primaryHex}>
                        <i style={{ backgroundColor: color.primaryHex }} />
                        <strong>{color.primaryHex}</strong>
                        <span>占比 {(color.minShare * 100).toFixed(1)}%–{(color.maxShare * 100).toFixed(1)}%</span>
                        <small>最大色差 {color.maxDistance.toFixed(3)}</small>
                      </article>
                    ))}
                  </div>
                ) : <p className="series-empty">当前没有贯穿所有作品的共同色，这不代表作品一定有问题。</p>}
              </section>

              <section className="series-deviations">
                <div className="panel-heading"><span>02</span><h3>相对主图的差异</h3><small>EXPLAINABLE EVIDENCE</small></div>
                <div className="deviation-list">
                  {report.comparisons.map((comparison) => {
                    const candidate = images.find((image) => image.id === comparison.candidateId)
                    const shared = comparison.colorDifferences.filter((difference) => difference.type === 'shared')
                    const missing = comparison.colorDifferences.filter((difference) => difference.type === 'missing')
                    const additional = comparison.colorDifferences.filter((difference) => difference.type === 'additional')
                    const maxShareDelta = Math.max(0, ...shared.map((difference) => difference.type === 'shared' ? Math.abs(difference.shareDelta) : 0))
                    return (
                      <article key={comparison.candidateId}>
                        <div className="deviation-title"><div><strong>{candidate?.label}</strong><span>相对 {primary?.label}</span></div><button onClick={() => inspect(comparison.candidateId)}>检查此图</button></div>
                        <div className="deviation-metrics">
                          <span><b>{shared.length}</b> 组共同色</span>
                          <span><b>{missing.length}</b> 组缺失色</span>
                          <span><b>{additional.length}</b> 组新增色</span>
                          <span><b>{comparison.roleDifferences.length}</b> 项角色差异</span>
                        </div>
                        <p>最大占比变化 {(maxShareDelta * 100).toFixed(1)}%。这些是需要确认的差异，不是自动判错。</p>
                        {comparison.roleDifferences.length > 0 && <small>角色：{comparison.roleDifferences.map((difference) => difference.role).join('、')}</small>}
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>
          ) : selected && (
            <div className="series-inspection">
              <section className="inspection-images">
                <div className="panel-heading"><span>03</span><h3>单图检查</h3><small>INDEPENDENT ROLES</small></div>
                <div className="inspection-image-grid">
                  {[primary, selected].map((image, index) => image && (
                    <figure key={`${image.id}-${index}`}>
                      <img src={image.url} alt={image.label} />
                      <figcaption><strong>{image.label}</strong><span>{image.id === primaryId ? '主图' : '候选图'} · {image.palette.length} 色</span></figcaption>
                      <div className="inspection-palette">{image.palette.map((color: PaletteSwatch) => <i key={`${color.hex}-${color.share}`} style={{ backgroundColor: color.hex, flexGrow: color.share }} title={`${color.hex} ${(color.share * 100).toFixed(1)}%`} />)}</div>
                    </figure>
                  ))}
                </div>
                {selected.id === primaryId && <p className="series-hint">当前是主图。你可以修正它的角色，其他图片将以此为比较基准。</p>}
              </section>
              <RoleEditor
                domain={domain}
                palette={selected.palette}
                assignments={selected.rolesByDomain[domain]}
                onChange={(role, hex) => setImages((current) => current.map((image) => image.id === selected.id ? {
                  ...image,
                  rolesByDomain: {
                    ...image.rolesByDomain,
                    [domain]: { ...image.rolesByDomain[domain], [role]: hex },
                  },
                } : image))}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
