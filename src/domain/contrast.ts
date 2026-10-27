import Color from 'colorjs.io'
import type { RoleAssignments } from './assign'
import type { DomainId } from './profiles'

export type ContrastIssue = {
  pair: string
  label: string
  ratio: number
  threshold: number
}

type PairRule = [string, string, string, number]

const rules: Record<DomainId, PairRule[]> = {
  'web-ui': [
    ['background', 'textPrimary', '背景与主要文字', 4.5],
    ['surface', 'textPrimary', '卡片与主要文字', 4.5],
    ['background', 'textMuted', '背景与次要文字', 3],
    ['surface', 'textMuted', '卡片与次要文字', 3],
    ['accent', 'background', '强调按钮与文字', 4.5],
    ['surface', 'success', '卡片与成功状态', 3],
    ['surface', 'error', '卡片与错误状态', 3],
  ],
  'art-poster': [
    ['canvas', 'displayText', '海报底色与展示标题', 4.5],
    ['canvas', 'bodyText', '海报底色与正文', 4.5],
  ],
}

export function contrastRatio(first: string, second: string) {
  return new Color(first).contrast(new Color(second), 'WCAG21')
}

export function getContrastReport(domain: DomainId, assignments: RoleAssignments) {
  const issues: ContrastIssue[] = []
  rules[domain].forEach(([backgroundRole, foregroundRole, label, threshold]) => {
    const background = assignments[backgroundRole]
    const foreground = assignments[foregroundRole]
    if (!background || !foreground) return
    const ratio = contrastRatio(background, foreground)
    if (ratio < threshold) issues.push({ pair: `${backgroundRole}/${foregroundRole}`, label, ratio, threshold })
  })
  return { issues, checked: rules[domain].length }
}
