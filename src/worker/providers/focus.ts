import { FOCUS_PROMPT_VERSION, focusResultSchema, semanticFocusPrompt, semanticFocusSchema } from '../../domain/focus'
import type { FocusRequest, FocusResult } from '../../domain/focus'
import type { WorkerEnv } from './types'
import { getProviderDefinition } from './registry'

export type FocusObservation={status:number;actualModel:string|null;durationMs:number;usage:unknown;finishReason:string|null;content:string}

export async function analyzeSemanticFocus(env:WorkerEnv,request:FocusRequest,observe?:(event:FocusObservation)=>void):Promise<FocusResult>{
 if(env.AI_PROVIDER==='mock')return {focus:{schemaVersion:1,dominance:'ranked',summary:'合成色块的固定主体判断，仅用于工作流测试。',entities:[{id:'bright',label:'高亮测试色块',kind:'region',parentId:null,bounds:{x:.5,y:0,width:.325,height:1}},{id:'dark',label:'深色测试背景',kind:'region',parentId:null,bounds:{x:0,y:0,width:.5,height:1}}],priorities:[{targetId:'bright',tier:'primary',reason:'合成数据中的高亮区域。'},{targetId:'dark',tier:'weak',reason:'合成背景。'}],uncertainties:['固定合成数据不能用于评估真实识别精度。']},provider:'mock',model:'deterministic-focus-v1',run:{promptVersion:FOCUS_PROMPT_VERSION,scope:'source',actualModel:null,durationMs:0,attempts:1}}
 if(!env.AI_API_KEY||!env.AI_MODEL)throw Error('AI_NOT_CONFIGURED')
 const endpoint=env.AI_BASE_URL??getProviderDefinition(env.AI_PROVIDER)?.defaultBaseUrl??'https://api.openai.com/v1/chat/completions',started=Date.now()
 for(let attempt=0;attempt<2;attempt++){
  try{
   let response:Response
   try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.AI_API_KEY}`},body:JSON.stringify({model:env.AI_MODEL,response_format:{type:'json_object'},max_tokens:4096,...(env.AI_PROVIDER==='deepseek'?{thinking:{type:'disabled'},temperature:0}:{}),messages:[{role:'system',content:semanticFocusPrompt},{role:'user',content:[{type:'text',text:JSON.stringify({task:'Analyze original-image visual attention using image and independent sampled measurements.',measurements:request.measurements})},{type:'image_url',image_url:{url:request.image,...(env.AI_PROVIDER==='deepseek'?{detail:'original'}:{})}}]}]}),signal:AbortSignal.timeout(90_000)})}
   catch(error){if(error instanceof Error&&['AbortError','TimeoutError'].includes(error.name))throw Error('AI_PROVIDER_TIMEOUT');throw Error('AI_NETWORK_ERROR')}
   if(!response.ok)throw Error(`AI_PROVIDER_${response.status}`)
   const payload=await response.json() as {model?:string;usage?:{prompt_tokens?:number;completion_tokens?:number};choices?:Array<{finish_reason?:string;message?:{content?:string}}>}
   const content=payload.choices?.[0]?.message?.content??''
   observe?.({status:response.status,actualModel:payload.model??null,durationMs:Math.max(0,Date.now()-started),usage:payload.usage??null,finishReason:payload.choices?.[0]?.finish_reason??null,content})
   if(!content.trim())throw Error('AI_EMPTY_RESPONSE')
   let parsed:unknown
   try{parsed=JSON.parse(content.trim().replace(/^```(?:json)?\s*|\s*```$/g,''))}catch{throw Error('AI_INVALID_JSON')}
   const checked=semanticFocusSchema.safeParse(parsed)
   if(!checked.success)throw Error('AI_INVALID_SCHEMA')
   const count=(value:unknown)=>typeof value==='number'&&Number.isInteger(value)&&value>=0?value:undefined
   return focusResultSchema.parse({focus:checked.data,provider:getProviderDefinition(env.AI_PROVIDER)?.id??'openai-compatible',model:payload.model??env.AI_MODEL,run:{promptVersion:FOCUS_PROMPT_VERSION,scope:'source',actualModel:payload.model??null,durationMs:Math.max(0,Date.now()-started),attempts:attempt+1,promptTokens:count(payload.usage?.prompt_tokens),completionTokens:count(payload.usage?.completion_tokens)}})
  }catch(error){
   const retry=error instanceof Error&&(/AI_PROVIDER_5\d\d/.test(error.message)||['AI_PROVIDER_TIMEOUT','AI_NETWORK_ERROR','AI_EMPTY_RESPONSE','AI_INVALID_JSON','AI_INVALID_SCHEMA'].includes(error.message))
   if(attempt===1||!retry)throw error
  }
 }
 throw Error('AI_ANALYSIS_FAILED')
}
