import type { ContrastReport } from '../domain/contrast'
import './ContrastAudit.css'

type ContrastAuditProps = {
  report: ContrastReport
  className: string
  exporting?: boolean
  live?: boolean
}

export default function ContrastAudit({ report, className, exporting = false, live = false }: ContrastAuditProps) {
  const unexamined = report.total - report.checked
  const summary = report.status === 'passed'
    ? `✓ ${report.passed} 组关键对比检查通过`
    : `⚠ ${[
      report.issues.length > 0 ? `${report.issues.length} 组对比不足` : '',
      unexamined > 0 ? `${unexamined} 组未检查` : '',
    ].filter(Boolean).join('，')}；已检查 ${report.checked}/${report.total} 组`

  return (
    <div className={`${className}${report.status === 'passed' ? '' : ' has-issues'}`} role={live ? 'status' : undefined} data-contrast-status={report.status}>
      <p className="contrast-audit-summary">{summary}</p>
      <details className="contrast-audit-details">
        <summary>查看检查详情</summary>
        <ul>
          {report.checks.map(check => (
            <li key={check.pair}>
              <strong>{check.label}：</strong>
              {check.status === 'unexamined'
                ? `未检查（${check.reason === 'missing-color' ? '缺少颜色' : '颜色格式无效'}）`
                // Round down for display, so a sub-threshold value never appears to meet it.
                : `${check.status === 'passed' ? '通过' : '对比不足'} ${(Math.floor(check.ratio * 100) / 100).toFixed(2)}:1（至少 ${check.threshold}:1）`}
            </li>
          ))}
        </ul>
        <p className="contrast-audit-scope">仅检查以上配色组合，不代表完整的可访问性评估。</p>
      </details>
      {exporting && report.status !== 'passed' && <p className="contrast-audit-scope">仍可导出当前颜色，建议先修正；导出不会自动调整配色。</p>}
    </div>
  )
}
