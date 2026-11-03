export function wrapCanvasText(text: string, maxWidth: number, measure: (value: string) => number): string[] {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) throw new Error('Invalid text width')
  const lines: string[] = []
  let line = ''
  for (const character of Array.from(text)) {
    if (character === '\n') { lines.push(line); line = ''; continue }
    if (line && measure(line + character) > maxWidth) { lines.push(line); line = character }
    else line += character
  }
  lines.push(line)
  return lines
}
