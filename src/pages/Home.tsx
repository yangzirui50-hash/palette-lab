import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import '../themes.css'
import { domainProfiles } from '../domain/profiles'
import type { DomainId } from '../domain/profiles'
import type { PaletteSwatch } from '../lib/color/extract'
import type { SpatialRegionEvidence, SpatialRoi } from '../lib/color/spatial'
import { ColorAnalysisClient } from '../lib/color/analysisClient'
import type { PaletteResult } from '../lib/color/analysisClient'
import { useTheme } from '../hooks/useTheme'
import { copyText } from '../lib/clipboard'
import { assignPaletteRoles } from '../domain/assign'
import { getContrastReport } from '../domain/contrast'
import RoleEditor from '../components/RoleEditor'
import SpatialPanel from '../components/SpatialPanel'
import DomainPreview from '../components/DomainPreview'
import ExportPanel from '../components/ExportPanel'
import AnalysisPanel from '../components/AnalysisPanel'
import InspirationPanel from '../components/InspirationPanel'
import SeriesWorkspace from '../components/SeriesWorkspace'
import type { AnalysisReport } from '../domain/analysis'
import ProjectProvider from '../lib/project/ProjectProvider'
import ProjectControls from '../lib/project/ProjectControls'
import { useProject } from '../lib/project/context'
import { loadProject } from '../lib/project/storage'
import { useObjectUrls } from '../lib/project/useObjectUrls'
import type { FocusSnapshot, ReadingSnapshot,ProjectRecord, ProjectSource, ReportContext } from '../lib/project/model'
import { reportContextKey } from '../lib/project/model'
import { retainedSwatch } from '../lib/color/hex'
import { sourceCoordinates } from '../lib/color/coordinates'
import WorkingPalette from '../components/WorkingPalette'
import WorkbenchNav from '../components/WorkbenchNav'

const noPalette: PaletteSwatch[] = []
const noEvidence: SpatialRegionEvidence[] = []

export default function Home() {
  const [boot, setBoot] = useState<{ record: ProjectRecord | null; error: string } | null>(null)
  useEffect(() => {
    let active = true
    void loadProject().then(record => { if (active) setBoot({ record, error: '' }) }).catch((error: unknown) => {
      if (active) setBoot({ record: null, error: error instanceof Error ? error.message : '无法读取本地项目' })
    })
    return () => { active = false }
  }, [])
  return boot ? <ProjectProvider initialRecord={boot.record} readError={boot.error}><HomeWorkspace /></ProjectProvider>
    : <main className="app-shell"><p role="status">正在恢复本地工作台…</p></main>
}

