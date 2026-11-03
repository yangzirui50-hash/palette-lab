import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ProjectContext } from './context'
import type { ProjectController, SaveState } from './context'
import { emptyProject } from './model'
import type { Project, ProjectRecord, ProjectUi, SeriesDraft, SingleDraft } from './model'
import { historyReducer } from './history'
import { ProjectConflictError, saveProject } from './storage'

type Props = { initialRecord: ProjectRecord | null; readError: string; children: ReactNode }

export default function ProjectProvider({ initialRecord, readError, children }: Props) {
  const [initialProject] = useState(() => initialRecord?.project ?? emptyProject())
  const [history, dispatch] = useReducer(historyReducer<Project>, { past: [], present: initialProject, future: [] })
  const [savedProject, setSavedProject] = useState(initialProject)
  const [epoch, setEpoch] = useState(0)
  const [retry, setRetry] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>(() => readError
    ? { kind: 'error', message: `${readError} 自动保存已暂停以保护旧记录；当前工作仍可编辑和导出。` }
    : initialRecord ? { kind: 'saved', message: '已恢复本地项目' } : { kind: 'idle', message: '项目仅保存在本机' })
  const revision = useRef(initialRecord?.revision ?? 0)
  const blocked = useRef(Boolean(readError))
  const queue = useRef<Promise<void>>(Promise.resolve())
  const sequence = useRef(0)

  const updateSingle = useCallback((update: (draft: SingleDraft) => SingleDraft, remember = true) => {
    dispatch({ type: 'edit', remember, update: project => {
      const single = update(project.core.single)
      return single === project.core.single ? project : { ...project, core: { ...project.core, single } }
    } })
  }, [])
  const updateSeries = useCallback((update: (draft: SeriesDraft) => SeriesDraft, remember = true) => {
    dispatch({ type: 'edit', remember, update: project => {
      const series = update(project.core.series)
      return series === project.core.series ? project : { ...project, core: { ...project.core, series } }
    } })
  }, [])
  const updateUi = useCallback((update: Partial<ProjectUi>) => {
    dispatch({ type: 'edit', remember: false, update: project => {
      const ui = { ...project.ui, ...update }
      return ui.domain === project.ui.domain && ui.mode === project.ui.mode ? project : { ...project, ui }
    } })
  }, [])
  const replaceProject = useCallback((project: Project) => {
    setEpoch(value => value + 1)
    dispatch({ type: 'edit', update: () => project })
  }, [])
  const undo = useCallback(() => { setEpoch(value => value + 1); dispatch({ type: 'undo' }) }, [])
  const redo = useCallback(() => { setEpoch(value => value + 1); dispatch({ type: 'redo' }) }, [])
  const retrySave = useCallback(() => { if (!blocked.current) setRetry(value => value + 1) }, [])

  useEffect(() => {
    if (blocked.current || (history.present === initialProject && history.past.length === 0 && history.future.length === 0 && retry === 0)) return
    const current = ++sequence.current
    const project = history.present
    const timer = window.setTimeout(() => {
      setSaveState({ kind: 'saving', message: '正在保存到本机…' })
      queue.current = queue.current.then(async () => {
        if (blocked.current) return
        const saved = await saveProject(project, revision.current)
        revision.current = saved.revision
        if (current === sequence.current) {
          setSavedProject(project)
          setSaveState({ kind: 'saved', message: '已自动保存到本机' })
        }
      }).catch((error: unknown) => {
        if (error instanceof ProjectConflictError) {
          blocked.current = true
          setSaveState({ kind: 'conflict', message: error.message })
        } else if (current === sequence.current) {
          setSaveState({ kind: 'error', message: '自动保存失败，当前工作仍可编辑和导出。请导出项目备份，释放存储空间后重试。' })
        }
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [history.present, history.past.length, history.future.length, initialProject, retry])

  const visibleSaveState = useMemo<SaveState>(() => history.present !== savedProject && saveState.kind !== 'error' && saveState.kind !== 'conflict'
    ? { kind: 'saving', message: '正在保存到本机…' } : saveState, [history.present, savedProject, saveState])
  const value = useMemo<ProjectController>(() => ({
    project: history.present, epoch, canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    saveState: visibleSaveState, canRetrySave: visibleSaveState.kind === 'error' && !readError, updateSingle, updateSeries, updateUi, replaceProject, undo, redo, retrySave,
  }), [history, epoch, visibleSaveState, readError, updateSingle, updateSeries, updateUi, replaceProject, undo, redo, retrySave])
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
