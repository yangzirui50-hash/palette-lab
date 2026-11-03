import { useEffect, useMemo, useRef, useState } from 'react'
import { compareSeries } from '../domain/series'
import type { SeriesImageAnalysis } from '../domain/series'
import { assignPaletteRoles } from '../domain/assign'
import { getContrastReport } from '../domain/contrast'
import type { RoleAssignments } from '../domain/assign'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import { ColorAnalysisClient } from '../lib/color/analysisClient'
import type { PaletteResult } from '../lib/color/analysisClient'
import type { ImageAnalysisMetadata } from '../lib/color/pipelineConfig'
import RoleEditor from './RoleEditor'
import DomainPreview from './DomainPreview'
import SeriesExportPanel from './SeriesExportPanel'
import { generateUnifiedSeriesPalette } from '../domain/unify'
import type { SeriesStrategy } from '../domain/unify'
import './SeriesWorkspace.css'

type SeriesImageState = Omit<SeriesImageAnalysis, 'roles'> & {
  file: File
  url: string
  width: number
  height: number
  rolesByDomain: Record<DomainId, RoleAssignments>
  lockedRoles: string[]
  analysis: ImageAnalysisMetadata
}

type SeriesWorkspaceProps = {
  domain: DomainId
}

type UnifiedDrafts = Partial<Record<DomainId, Partial<Record<SeriesStrategy, RoleAssignments>>>>

