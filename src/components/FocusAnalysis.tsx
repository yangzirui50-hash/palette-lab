import { useEffect, useRef, useState } from 'react'
import { focusResultSchema } from '../domain/focus'
import { ColorAnalysisClient } from '../lib/color/analysisClient'
import type { FocusMeasurements } from '../lib/color/analysisClient'
import { fileToAiDataUrl } from '../lib/color/aiImage'
import type { FocusSnapshot } from '../lib/project/model'
import SemanticFocusPanel from './SemanticFocusPanel'

export default function FocusAnalysis({sourceFile,sourceId,sourceUrl,snapshots,onResult}:{sourceFile:File;sourceId:string;sourceUrl:string;snapshots:FocusSnapshot[];onResult:(snapshot:FocusSnapshot)=>void}){
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState('')
 const requestId=useRef(0),controller=useRef<AbortController|null>(null),client=useRef(new ColorAnalysisClient())
 const measured=useRef<{file:File;value:FocusMeasurements}|null>(null)
 const snapshot=snapshots.find(snapshot=>snapshot.id===selected)??snapshots.at(-1)
 useEffect(()=>{
  requestId.current++;controller.current?.abort();client.current.cancel();measured.current=null;setLoading(false);setError('')
  const worker=client.current
  return ()=>{controller.current?.abort();worker.cancel()}
 },[sourceFile,sourceId])
 const analyze=async()=>{
  const current=++requestId.current;controller.current?.abort();const abort=new AbortController();controller.current=abort
  setLoading(true);setError('')
  try{
   const [image,measurements]=await Promise.all([fileToAiDataUrl(sourceFile),measured.current?.file===sourceFile?Promise.resolve(measured.current.value):client.current.run<FocusMeasurements>({kind:'focus-input',file:sourceFile})])
   if(abort.signal.aborted||current!==requestId.current)return
   measured.current={file:sourceFile,value:measurements}
   const response=await fetch('/api/focus',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,measurements}),signal:abort.signal})
   const payload=await response.json().catch(()=>{throw Error('暂时无法读取主体判断结果，请稍后重试。')})
   if(!response.ok)throw Error(payload.message??'主体判断暂未完成，请稍后重试。')
   const checked=focusResultSchema.safeParse(payload)
   if(!checked.success)throw Error('AI 主体判断未通过格式检查，请重试。')
   const result=checked.data
   if(abort.signal.aborted||current!==requestId.current)return
   const next={...result,id:crypto.randomUUID(),sourceId,createdAt:new Date().toISOString()}
   onResult(next);setSelected(next.id)
  }catch(reason){
   if(reason instanceof DOMException&&reason.name==='AbortError')return
   if(current===requestId.current&&!abort.signal.aborted)setError(reason instanceof TypeError?'网络连接未完成，请稍后重试。':reason instanceof Error?reason.message:'主体判断暂未完成。')
  }finally{if(current===requestId.current&&!abort.signal.aborted)setLoading(false)}
 }
 return <div className="focus-analysis" aria-busy={loading}>
  <div className="attention-view-control"><button type="button" disabled={loading} onClick={()=>void analyze()}>{loading?'正在判断主体与主次…':snapshot?'重新判断主体与主次':'分析主体与主次'}</button><span>点击后发送压缩图片至 AI；取色与编辑可继续。原图判断可跨色数、用途和局部浏览复用。</span></div>
  {error&&<p role="alert">{error}{snapshot?' 当前仍保留上次的判断。':''}</p>}
  {snapshots.length>1&&<label className="semantic-focus-source">主体判断记录 <select aria-label="选择主体判断记录" value={snapshot?.id??''} onChange={event=>setSelected(event.target.value)}>{snapshots.map(snapshot=><option key={snapshot.id} value={snapshot.id}>{new Date(snapshot.createdAt).toLocaleString()} · {snapshot.model}</option>)}</select></label>}
  {snapshot?<SemanticFocusPanel key={snapshot.id} focus={snapshot.focus} sourceUrl={sourceUrl} provider={snapshot.provider} model={snapshot.model} createdAt={snapshot.createdAt}/>:<p className="spatial-intro" data-semantic-status="not-analyzed">尚未分析原图主体。下方颜色反差参考不代表语义主体判断。</p>}
 </div>
}
