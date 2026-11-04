import { z } from 'zod'
import { projectSchema } from './model'
import type { Project, ProjectSource } from './model'

const MAX_BACKUP_SIZE = 150 * 1024 * 1024
const MAX_IMAGE_SIZE = 15 * 1024 * 1024
const encodedFileSchema = z.object({
  name: z.string().min(1).max(512), type: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  lastModified: z.number().int().nonnegative(), data: z.string().max(Math.ceil(MAX_IMAGE_SIZE / 3) * 4),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})
const envelopeSchema = z.object({
  format: z.literal('palette-lab-project'), schemaVersion: z.literal(1), savedAt: z.iso.datetime(), project: z.unknown(),
})
const structureSchema = z.object({
  ui: z.unknown(),
  core: z.object({
    single: z.object({ source: z.unknown() }).passthrough(),
    series: z.object({ images: z.array(z.unknown()).max(6) }).passthrough(),
  }).passthrough(),
}).passthrough()

async function digest(bytes: ArrayBuffer) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function encodeSource(source: ProjectSource) {
  const buffer = await source.file.arrayBuffer(), bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
  return { ...source, file: { name: source.file.name, type: source.file.type, lastModified: source.file.lastModified, data: btoa(binary), sha256: await digest(buffer) } }
}

async function decodeSource(value: unknown) {
  const source = z.object({ file: encodedFileSchema }).passthrough().parse(value)
  let binary: string
  try { binary = atob(source.file.data) } catch { throw new Error('项目中的图片编码无效') }
  if (!binary.length || binary.length > MAX_IMAGE_SIZE) throw new Error('项目中的图片为空或超过 15 MB')
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  if (await digest(bytes.buffer) !== source.file.sha256) throw new Error('项目图片校验失败，当前工作未被替换')
  return { ...source, file: new File([bytes], source.file.name, { type: source.file.type, lastModified: source.file.lastModified }) }
}

export async function createProjectBackup(project: Project): Promise<Blob> {
  projectSchema.parse(project)
  const sources = []
  for (const source of project.core.series.images) sources.push({ ...await encodeSource(source), rolesByDomain: source.rolesByDomain, lockedRoles: source.lockedRoles })
  const encoded = {
    ...project,
    core: {
      single: { ...project.core.single, source: project.core.single.source ? await encodeSource(project.core.single.source) : null },
      series: { ...project.core.series, images: sources },
    },
  }
  const blob = new Blob([JSON.stringify({ format: 'palette-lab-project', schemaVersion: 1, savedAt: new Date().toISOString(), project: encoded })], { type: 'application/json' })
  if (blob.size > MAX_BACKUP_SIZE) throw new Error('项目备份超过 150 MB，请减少图片后重试')
  return blob
}

export async function readProjectBackup(file: File): Promise<Project> {
  if (!file.size || file.size > MAX_BACKUP_SIZE) throw new Error('请选择不超过 150 MB 的项目备份')
  try {
    const envelope = envelopeSchema.parse(JSON.parse(await file.text()))
    const project = structureSchema.parse(envelope.project)
    const singleSource = project.core.single.source
    const images = []
    for (const image of project.core.series.images) images.push(await decodeSource(image))
    const restored = projectSchema.parse({
      ui: project.ui,
      core: {
        single: { ...project.core.single, source: singleSource === null ? null : await decodeSource(singleSource) },
        series: { ...project.core.series, images },
      },
    })
    for (const source of [restored.core.single.source, ...restored.core.series.images]) {
      if (!source) continue
      let image: ImageBitmap
      try { image = await createImageBitmap(source.file) } catch { throw new Error('项目包含无法读取的图片，当前工作未被替换') }
      try {
        if (image.width !== source.width || image.height !== source.height) throw new Error('项目图片尺寸与记录不一致，当前工作未被替换')
      } finally { image.close() }
    }
    return restored
  } catch (error) {
    // eslint-disable-next-line preserve-caught-error -- Keep raw imported data out of the public error boundary.
    if (error instanceof z.ZodError || error instanceof SyntaxError) throw new Error('项目备份的版本或内容无效，当前工作未被替换')
    throw error
  }
}