export default function SeriesWorkspace({ domain }: SeriesWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const urls = useRef(new Set<string>())
  const paletteClient = useRef(new ColorAnalysisClient())
  const importState = useRef({ run: 0, busy: false })
  const [images, setImages] = useState<SeriesImageState[]>([])
  const [primaryId, setPrimaryId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [view, setView] = useState<'overview' | 'inspect' | 'unify'>('overview')
  const [strategiesByDomain, setStrategiesByDomain] = useState<Partial<Record<DomainId, SeriesStrategy>>>({})
  const strategy = strategiesByDomain[domain] ?? 'preserve-accents'
  const [unifiedDrafts, setUnifiedDrafts] = useState<UnifiedDrafts>({})
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null)
  const [importResults, setImportResults] = useState<{ succeeded: number; failures: { name: string; reason: string }[] } | null>(null)

  useEffect(() => {
    const client = paletteClient.current
    const state = importState.current
    const ownedUrls = urls.current
    return () => {
      state.run++
      state.busy = false
      client.cancel()
      ownedUrls.forEach((url) => URL.revokeObjectURL(url))
      ownedUrls.clear()
    }
  }, [])

  const report = useMemo(() => {
    if (images.length < 2 || !primaryId) return null
    return compareSeries(images.map(({ id, label, palette, rolesByDomain }) => ({ id, label, palette, roles: rolesByDomain[domain] })), primaryId)
  }, [images, primaryId, domain])

  const activeOverrides = unifiedDrafts[domain]?.[strategy]
  const unified = useMemo(() => {
    if (images.length < 2 || !primaryId) return null
    return generateUnifiedSeriesPalette(images.map(({ id, label, palette, rolesByDomain, lockedRoles }) => ({
      id,
      label,
      palette,
      roles: rolesByDomain[domain],
      lockedRoles,
    })), primaryId, domain, strategy, activeOverrides)
  }, [images, primaryId, domain, strategy, activeOverrides])
  const unifiedAssignments = unified?.roles ?? {}
  const unifiedContrastReport = getContrastReport(domain, unifiedAssignments)

  const selected = images.find((image) => image.id === selectedId) ?? images[0]
  const primary = images.find((image) => image.id === primaryId) ?? images[0]

  const addFiles = async (files: File[]) => {
    const state = importState.current
    if (files.length === 0 || state.busy) return
    if (images.length + files.length > 6) {
      setError('系列模式首版最多支持 6 张图片')
      return
    }
    setBusy(true)
    state.busy = true
    const run = ++state.run
    setError('')
    setImportResults(null)
    try {
      const additions: SeriesImageState[] = []
      const failures: { name: string; reason: string }[] = []
      for (const [index, file] of files.entries()) {
        setProgress({ current: index + 1, total: files.length, name: file.name })
        try {
          const processed = await paletteClient.current.run<PaletteResult>({ kind: 'palette', file, count: 6 })
          if (run !== state.run) return
          const { palette } = processed
          const url = URL.createObjectURL(file)
          urls.current.add(url)
          additions.push({
            id: crypto.randomUUID(), label: file.name, file, url,
            width: processed.width, height: processed.height, palette, analysis: processed.analysis,
            rolesByDomain: {
              'web-ui': assignPaletteRoles(palette, 'web-ui'),
              'art-poster': assignPaletteRoles(palette, 'art-poster'),
            },
            lockedRoles: [],
          })
        } catch (reason) {
          if (run !== state.run) return
          failures.push({ name: file.name, reason: reason instanceof Error ? reason.message : '图片处理失败，请重试' })
        }
      }
      setImages((current) => [...current, ...additions])
      if (additions[0]) {
        setPrimaryId(current => current || additions[0].id)
        setSelectedId(current => current || additions[0].id)
      }
      setImportResults({ succeeded: additions.length, failures })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '图片处理失败，请重试')
    } finally {
      if (run === state.run) {
        state.busy = false
        setBusy(false)
        setProgress(null)
        setDragging(false)
        if (inputRef.current) inputRef.current.value = ''
      }
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
    if (next.length === 0) {
      setUnifiedDrafts({})
      setStrategiesByDomain({})
    }
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
        <p>比较角色与比例，选择统一策略，再导出可调整的系列配色方案。</p>
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
      {progress && <p className="series-hint" role="status">正在处理 {progress.current} / {progress.total}：{progress.name}</p>}
      {importResults && (
        <div className="series-import-results" role="status">
          <p>成功导入 {importResults.succeeded} 张{importResults.failures.length > 0 ? `；${importResults.failures.length} 张未导入，已保留成功项。可修复后重新添加。` : '。'}</p>
          {importResults.failures.length > 0 && <ul>{importResults.failures.map((failure, index) => <li key={index}>{failure.name}：{failure.reason}</li>)}</ul>}
        </div>
      )}

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
            <button className={view === 'unify' ? 'active' : ''} onClick={() => setView('unify')}>统一色组</button>
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
          ) : view === 'inspect' && selected && (
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
                lockedRoles={selected.lockedRoles}
                onLockChange={(role, locked) => setImages((current) => current.map((image) => image.id === selected.id ? {
                  ...image,
                  lockedRoles: locked ? [...image.lockedRoles, role] : image.lockedRoles.filter((item) => item !== role),
                } : image))}
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

          {view === 'unify' && unified && (
            <div className="series-unify">
              <section className="strategy-panel">
                <div className="panel-heading"><span>04</span><h3>选择统一策略</h3><small>INTENT PRESERVED</small></div>
                <div className="strategy-grid">
                  {([
                    ['follow-primary', '跟随主图', '强统一，以主图作为全部基础角色的基准。'],
                    ['balanced', '折中统一', '每张作品一票，选择全系列距离最小的现有代表色。'],
                    ['preserve-accents', '保留个性', '统一基础角色，每张作品保留自己的强调色。'],
                  ] as const).map(([id, label, description]) => (
                    <button key={id} className={strategy === id ? 'active' : ''} onClick={() => setStrategiesByDomain((current) => ({ ...current, [domain]: id }))} aria-pressed={strategy === id}>
                      <strong>{label}</strong><span>{description}</span>
                    </button>
                  ))}
                </div>
                <p className="strategy-rationale">{unified.rationale}</p>
                <div className="unified-palette-graphic" aria-label="统一色组">
                  {unified.palette.map((color) => <i key={color.hex} style={{ backgroundColor: color.hex }} title={color.hex} />)}
                </div>
                {Object.keys(unified.exceptions).length > 0 && (
                  <div className="series-exceptions">
                    <strong>独立保留</strong>
                    {Object.entries(unified.exceptions).map(([id, roles]) => (
                      <span key={id}>{images.find((image) => image.id === id)?.label}：{Object.entries(roles).map(([role, hex]) => `${role} ${hex}`).join('、')}</span>
                    ))}
                  </div>
                )}
              </section>
              <RoleEditor
                domain={domain}
                palette={[...unified.palette, ...images.flatMap(image => image.palette)]}
                assignments={unifiedAssignments}
                editedRoles={Object.keys(activeOverrides ?? {})}
                editHint="各领域和策略分别保留手动选择；重排或更换主图也会保留。"
                onResetAll={() => setUnifiedDrafts((current) => ({
                  ...current,
                  [domain]: { ...current[domain], [strategy]: {} },
                }))}
                onChange={(role, hex) => setUnifiedDrafts((current) => ({
                  ...current,
                  [domain]: {
                    ...current[domain],
                    [strategy]: { ...current[domain]?.[strategy], [role]: hex },
                  },
                }))}
              />
              <DomainPreview domain={domain} assignments={unifiedAssignments} contrastReport={unifiedContrastReport} />
              <SeriesExportPanel
                unified={unified}
                assignments={unifiedAssignments}
                comparison={report}
                imageLabels={Object.fromEntries(images.map((image) => [image.id, image.label]))}
                contrastReport={unifiedContrastReport}
                sourceAnalysis={images.map(image => ({ id: image.id, label: image.label, analysis: image.analysis }))}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
