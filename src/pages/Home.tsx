import { useEffect, useRef, useState } from 'react'
import '../App.css'
import '../themes.css'
import { domainProfiles } from '../domain/profiles'
import type { DomainId } from '../domain/profiles'
import { extractPalette } from '../lib/color/extract'
import type { PaletteSwatch, RGBPixel } from '../lib/color/extract'
import { imageFileToPixels } from '../lib/color/image'
import { useTheme } from '../hooks/useTheme'
import { copyText } from '../lib/clipboard'
import { assignPaletteRoles } from '../domain/assign'
import type { RoleAssignments } from '../domain/assign'
import RoleEditor from '../components/RoleEditor'
import DomainPreview from '../components/DomainPreview'
import ExportPanel from '../components/ExportPanel'

type SourceState = {
  url: string
  name: string
  width: number
  height: number
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const pixelsRef = useRef<RGBPixel[]>([])
  const uploadRequestRef = useRef(0)
  const { theme, toggleTheme } = useTheme()
  const [domain, setDomain] = useState<DomainId>('web-ui')
  const [colorCount, setColorCount] = useState(6)
  const [palette, setPalette] = useState<PaletteSwatch[]>([])
  const [assignmentsByDomain, setAssignmentsByDomain] = useState<Record<DomainId, RoleAssignments>>({ 'web-ui': {}, 'art-poster': {} })
  const assignments = assignmentsByDomain[domain]
  const [previewTarget, setPreviewTarget] = useState<HTMLElement | null>(null)
  const [source, setSource] = useState<SourceState | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    document.documentElement.dataset.domain = domain
  }, [domain])

  useEffect(() => {
    if (!source?.url) return
    return () => URL.revokeObjectURL(source.url)
  }, [source?.url])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(''), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const applyPalette = (nextPalette: PaletteSwatch[]) => {
    setPalette(nextPalette)
    setAssignmentsByDomain({
      'web-ui': assignPaletteRoles(nextPalette, 'web-ui'),
      'art-poster': assignPaletteRoles(nextPalette, 'art-poster'),
    })
  }

  const changeDomain = (nextDomain: DomainId) => {
    setDomain(nextDomain)
  }

  const processFile = async (file?: File) => {
    if (!file) return
    const requestId = ++uploadRequestRef.current
    setBusy(true)
    setError('')
    setCopied('')
    try {
      const processed = await imageFileToPixels(file)
      if (requestId !== uploadRequestRef.current) {
        URL.revokeObjectURL(processed.previewUrl)
        return
      }
      pixelsRef.current = processed.pixels
      applyPalette(extractPalette(processed.pixels, colorCount))
      setSource({ url: processed.previewUrl, name: file.name, width: processed.width, height: processed.height })
    } catch (reason) {
      if (requestId === uploadRequestRef.current) {
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

  const changeColorCount = (nextCount: number) => {
    setColorCount(nextCount)
    if (pixelsRef.current.length > 0) applyPalette(extractPalette(pixelsRef.current, nextCount))
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
        <section className="intro">
          <div>
            <p className="kicker">IMAGE → COLOR SYSTEM</p>
            <h1>色彩工作台</h1>
          </div>
          <p>从图像提取色彩关系，而不仅是色值。所有图片仅在你的设备上处理。</p>
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

        <section className="workspace">
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
                  <img src={source.url} alt={`待分析图片：${source.name}`} />
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
            <div className="privacy-note"><span aria-hidden="true">●</span> 原始图片不会离开此设备</div>
          </div>

          <div className="palette-panel">
            <div className="panel-heading">
              <span>02</span><h2>色彩结果</h2><small>{palette.length} COLORS</small>
            </div>
            <div className="palette-toolbar">
              <label htmlFor="color-count">提取数量</label>
              <div className="count-control">
                <button aria-label="减少颜色数量" onClick={() => changeColorCount(Math.max(2, colorCount - 1))} disabled={colorCount <= 2}>−</button>
                <output>{colorCount}</output>
                <button aria-label="增加颜色数量" onClick={() => changeColorCount(Math.min(8, colorCount + 1))} disabled={colorCount >= 8}>＋</button>
              </div>
            </div>

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

        {palette.length > 0 && (
          <>
            <RoleEditor
              domain={domain}
              palette={palette}
              assignments={assignments}
              onChange={(role, hex) => setAssignmentsByDomain((current) => ({
                ...current,
                [domain]: { ...current[domain], [role]: hex },
              }))}
            />
            <DomainPreview domain={domain} assignments={assignments} renderRef={setPreviewTarget} />
            <ExportPanel domain={domain} assignments={assignments} palette={palette} renderTarget={previewTarget} />
          </>
        )}

        <footer className="studio-footer">
          <span><i /> LOCAL ENGINE READY</span>
          <p>角色编辑、场景预览与文件导出已启用</p>
        </footer>
      </main>
    </div>
  )
}
