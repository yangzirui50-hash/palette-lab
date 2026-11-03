import { useState } from 'react'
import { focusDisplayGroups } from '../domain/focus'
import type { SemanticFocus } from '../domain/focus'
import './SemanticFocusPanel.css'

const labels:Record<SemanticFocus['dominance'],string>={ranked:'主次相对明确',shared:'多个关注点并列',distributed:'关注沿整体结构分布',none:'未见明确主导',uncertain:'暂难判断主次'}

export default function SemanticFocusPanel({focus,sourceUrl,provider,model,createdAt}:{focus:SemanticFocus;sourceUrl:string;provider:string;model:string;createdAt:string}){
 const [selected,setSelected]=useState('')
 const {primary,secondary,details}=focusDisplayGroups(focus)
 const selectedEntity=focus.entities.find(entity=>entity.id===selected)
 const cards=(items:typeof primary,tier:string)=>items.map(item=>{
  const entity=focus.entities.find(entity=>entity.id===item.targetId)!
  return <li key={item.targetId} data-focus-target={entity.id} data-focus-tier={item.tier}>
   <span className="semantic-focus-tier">{tier}</span><strong>{entity.label}</strong><p>{item.reason}</p>
   {entity.bounds&&<button type="button" aria-pressed={selected===entity.id} aria-label={`${selected===entity.id?'收起范围':'查看估计范围'}：${entity.label}`} onClick={()=>setSelected(current=>current===entity.id?'':entity.id)}>{selected===entity.id?'收起范围':'查看估计范围'}</button>}
   {!entity.bounds&&<small>这是关系或整体提示，暂不标位置。</small>}
  </li>
 })
 return <section className="semantic-focus" aria-label="AI主体与主次" data-semantic-dominance={focus.dominance}>
  <div className="semantic-focus-heading"><h3>AI 主体与主次</h3><span>{labels[focus.dominance]}</span></div>
  <p className="semantic-focus-summary">{focus.summary}</p>
  <ul className="semantic-focus-targets">{cards(primary,focus.dominance==='shared'?'并列关注':focus.dominance==='distributed'?'突出线索':'主要关注')}{cards(secondary,'次要关注')}</ul>
  {selectedEntity?.bounds&&sourceUrl&&<figure className="semantic-focus-estimate">
   <div className="semantic-focus-image"><img src={sourceUrl} alt={`整张原图中${selectedEntity.label}的AI估计范围`}/><span aria-hidden="true" className="semantic-focus-bound" style={{left:`${selectedEntity.bounds.x*100}%`,top:`${selectedEntity.bounds.y*100}%`,width:`${selectedEntity.bounds.width*100}%`,height:`${selectedEntity.bounds.height*100}%`}}/></div>
   <figcaption>{selectedEntity.label} · 范围是 AI 粗略估计，尚未人工校验，不是分割边界。</figcaption>
  </figure>}
  {details.length>0&&<details className="semantic-focus-details"><summary>局部与较弱提示（{details.length}）</summary><ul>{details.map(item=><li key={item.targetId}><strong>{focus.entities.find(entity=>entity.id===item.targetId)!.label}</strong>：{item.reason}</li>)}</ul><p>同一主体的局部提示不另算独立视觉中心。</p></details>}
  {focus.uncertainties.length>0&&<details className="semantic-focus-details"><summary>判断中的不确定项（{focus.uncertainties.length}）</summary><ul>{focus.uncertainties.map((item,index)=><li key={index}>{item}</li>)}</ul></details>}
  <p className="semantic-focus-source">针对整张原图的 AI 判断，可供修正；不代表眼动测量。{provider} · {model} · <time dateTime={createdAt}>{new Date(createdAt).toLocaleString()}</time></p>
 </section>
}
