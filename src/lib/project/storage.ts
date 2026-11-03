import { projectRecordSchema } from './model'
import type { Project, ProjectRecord } from './model'

const DATABASE = 'palette-lab-projects'
const STORE = 'projects'
const KEY = 'current'
let database: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (database) return database
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => { database = null; reject(request.error ?? new Error('无法打开本地项目存储')) }
    request.onblocked = () => { database = null; reject(new Error('另一个窗口阻止了本地项目存储，请关闭旧窗口后重试')) }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => { db.close(); database = null }
      resolve(db)
    }
  })
  return database
}

export class ProjectConflictError extends Error {
  constructor() { super('另一个窗口更新了项目，已暂停覆盖。请先导出本页备份，再刷新恢复。') }
}

export async function loadProject(): Promise<ProjectRecord | null> {
  const db = await openDatabase()
  const value: unknown = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).get(KEY)
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error ?? new Error('读取本地项目失败'))
    transaction.onabort = () => reject(transaction.error ?? new Error('读取本地项目被中止'))
  })
  if (value === undefined) return null
  const parsed = projectRecordSchema.safeParse(value)
  if (!parsed.success) throw new Error('本地项目版本或内容无法读取；旧记录未被覆盖。可以先备份当前工作，再处理旧记录。')
  return parsed.data
}

export async function saveProject(project: Project, expectedRevision: number): Promise<ProjectRecord> {
  const db = await openDatabase()
  const record = projectRecordSchema.parse({ schemaVersion: 1, revision: expectedRevision + 1, savedAt: new Date().toISOString(), project })
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    const store = transaction.objectStore(STORE)
    const request = store.get(KEY)
    let failure: Error | null = null
    request.onsuccess = () => {
      const current: unknown = request.result
      let currentRevision = 0
      if (current !== undefined) {
        const parsed = projectRecordSchema.safeParse(current)
        if (!parsed.success) { failure = new ProjectConflictError(); transaction.abort(); return }
        currentRevision = parsed.data.revision
      }
      if (currentRevision !== expectedRevision) { failure = new ProjectConflictError(); transaction.abort(); return }
      try { store.put(record, KEY) } catch (error) { failure = error instanceof Error ? error : new Error('写入本地项目失败'); transaction.abort() }
    }
    transaction.oncomplete = () => resolve(record)
    transaction.onerror = () => reject(failure ?? transaction.error ?? new Error('保存本地项目失败'))
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('保存本地项目被中止'))
  })
}
