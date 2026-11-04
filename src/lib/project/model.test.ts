import { describe, expect, it } from 'vitest'
import { emptyProject, projectRecordSchema, projectSchema, reportContextKey } from './model'
import type { ProjectSource, ReportContext } from './model'
import { COLOR_PIPELINE } from '../color/pipelineConfig'
import { extractPalette } from '../color/extract'

const source = (): ProjectSource => ({
  id: 'source', name: 'image.png', file: new File(['image'], 'image.png', { type: 'image/png' }),
  width: 10, height: 10, palette: extractPalette([[100, 150, 200]], 6), analysis: { ...COLOR_PIPELINE, requestedColorCount: 6 },
})
describe('versioned project model', () => {
  it('loads earlier version-one projects with an empty optional candidate pool', () => {
    const project = emptyProject()
    const legacySingle = { source: null, roleOverrides: {}, snapshots: [], roi: null }
    expect(projectSchema.parse({ ...project, core: { ...project.core, single: legacySingle } }).core.single.workingColors).toEqual([])
    expect(projectSchema.parse({ ...project, core: { ...project.core, single: legacySingle } }).core.single.focusSnapshots).toEqual([])
    expect(projectSchema.parse({ ...project, core: { ...project.core, single: legacySingle } }).core.single.readingSnapshots).toEqual([])
  })
  it('keeps reading task identity, ownership and history separate from legacy focus records', async () => {
    const { analyzeImageReading } = await import('../../worker/providers/reading')
    const result = await analyzeImageReading({ AI_PROVIDER: 'mock' }, { task: 'whole-image-reading', image: 'data:image/png;base64,AA==', measurements: { scope: 'source', palette: [], spatial: [], sampleWidth: 64, sampleHeight: 64, notes: '' } })
    const project = emptyProject(); project.core.single.source = source()
    const record = { ...result, id: 'reading', sourceId: 'source', createdAt: '2026-11-04T00:00:00.000Z' }
    project.core.single.readingSnapshots = [record]
    expect(projectSchema.parse(project).core.single.focusSnapshots).toEqual([])
    expect(projectSchema.parse(project).core.single.readingSnapshots[0].task).toBe('whole-image-reading')
    for (const invalid of [{ ...record, sourceId: 'other' }, { ...record, task: 'semantic-focus' }]) {
      expect(projectSchema.safeParse({ ...project, core: { ...project.core, single: { ...project.core.single, readingSnapshots: [invalid] } } }).success).toBe(false)
    }
    project.core.single.readingSnapshots.push(record)
    expect(projectSchema.safeParse(project).success).toBe(false)
  })
  it('ties cached semantic judgments to the source and rejects invalid target structure',()=>{
    const project=emptyProject();project.core.single.source=source()
    project.core.single.focusSnapshots=[{id:'focus',createdAt:'2026-11-03T00:00:00.000Z',sourceId:'source',provider:'synthetic',model:'fixture',run:{promptVersion:'test',scope:'source',actualModel:null,durationMs:0,attempts:1},focus:{schemaVersion:1,dominance:'none',summary:'合成无主导测试。',entities:[],priorities:[],uncertainties:[]}}]
    expect(projectSchema.safeParse(project).success).toBe(true)
    project.core.single.focusSnapshots[0].sourceId='other'
    expect(projectSchema.safeParse(project).success).toBe(false)
    project.core.single.focusSnapshots[0].sourceId='source';project.core.single.focusSnapshots[0].focus.dominance='ranked'
    expect(projectSchema.safeParse(project).success).toBe(false)
  })
  it('keeps ROI candidates separate from global measured shares and tied to their source', () => {
    const project = emptyProject(); project.core.single.source = source()
    project.core.single.workingColors = [{ color: { ...source().palette[0], share: 0 }, origin: 'roi', sourceId: 'source', roi: { x: 0, y: 0, width: .5, height: .5 }, localShare: .5 }]
    expect(projectSchema.safeParse(project).success).toBe(true)
    project.core.single.workingColors[0].color.share = .5
    expect(projectSchema.safeParse(project).success).toBe(false)
    project.core.single.workingColors[0].color.share = 0; project.core.single.workingColors[0].sourceId = 'other'
    expect(projectSchema.safeParse(project).success).toBe(false)
  })
  it('accepts an empty project and a validated source with a retained manual color', () => {
    const project = emptyProject()
    project.core.single.source = source()
    project.core.single.roleOverrides = { 'web-ui': { background: '#123456' } }
    expect(projectSchema.parse(project).core.single.source?.file).toBe(project.core.single.source.file)
  })
  it('rejects unknown format revisions rather than overwriting them with an empty project', () => {
    expect(projectRecordSchema.safeParse({ schemaVersion: 999, revision: 1, savedAt: new Date().toISOString(), project: emptyProject() }).success).toBe(false)
  })
  it('rejects a series whose primary is missing or whose IDs are duplicated', () => {
    const project = emptyProject(), image = { ...source(), rolesByDomain: { 'web-ui': {}, 'art-poster': {} }, lockedRoles: [] }
    project.core.series.images = [image]
    project.core.series.primaryId = 'missing'; project.core.series.selectedId = 'source'
    expect(projectSchema.safeParse(project).success).toBe(false)
    project.core.series.primaryId = 'source'; project.core.series.images.push(image)
    expect(projectSchema.safeParse(project).success).toBe(false)
  })
  it('rejects invalid roles, normalized shares and HEX/RGB mismatches', () => {
    const project = emptyProject(); project.core.single.source = source()
    project.core.single.roleOverrides = { 'web-ui': { unknownRole: '#123456' } }
    expect(projectSchema.safeParse(project).success).toBe(false)
    project.core.single.roleOverrides = {}
    project.core.single.source.palette[0].share = 0.2
    expect(projectSchema.safeParse(project).success).toBe(false)
    project.core.single.source.palette[0].share = 1; project.core.single.source.palette[0].hex = '#000000'
    expect(projectSchema.safeParse(project).success).toBe(false)
  })
  it('keys reports by captured evidence while ignoring role object insertion order', () => {
    const context: ReportContext = { sourceId: 'source', sourceName: 'image.png', domain: 'web-ui', palette: source().palette, assignments: { background: '#000000', accent: '#ffffff' }, spatialEvidence: [], roi: null }
    expect(reportContextKey(context)).toBe(reportContextKey({ ...context, assignments: { accent: '#ffffff', background: '#000000' } }))
    expect(reportContextKey(context)).not.toBe(reportContextKey({ ...context, roi: { x: 0, y: 0, width: 0.5, height: 0.5 } }))
  })
})