function HomeWorkspace() {
  const { project, updateSingle, updateUi, epoch } = useProject()
  const { mode, domain } = project.ui
  const single = project.core.single
  const sourceRecord = single.source
  const palette = sourceRecord?.palette ?? noPalette
  const roleOverrides = single.roleOverrides
  const rolePalette = useMemo(() => [...palette, ...single.workingColors.map(candidate => candidate.color)], [palette, single.workingColors])
  const retainedHexes = useMemo(() => rolePalette.map(color => color.hex.toLowerCase()), [rolePalette])
  const sourceFiles = useMemo(() => sourceRecord ? [sourceRecord.file] : [], [sourceRecord])
  const sourceUrls = useObjectUrls(sourceFiles)
  const source = sourceRecord ? { ...sourceRecord, url: sourceUrls.get(sourceRecord.file) ?? '' } : null
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteClient = useRef(new ColorAnalysisClient())
  const latestFile = useRef<File | null>(null)
  const colorCountRef = useRef(sourceRecord?.analysis.requestedColorCount ?? 6)
  const countRestoreEpoch = useRef(epoch)
  const sourceRef = useRef<ProjectSource | null>(sourceRecord)
  const uploadRequestRef = useRef(0)
  const { theme, toggleTheme } = useTheme()
  const [seriesActivated, setSeriesActivated] = useState(mode === 'series' || project.core.series.images.length > 0)
  const [colorCount, setColorCount] = useState(sourceRecord?.analysis.requestedColorCount ?? 6)
  const setMode = (mode: 'single' | 'series') => updateUi({ mode })
  const assignments = useMemo(() => ({
    ...assignPaletteRoles(palette, domain),
    ...roleOverrides[domain],
  }), [palette, domain, roleOverrides])
  const contrastReport = getContrastReport(domain, assignments)
  const [previewTarget, setPreviewTarget] = useState<HTMLElement | null>(null)
  const spatialKey = `${sourceRecord?.id ?? ''}|${palette.map(color => color.hex).join(',')}|${JSON.stringify(single.roi)}`
  const [spatialResult, setSpatialResult] = useState<{ file: File | null; key: string; regions: SpatialRegionEvidence[] }>({ file: null, key: '', regions: [] })
  const spatialEvidence = spatialResult.file === sourceRecord?.file && spatialResult.key === spatialKey ? spatialResult.regions : noEvidence
  const recordEvidence = useCallback((regions: SpatialRegionEvidence[]) => {
    setSpatialResult({ file: sourceRecord?.file ?? null, key: spatialKey, regions })
  }, [sourceRecord?.file, spatialKey])
  const previewEvidence = useMemo(() => sourceCoordinates(spatialEvidence, single.roi), [spatialEvidence, single.roi])
  const activeSnapshots = single.snapshots.filter(snapshot => snapshot.context.sourceId === sourceRecord?.id && snapshot.context.domain === domain)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const selectedSnapshot = activeSnapshots.find(snapshot => snapshot.id === selectedSnapshotId) ?? activeSnapshots.at(-1)
  const analysisReport = selectedSnapshot?.report ?? null
  const analysisContext = useMemo<ReportContext | null>(() => sourceRecord ? ({
    sourceId: sourceRecord.id, sourceName: sourceRecord.name, domain, palette, assignments, spatialEvidence, roi: single.roi,
  }) : null, [sourceRecord, domain, palette, assignments, spatialEvidence, single.roi])
  const saveAnalysis = useCallback((report: AnalysisReport, context: ReportContext) => {
    const snapshot = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), context, report }
    updateSingle(current => ({ ...current, snapshots: [...current.snapshots, snapshot].slice(-20) }))
    setSelectedSnapshotId(snapshot.id)
  }, [updateSingle])
  const saveFocus=useCallback((snapshot:FocusSnapshot)=>{
    updateSingle(current=>current.source?.id===snapshot.sourceId?{...current,focusSnapshots:[...current.focusSnapshots,snapshot].slice(-10)}:current)
  },[updateSingle])
  const saveReading = useCallback((snapshot: ReadingSnapshot) => {
    updateSingle(current => current.source?.id === snapshot.sourceId ? { ...current, readingSnapshots: [...current.readingSnapshots, snapshot].slice(-10) } : current)
  }, [updateSingle])
  const changeRoi = useCallback((roi: SpatialRoi | null) => {
    updateSingle(current => ({ ...current, roi }), false)
  }, [updateSingle])
  const changeRole = (role: string, hex: string) => updateSingle(current => {
    if (!current.source) return current
    const known = current.source.palette.some(color => color.hex.toLowerCase() === hex) || current.workingColors.some(candidate => candidate.color.hex.toLowerCase() === hex)
    return { ...current, roleOverrides: { ...current.roleOverrides, [domain]: { ...current.roleOverrides[domain], [role]: hex } },
      workingColors: known || current.workingColors.length >= 24 ? current.workingColors : [...current.workingColors, {
        color: retainedSwatch(hex), origin: 'manual', sourceId: current.source.id, roi: null, localShare: null,
      }],
    }
  })
  const addLocalColor = (color: PaletteSwatch, roi: SpatialRoi): 'added' | 'exists' | 'full' => {
    if (!sourceRecord || single.workingColors.length >= 24) return 'full'
    if (retainedHexes.includes(color.hex.toLowerCase())) return 'exists'
    const id = sourceRecord.id
    updateSingle(current => current.source?.id !== id || current.workingColors.length >= 24 || current.workingColors.some(candidate => candidate.color.hex === color.hex) ? current : ({
      ...current, workingColors: [...current.workingColors, { color: { ...color, share: 0 }, origin: 'roi', sourceId: id, roi, localShare: color.share }],
    }))
    return 'added'
  }
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const client = paletteClient.current
    return () => client.cancel()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.domain = domain
  }, [domain])

  useEffect(() => {
    sourceRef.current = sourceRecord
    latestFile.current = sourceRecord?.file ?? null
    // Completed evidence can commit between newer count clicks. It must not
    // overwrite the request cursor; project replacement/undo/redo restore it.
    if (countRestoreEpoch.current !== epoch) {
      countRestoreEpoch.current = epoch
      const count = sourceRecord?.analysis.requestedColorCount ?? 6
      colorCountRef.current = count
      setColorCount(count)
    }
  }, [sourceRecord, epoch])

  useEffect(() => {
    uploadRequestRef.current++
    paletteClient.current.cancel()
    setBusy(false)
    setError('')
    setCopied('')
    setDragging(false)
  }, [epoch])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(''), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const changeDomain = (nextDomain: DomainId) => {
    updateUi({ domain: nextDomain })
  }

  const processFile = async (file?: File, preserveSource = false) => {
    if (!file) return
    latestFile.current = file
    const requestId = ++uploadRequestRef.current
    setBusy(true)
    setError('')
    setCopied('')
    try {
      const processed = await paletteClient.current.run<PaletteResult>({ kind: 'palette', file, count: colorCountRef.current })
      if (requestId !== uploadRequestRef.current) return
      const sameSource = preserveSource && sourceRef.current?.file === file
      // Clear drafts only when a replacement actually succeeds. Re-extraction
      // updates suggestions without overwriting deliberate choices.
      const nextSource: ProjectSource = {
        id: sameSource ? sourceRef.current!.id : crypto.randomUUID(), name: file.name,
        width: processed.width, height: processed.height, file, analysis: processed.analysis, palette: processed.palette,
      }
      sourceRef.current = nextSource
      updateSingle(current => ({ ...current, source: nextSource, roleOverrides: sameSource ? current.roleOverrides : {}, roi: sameSource ? current.roi : null, workingColors: sameSource ? current.workingColors : [],focusSnapshots:sameSource?current.focusSnapshots:[],readingSnapshots:sameSource?current.readingSnapshots:[] }))
    } catch (reason) {
      if (requestId === uploadRequestRef.current) {
        latestFile.current = sourceRef.current?.file ?? null
        setError(reason instanceof Error ? reason.message : '图片处理失败，请重试')
      }
    } finally {
      if (requestId === uploadRequestRef.current) {
        setBusy(false)
        setDragging(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    }
  }

  const changeColorCount = (step: number) => {
    const nextCount = Math.max(2, Math.min(8, colorCountRef.current + step))
    colorCountRef.current = nextCount
    setColorCount(nextCount)
    if (latestFile.current) void processFile(latestFile.current, true)
  }

  const copyColor = async (hex: string) => {
    const didCopy = await copyText(hex)
    if (didCopy) setCopied(hex)
    else setError(`无法自动复制，请手动复制 ${hex}`)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Palette Lab 首页">
          <span className="brand-mark" aria-hidden="true" />
          <span>PALETTE LAB</span>
        </a>
        <div className="topbar-actions">
          <p>LOCAL COLOR ENGINE <span>/ V1 PREVIEW</span></p>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`切换为${theme === 'light' ? '深色' : '浅色'}模式`}>
            <span aria-hidden="true">{theme === 'light' ? '◐' : '○'}</span>{theme === 'light' ? '深色模式' : '浅色模式'}
          </button>
        </div>
      </header>

      <main>
        <ProjectControls />
        <section className="domain-bar mode-bar" aria-label="工作模式">
          <span>工作模式</span>
          <div>
            <button className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>单图</button>
            <button className={mode === 'series' ? 'active' : ''} onClick={() => { setSeriesActivated(true); setMode('series') }}>系列</button>
          </div>
          <small>{mode === 'single' ? '单图色彩系统' : '2–6 张系列作品'}</small>
        </section>

        <section className="intro" hidden={mode !== 'single'}>
          <div>
            <p className="kicker">IMAGE → COLOR SYSTEM</p>
            <h1>色彩工作台</h1>
          </div>
          <p>从图像提取色彩关系，而不仅是色值。取色、编辑和导出在本机完成。</p>
        </section>

        <section className="domain-bar" aria-label="设计领域">
          <span>设计领域</span>
          <div>
            {Object.values(domainProfiles).map((profile) => (
              <button key={profile.id} className={domain === profile.id ? 'active' : ''} onClick={() => changeDomain(profile.id)}>
                {profile.label}
              </button>
            ))}
          </div>
          <small>{domainProfiles[domain].colorRoles.length} 个颜色角色</small>
        </section>

        <WorkbenchNav hasSingle={Boolean(source)} busy={busy} />
        {(seriesActivated || mode === 'series' || project.core.series.images.length > 0) && <div hidden={mode !== 'series'}><SeriesWorkspace domain={domain} /></div>}

        <section className="workspace" hidden={mode !== 'single'}>
          <div className="source-panel">
            <div className="panel-heading">
              <span>01</span><h2>图像输入</h2><small>LOCAL ONLY</small>
            </div>
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''} ${source ? 'has-image' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); void processFile(event.dataTransfer.files[0]) }}
            >
              {source ? (
                <>
                  {source.url && <img src={source.url} alt={`待分析图片：${source.name}`} />}
                  <div className="source-meta">
                    <div><strong>{source.name}</strong><span>{source.width} × {source.height}</span></div>
                    <button onClick={() => inputRef.current?.click()} disabled={busy}>更换图片</button>
                  </div>
                </>
              ) : (
                <div className="drop-content">
                  <span className="upload-symbol" aria-hidden="true">＋</span>
                  <h3>{busy ? '正在分析图片…' : '拖入一张图片'}</h3>
                  <p>PNG、JPG 或 WebP，最大 15 MB</p>
                  <button onClick={() => inputRef.current?.click()} disabled={busy}>选择图片</button>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void processFile(event.target.files?.[0])} hidden />
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
            <div className="privacy-note"><span aria-hidden="true">●</span> 取色与编辑无需上传图片</div>
          </div>

          <div className="palette-panel" aria-busy={busy}>
            <div className="panel-heading">
              <span>02</span><h2>色彩结果</h2><small>{palette.length} COLORS</small>
            </div>
            <div className="palette-toolbar">
              <label htmlFor="color-count">提取数量</label>
              <div className="count-control">
                <button aria-label="减少颜色数量" onClick={() => changeColorCount(-1)} disabled={colorCount <= 2}>−</button>
                <output>{colorCount}</output>
                <button aria-label="增加颜色数量" onClick={() => changeColorCount(1)} disabled={colorCount >= 8}>＋</button>
              </div>
            </div>

            {busy && <p role="status">正在更新色板…</p>}

            {palette.length > 0 ? (
              <>
                <div className="palette-proportion" aria-label="颜色占比图">
                  {palette.map((color, index) => <i key={`${color.hex}-share-${index}`} style={{ backgroundColor: color.hex, flexGrow: color.share }} />)}
                </div>
                <div className="swatch-list" aria-live="polite">
                  {palette.map((color, index) => (
                    <button className="swatch-row" key={`${color.hex}-${index}`} onClick={() => void copyColor(color.hex)} title="点击复制 HEX">
                      <span className="swatch-color" style={{ backgroundColor: color.hex, color: color.oklch[0] > 0.65 ? '#111111' : '#ffffff' }}>
                        <span className="swatch-share">{(color.share * 100).toFixed(1)}%</span>
                        <span className="swatch-on-color">{copied === color.hex ? '已复制 ✓' : '点击复制'}</span>
                      </span>
                      <span className="swatch-info">
                        <strong>{color.hex}</strong>
                        <small>OKLCH {color.oklch[0].toFixed(2)}</small>
                      </span>
                      <span className="copy-label">{copied === color.hex ? '已复制' : '复制'}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-palette">
                <div className="empty-colors" aria-hidden="true"><i /><i /><i /><i /></div>
                <h3>{busy ? '正在生成色组' : '等待图像输入'}</h3>
                <p>色值、占比和颜色空间信息将在这里显示。</p>
              </div>
            )}
          </div>
        </section>

        {source && source.url && palette.length > 0 && (
          <div className="single-results" hidden={mode !== 'single' || busy}>
            <div className="single-compose"><div className="single-edit-pane">
            <RoleEditor
              domain={domain}
              palette={rolePalette}
              contextKey={`${source.id}:${domain}`}
              assignments={assignments}
              editedRoles={Object.keys(roleOverrides[domain] ?? {})}
              editHint="改变色数会保留手动颜色；更换图片会开始新方案。"
              onResetAll={() => updateSingle(current => ({ ...current, roleOverrides: { ...current.roleOverrides, [domain]: {} } }))}
              onChange={changeRole}
            />
            <WorkingPalette colors={single.workingColors} onRemove={hex => updateSingle(current => ({ ...current, workingColors: current.workingColors.filter(candidate => candidate.color.hex !== hex) }))} />
            </div><div className="single-preview-pane">
            <DomainPreview domain={domain} assignments={assignments} spatial={previewEvidence} renderRef={setPreviewTarget} contrastReport={contrastReport} />
            <ExportPanel domain={domain} assignments={assignments} palette={palette} analysis={source.analysis} renderTarget={previewTarget} contrastReport={contrastReport} />
            </div></div>
            <SpatialPanel key={source.id} sourceFile={source.file} sourceUrl={source.url} sourceId={source.id} focusSnapshots={single.focusSnapshots} onFocusResult={saveFocus} readingSnapshots={single.readingSnapshots} onReadingResult={saveReading} palette={palette} roi={single.roi} onRoiChange={changeRoi} onEvidenceChange={recordEvidence} onAddColor={addLocalColor} retainedHexes={retainedHexes} />
            {analysisContext && <AnalysisPanel sourceFile={source.file} context={analysisContext} snapshots={activeSnapshots} selectedSnapshotId={selectedSnapshotId} onSelectSnapshot={setSelectedSnapshotId} onReportChange={saveAnalysis} />}
            <InspirationPanel analysis={analysisReport} historical={Boolean(selectedSnapshot && analysisContext && reportContextKey(selectedSnapshot.context) !== reportContextKey(analysisContext))} domain={domain} sourceFile={source.file} palette={palette} assignments={assignments} />
          </div>
        )}

        <footer className="studio-footer" hidden={mode !== 'single'}>
          <span><i /> LOCAL ENGINE READY</span>
          <p>角色编辑、场景预览与文件导出已启用</p>
        </footer>
      </main>
    </div>
  )
}
