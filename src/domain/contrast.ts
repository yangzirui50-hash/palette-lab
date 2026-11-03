import Color from 'colorjs.io'
import type { RoleAssignments } from './assign'
import type { DomainId } from './profiles'

export type ContrastIssue = {
  pair: string
  label: string
  ratio: number
  threshold: number
}

export type ContrastCheck = ContrastIssue & { status: 'passed' | 'failed' }
  | {
    pair: string
    label: string
    threshold: number
    ratio: null
    status: 'unexamined'
    reason: 'missing-color' | 'invalid-color'
  }

export type ContrastReport = {
  checks: ContrastCheck[]
  issues: ContrastIssue[]
  checked: number
  passed: number
  total: number
  status: 'passed' | 'failed' | 'incomplete'
}

type PairRule = [string, string, string, number]

const rules: Record<DomainId, PairRule[]> = {
  'web-ui': [
    ['background', 'textPrimary', '背景与主要文字', 4.5],
    ['surface', 'textPrimary', '卡片与主要文字', 4.5],
    ['background', 'textMuted', '背景与次要文字', 4.5],
    ['surface', 'textMuted', '卡片与次要文字', 4.5],
    ['accent', 'background', '强调按钮与文字', 4.5],
    // The preview renders the status names as small colored text, not just icons.
    ['surface', 'success', '卡片与成功状态文字', 4.5],
    ['surface', 'error', '卡片与错误状态文字', 4.5],
  ],
  'art-poster': [
    ['canvas', 'displayText', '海报底色与展示标题', 4.5],
    ['canvas', 'bodyText', '海报底色与正文', 4.5],
  ],
}

export function contrastRatio(first: string, second: string) {
  return new Color(first).contrast(new Color(second), 'WCAG21')
}

export function getContrastReport(domain: DomainId, assignments: RoleAssignments): ContrastReport {
  const issues: ContrastIssue[] = []
  const checks = rules[domain].map(([backgroundRole, foregroundRole, label, threshold]): ContrastCheck => {
    const background = assignments[backgroundRole]
    const foreground = assignments[foregroundRole]
    const pair = `${backgroundRole}/${foregroundRole}`
    if (!background || !foreground) return { pair, label, threshold, ratio: null, status: 'unexamined', reason: 'missing-color' }
    if (![background, foreground].every(value => /^#[0-9a-f]{6}$/i.test(value))) {
      return { pair, label, threshold, ratio: null, status: 'unexamined', reason: 'invalid-color' }
    }
    const ratio = contrastRatio(background, foreground)
    const evidence = { pair, label, ratio, threshold }
    // Compare the full-precision ratio; display rounding must not change the verdict.
    if (ratio < threshold) issues.push(evidence)
    return { ...evidence, status: ratio < threshold ? 'failed' : 'passed' }
  })
  const checked = checks.filter(check => check.status !== 'unexamined').length
  return {
    checks, issues, checked, total: checks.length,
    passed: checks.filter(check => check.status === 'passed').length,
    status: issues.length > 0 ? 'failed' : checked < checks.length ? 'incomplete' : 'passed',
  }
}
