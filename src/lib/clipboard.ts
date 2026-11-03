export async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* Clipboard access or permission may be denied; try legacy copy. */ }

  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const inputSelection = previous instanceof HTMLInputElement || previous instanceof HTMLTextAreaElement
    ? { start: previous.selectionStart, end: previous.selectionEnd, direction: previous.selectionDirection } : null
  const selection = document.getSelection()
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : []
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.tabIndex = -1
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  try {
    document.body.appendChild(textarea)
    textarea.focus({ preventScroll: true })
    textarea.select()
    return Boolean(document.execCommand('copy'))
  } catch { return false }
  finally {
    textarea.remove()
    try {
      if (previous?.isConnected) previous.focus({ preventScroll: true })
      if (selection) {
        selection.removeAllRanges()
        ranges.filter(range => range.commonAncestorContainer.isConnected).forEach(range => selection.addRange(range))
      }
      if (inputSelection?.start != null && inputSelection.end != null && (previous instanceof HTMLInputElement || previous instanceof HTMLTextAreaElement) && previous.isConnected) {
        previous.setSelectionRange(inputSelection.start, inputSelection.end, inputSelection.direction ?? undefined)
      }
    } catch { /* A copy handler may remove the original focused element. */ }
  }
}
