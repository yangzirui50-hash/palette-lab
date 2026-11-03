import { useRef, useState } from 'react'
import { useProject } from './context'
import { createProjectBackup, readProjectBackup } from './backup'
import { emptyProject } from './model'
import './ProjectControls.css'

export default function ProjectControls() {
  const { project, replaceProject, undo, redo, canUndo, canRedo, saveState, canRetrySave, retrySave } = useProject()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const exportProject = async () => {
    setBusy(true); setError(''); setMessage('')
    try {
      const blob = await createProjectBackup(project)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = 'palette-lab.palette-project.json'; anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('项目备份已生成，包含原图和当前编辑；请妥善保存在本机。')
    } catch (error) { setError(error instanceof Error ? error.message : '项目备份失败，请重试') }
    finally { setBusy(false) }
  }
  const importProject = async (file?: File) => {
    if (!file) return
    setBusy(true); setError(''); setMessage('')
    try {
      const restored = await readProjectBackup(file)
      replaceProject(restored)
      setMessage('已打开项目备份。可撤销返回刚才的工作。')
    } catch (error) { setError(error instanceof Error ? error.message : '无法打开备份，当前工作未被替换') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }

  return <section className="project-controls" aria-label="本地项目管理">
    <div className="project-controls-row">
      <div className="project-save-state" role="status" data-save-state={saveState.kind}>{saveState.message}</div>
      <div className="project-actions">
        <button onClick={() => { setError(''); setMessage(''); undo() }} disabled={!canUndo || busy}>撤销</button>
        <button onClick={() => { setError(''); setMessage(''); redo() }} disabled={!canRedo || busy}>重做</button>
        <button onClick={() => { replaceProject(emptyProject()); setError(''); setMessage('已新建项目。可撤销恢复刚才的工作。') }} disabled={busy}>新建项目</button>
        <button onClick={() => input.current?.click()} disabled={busy}>打开项目</button>
        <button onClick={() => void exportProject()} disabled={busy}>{busy ? '正在处理项目…' : '导出项目备份'}</button>
        {canRetrySave && <button onClick={retrySave}>重试自动保存</button>}
      </div>
    </div>
    <input ref={input} type="file" accept=".json,.palette-project.json,application/json" hidden onChange={event => void importProject(event.target.files?.[0])} aria-label="打开本地项目备份" />
    {error && <p className="project-message project-error" role="alert">{error}</p>}
    {message && <p className="project-message" role="status">{message}</p>}
  </section>
}
