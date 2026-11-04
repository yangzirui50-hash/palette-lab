import { z } from 'zod'
import { focusResultSchema } from '../../domain/focus'
import type { FocusResult } from '../../domain/focus'
import { readingResultSchema } from '../../domain/reading'
import type { ReadingResult } from '../../domain/reading'
import { analysisReportSchema, spatialRegionSchema } from '../../domain/analysis'
import type { AnalysisReport } from '../../domain/analysis'
import type { RoleAssignments } from '../../domain/assign'
import { domainProfiles } from '../../domain/profiles'
import type { DomainId } from '../../domain/profiles'
import type { SeriesStrategy } from '../../domain/unify'
import type { PaletteSwatch } from '../color/extract'
import type { ImageAnalysisMetadata } from '../color/pipelineConfig'
import type { SpatialRegionEvidence, SpatialRoi } from '../color/spatial'

export type RoleDrafts = Partial<Record<DomainId, RoleAssignments>>
export type UnifiedDrafts = Partial<Record<DomainId, Partial<Record<SeriesStrategy, RoleAssignments>>>>
export type ProjectSource = {
  id: string; name: string; file: File; width: number; height: number
  palette: PaletteSwatch[]; analysis: ImageAnalysisMetadata
}
export type ReportContext = {
  sourceId: string; sourceName: string; domain: DomainId
  palette: PaletteSwatch[]; assignments: RoleAssignments
  spatialEvidence: SpatialRegionEvidence[]; roi: SpatialRoi | null
}
export type ReportSnapshot = { id: string; createdAt: string; context: ReportContext; report: AnalysisReport }
export type FocusSnapshot=FocusResult&{id:string;createdAt:string;sourceId:string}
export type ReadingSnapshot = ReadingResult & { id: string; createdAt: string; sourceId: string }
export type WorkingColor = {
  color: PaletteSwatch; origin: 'roi' | 'manual'; sourceId: string
  roi: SpatialRoi | null; localShare: number | null
}
export type SingleDraft = {
  source: ProjectSource | null; roleOverrides: RoleDrafts
  snapshots: ReportSnapshot[]; roi: SpatialRoi | null; workingColors: WorkingColor[];focusSnapshots:FocusSnapshot[];readingSnapshots:ReadingSnapshot[]
}
export type SeriesSource = ProjectSource & { rolesByDomain: Record<DomainId, RoleAssignments>; lockedRoles: string[] }
export type SeriesDraft = {
  images: SeriesSource[]; primaryId: string; selectedId: string
  view: 'overview' | 'inspect' | 'unify'
  strategiesByDomain: Partial<Record<DomainId, SeriesStrategy>>
  unifiedDrafts: UnifiedDrafts
}
export type ProjectCore = { single: SingleDraft; series: SeriesDraft }
export type ProjectUi = { domain: DomainId; mode: 'single' | 'series' }
export type Project = { core: ProjectCore; ui: ProjectUi }

const domainSchema = z.enum(['web-ui', 'art-poster'])
const strategySchema = z.enum(['follow-primary', 'balanced', 'preserve-accents'])
const hexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const idSchema = z.string().min(1).max(100)
const channelSchema = z.number().int().min(0).max(255)
const swatchSchema: z.ZodType<PaletteSwatch> = z.object({
  hex: hexSchema,
  rgb: z.tuple([channelSchema, channelSchema, channelSchema]),
  oklch: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(360)]),
  share: z.number().min(0).max(1),
}).refine(color => color.hex.toLowerCase() === `#${color.rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`, '色板 RGB 与 HEX 不一致')
const paletteSchema = z.array(swatchSchema).min(1).max(8)
  .refine(colors => Math.abs(colors.reduce((sum, color) => sum + color.share, 0) - 1) < 0.001, '色板占比无效')

const analysisSchema: z.ZodType<ImageAnalysisMetadata> = z.object({
  version: z.string().min(1).max(40), maxEdge: z.number().int().min(1).max(4096),
  alphaCutoff: channelSchema, maxSamples: z.number().int().min(1).max(1_000_000),
  histogramStep: z.number().int().min(1).max(255), requestedColorCount: z.number().int().min(2).max(8),
})
const roleSchema = (domain: DomainId) => z.record(z.string().max(64), hexSchema)
  .refine(roles => Object.keys(roles).every(role => domainProfiles[domain].colorRoles.includes(role)), '未知颜色角色')
