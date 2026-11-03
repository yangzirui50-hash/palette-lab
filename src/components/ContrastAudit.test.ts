import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { getContrastReport } from '../domain/contrast'
import ContrastAudit from './ContrastAudit'

describe('contrast audit presentation', () => {
  it('does not show success in preview or export when no role pairs can be checked', () => {
    const report = getContrastReport('web-ui', {})
    for (const exporting of [false, true]) {
      const html = renderToStaticMarkup(createElement(ContrastAudit, { report, className: 'audit', exporting }))
      expect(html).toContain('data-contrast-status="incomplete"')
      expect(html).toContain('7 组未检查')
      expect(html).toContain('已检查 0/7 组')
      expect(html).not.toContain('检查通过')
    }
  })
})
