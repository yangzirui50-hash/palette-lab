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