const roleDraftsSchema = z.object({ 'web-ui': roleSchema('web-ui').optional(), 'art-poster': roleSchema('art-poster').optional() })
const strategiesSchema = z.object({ 'web-ui': strategySchema.optional(), 'art-poster': strategySchema.optional() })
const strategyDraft = (domain: DomainId) => z.object({
  'follow-primary': roleSchema(domain).optional(), balanced: roleSchema(domain).optional(), 'preserve-accents': roleSchema(domain).optional(),
})
const roiSchema: z.ZodType<SpatialRoi> = z.object({
  x: z.number().min(0).max(1), y: z.number().min(0).max(1),
  width: z.number().positive().max(1), height: z.number().positive().max(1),
}).refine(roi => roi.x + roi.width <= 1.000001 && roi.y + roi.height <= 1.000001, '框选范围无效')
const fileSchema = z.instanceof(File).refine(file => file.size > 0 && file.size <= 15 * 1024 * 1024 && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type), '图片格式或大小无效')
const sourceShape = {
  id: idSchema, name: z.string().min(1).max(512), file: fileSchema,
  width: z.number().int().positive().max(100_000), height: z.number().int().positive().max(100_000),
  palette: paletteSchema, analysis: analysisSchema,
}
const sourceSchema: z.ZodType<ProjectSource> = z.object(sourceShape)
const reportContextSchema: z.ZodType<ReportContext> = z.object({
  sourceId: idSchema, sourceName: z.string().min(1).max(512), domain: domainSchema,
  palette: paletteSchema, assignments: z.record(z.string().max(64), hexSchema),
  spatialEvidence: z.array(spatialRegionSchema).max(8), roi: roiSchema.nullable(),
})
const snapshotSchema: z.ZodType<ReportSnapshot> = z.object({
  id: idSchema, createdAt: z.iso.datetime(), context: reportContextSchema, report: analysisReportSchema,
})
const focusSnapshotSchema: z.ZodType<FocusSnapshot> = focusResultSchema.extend({id:idSchema,createdAt:z.iso.datetime(),sourceId:idSchema})
const readingSnapshotSchema: z.ZodType<ReadingSnapshot> = readingResultSchema.extend({ id: idSchema, createdAt: z.iso.datetime(), sourceId: idSchema })
const workingColorSchema: z.ZodType<WorkingColor> = z.object({
  color: swatchSchema.refine(color => color.share === 0, '候选色不能冒充整图占比'),
  origin: z.enum(['roi', 'manual']), sourceId: idSchema, roi: roiSchema.nullable(), localShare: z.number().min(0).max(1).nullable(),
}).refine(candidate => candidate.origin === 'roi' ? candidate.roi !== null && candidate.localShare !== null : candidate.roi === null && candidate.localShare === null, '候选颜色来源无效')
const singleSchema: z.ZodType<SingleDraft> = z.object({
  source: sourceSchema.nullable(), roleOverrides: roleDraftsSchema,
  snapshots: z.array(snapshotSchema).max(20), roi: roiSchema.nullable(),
  workingColors: z.array(workingColorSchema).max(24).default([]),
  focusSnapshots:z.array(focusSnapshotSchema).max(10).default([]),
  readingSnapshots: z.array(readingSnapshotSchema).max(10).default([]),
}).refine(single => single.workingColors.every(candidate => candidate.sourceId === single.source?.id), '候选色不属于当前图片')
  .refine(single=>single.focusSnapshots.every(snapshot=>snapshot.sourceId===single.source?.id)&&new Set(single.focusSnapshots.map(snapshot=>snapshot.id)).size===single.focusSnapshots.length,'主体判断不属于当前图片或记录重复')
  .refine(single => single.readingSnapshots.every(snapshot => snapshot.sourceId === single.source?.id) && new Set(single.readingSnapshots.map(snapshot => snapshot.id)).size === single.readingSnapshots.length, '整体解读不属于当前图片或记录重复')
const seriesSourceSchema: z.ZodType<SeriesSource> = z.object({
  ...sourceShape,
  rolesByDomain: z.object({ 'web-ui': roleSchema('web-ui'), 'art-poster': roleSchema('art-poster') }),
  lockedRoles: z.array(z.string().max(64)).max(14).refine(roles => roles.every(role => Object.values(domainProfiles).some(domain => domain.colorRoles.includes(role))), '未知锁定角色'),
})
const seriesSchema: z.ZodType<SeriesDraft> = z.object({
  images: z.array(seriesSourceSchema).max(6), primaryId: z.string().max(100), selectedId: z.string().max(100),
  view: z.enum(['overview', 'inspect', 'unify']), strategiesByDomain: strategiesSchema,
  unifiedDrafts: z.object({ 'web-ui': strategyDraft('web-ui').optional(), 'art-poster': strategyDraft('art-poster').optional() }),
}).refine(series => {
  const ids = series.images.map(image => image.id)
  return new Set(ids).size === ids.length && (ids.length === 0
    ? series.primaryId === '' && series.selectedId === ''
    : ids.includes(series.primaryId) && ids.includes(series.selectedId))
}, '系列主图或图像标识无效')

export const projectSchema: z.ZodType<Project> = z.object({
  core: z.object({ single: singleSchema, series: seriesSchema }),
  ui: z.object({ domain: domainSchema, mode: z.enum(['single', 'series']) }),
})
export const projectRecordSchema = z.object({
  schemaVersion: z.literal(1), revision: z.number().int().nonnegative(), savedAt: z.iso.datetime(), project: projectSchema,
})
export type ProjectRecord = z.infer<typeof projectRecordSchema>

export function emptyProject(): Project {
  return {
    ui: { domain: 'web-ui', mode: 'single' },
    core: {
      single: { source: null, roleOverrides: {}, snapshots: [], roi: null, workingColors: [],focusSnapshots:[],readingSnapshots:[] },
      series: { images: [], primaryId: '', selectedId: '', view: 'overview', strategiesByDomain: {}, unifiedDrafts: {} },
    },
  }
}

export function reportContextKey(context: ReportContext) {
  return JSON.stringify({
    sourceId: context.sourceId, domain: context.domain,
    palette: context.palette.map(color => [color.hex, color.share]),
    assignments: Object.entries(context.assignments).sort(([a], [b]) => a.localeCompare(b)),
    spatial: context.spatialEvidence.map(region => [region.hex, region.pixelCount, region.share,
      region.centroid.x, region.centroid.y, region.dominantCentroid.x, region.dominantCentroid.y,
      region.bounds.x, region.bounds.y, region.bounds.width, region.bounds.height,
      region.centerShare, region.edgeShare, region.largestComponentShare, region.componentCount, region.meanColorSeparation]),
    roi: context.roi ? [context.roi.x, context.roi.y, context.roi.width, context.roi.height] : null,
  })
}
