export type History<T> = { past: T[]; present: T; future: T[] }
export type HistoryAction<T> =
  | { type: 'edit'; update: (present: T) => T; remember?: boolean }
  | { type: 'undo' } | { type: 'redo' }

export function historyReducer<T>(history: History<T>, action: HistoryAction<T>): History<T> {
  if (action.type === 'undo') {
    const previous = history.past.at(-1)
    return previous === undefined ? history : { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] }
  }
  if (action.type === 'redo') {
    const next = history.future[0]
    return next === undefined ? history : { past: [...history.past, history.present].slice(-30), present: next, future: history.future.slice(1) }
  }
  const next = action.update(history.present)
  if (next === history.present) return history
  return action.remember === false
    ? { ...history, present: next }
    : { past: [...history.past, history.present].slice(-30), present: next, future: [] }
}
