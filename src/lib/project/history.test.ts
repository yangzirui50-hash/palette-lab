import { describe, expect, it } from 'vitest'
import { historyReducer } from './history'
import type { History } from './history'

const initial = (): History<{ color: string; view: string }> => ({ past: [], present: { color: 'red', view: 'palette' }, future: [] })
describe('project edit history', () => {
  it('undoes and redoes a deliberate edit with the previous immutable draft', () => {
    const before = initial()
    const edited = historyReducer(before, { type: 'edit', update: draft => ({ ...draft, color: 'blue' }) })
    const undone = historyReducer(edited, { type: 'undo' })
    expect(undone.present).toBe(before.present)
    expect(historyReducer(undone, { type: 'redo' }).present.color).toBe('blue')
    expect(before.present.color).toBe('red')
  })
  it('does not add browsing changes as undo steps', () => {
    const viewed = historyReducer(initial(), { type: 'edit', remember: false, update: draft => ({ ...draft, view: 'preview' }) })
    expect(viewed.past).toEqual([])
    expect(historyReducer(viewed, { type: 'undo' })).toBe(viewed)
  })
  it('drops an abandoned redo branch after a new deliberate edit', () => {
    let history = historyReducer(initial(), { type: 'edit', update: draft => ({ ...draft, color: 'blue' }) })
    history = historyReducer(history, { type: 'undo' })
    history = historyReducer(history, { type: 'edit', update: draft => ({ ...draft, color: 'green' }) })
    expect(history.future).toEqual([])
    expect(historyReducer(history, { type: 'redo' })).toBe(history)
  })
  it('keeps at most 30 undo records and does not grow on no-op updates', () => {
    let history = initial()
    for (let index = 0; index < 40; index++) history = historyReducer(history, { type: 'edit', update: draft => ({ ...draft, color: String(index) }) })
    expect(history.past).toHaveLength(30)
    expect(history.past[0].color).toBe('9')
    expect(historyReducer(history, { type: 'edit', update: draft => draft })).toBe(history)
  })
  it('retains the same source File reference rather than duplicating its bytes', () => {
    const file = new File(['image'], 'source.png', { type: 'image/png' })
    const history = historyReducer({ past: [], present: { file, color: 'red' }, future: [] }, { type: 'edit', update: draft => ({ ...draft, color: 'blue' }) })
    expect(history.present.file).toBe(history.past[0].file)
  })
})
