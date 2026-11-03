import { useProject } from '../lib/project/context'

export default function WorkbenchNav({ hasSingle, busy }: { hasSingle: boolean; busy: boolean }) {
  const { project, updateSeries } = useProject()
  const series = project.ui.mode === 'series'
  const ready = series ? project.core.series.images.length >= 2 : hasSingle && !busy
  const targets = series ? [
    { text: '作品', label: '跳到系列图像输入', selector: '.series-import' },
    { text: '统一', label: '跳到系列统一配色', selector: '.series-unify .role-editor', view: 'unify' as const },
    { text: '预览', label: '跳到系列场景预览', selector: '.series-unify .domain-preview', view: 'unify' as const },
    { text: '检查', label: '跳到系列单图检查', selector: '.series-inspection', view: 'inspect' as const },
    { text: '导出', label: '跳到系列文件导出', selector: '.series-export', view: 'unify' as const },
  ] : [
    { text: '取色', label: '跳到图像输入', selector: '.workspace' },
    { text: '配色', label: '跳到角色分配', selector: '.single-results .role-editor' },
    { text: '预览', label: '跳到场景预览', selector: '.single-results .domain-preview' },
    { text: '区域', label: '跳到区域分析', selector: '.single-results .spatial-panel' },
    { text: '导出', label: '跳到文件导出', selector: '.single-results .export-panel' },
  ]
  return <nav className="workbench-nav" aria-label="工作流程导航">
    <span>快速跳转</span>
    {targets.map((target, index) => <button key={target.label} type="button" aria-label={target.label} disabled={index > 0 && !ready} onClick={() => {
      if ('view' in target && target.view) updateSeries(current => ({ ...current, view: target.view! }), false)
      requestAnimationFrame(() => document.querySelector(target.selector)?.scrollIntoView({ block: 'start', behavior: 'auto' }))
    }}>{target.text}</button>)}
  </nav>
}
