import { createContext, useContext } from 'react'
import type { Project, ProjectUi, SeriesDraft, SingleDraft } from './model'

export type SaveState = { kind: 'idle' | 'saving' | 'saved' | 'error' | 'conflict'; message: string }
export type ProjectController = {
  project: Project; epoch: number; canUndo: boolean; canRedo: boolean; canRetrySave: boolean; saveState: SaveState
  updateSingle: (update: (draft: SingleDraft) => SingleDraft, remember?: boolean) => void
  updateSeries: (update: (draft: SeriesDraft) => SeriesDraft, remember?: boolean) => void
  updateUi: (update: Partial<ProjectUi>) => void
  replaceProject: (project: Project) => void
  undo: () => void; redo: () => void; retrySave: () => void
}
export const ProjectContext = createContext<ProjectController | null>(null)
export function useProject() {
  const project = useContext(ProjectContext)
  if (!project) throw new Error('ProjectProvider is missing')
  return project
}
