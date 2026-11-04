import { z } from 'zod'
import { FOCUS_PROMPT_VERSION, focusResultSchema, semanticFocusPrompt, semanticFocusSchema } from '../../domain/focus'
import type { FocusRequest, FocusResult } from '../../domain/focus'
import type { WorkerEnv } from './types'
import { runStructuredImageTask } from './structuredImage'
import type { ImageTaskObservation } from './structuredImage'

// Keep schema serialization server-only; the color editor does not need it.
const formatGuide='Exact output structure follows as JSON Schema. In particular dominance is one enum string, never an object and never a priority tier. Follow all graph/hierarchy rules above as well; they are checked at runtime. Return the answer JSON, not this schema.\n'+JSON.stringify(z.toJSONSchema(semanticFocusSchema))
export const semanticFocusSystemPrompt=semanticFocusPrompt+'\n'+formatGuide

export type FocusObservation=ImageTaskObservation

export async function analyzeSemanticFocus(env:WorkerEnv,request:FocusRequest,observe?:(event:FocusObservation)=>void):Promise<FocusResult>{
 if(env.AI_PROVIDER==='mock')return {focus:{schemaVersion:1,dominance:'ranked',summary:'合成色块的固定主体判断，仅用于工作流测试。',entities:[{id:'bright',label:'高亮测试色块',kind:'region',parentId:null,bounds:{x:.5,y:0,width:.325,height:1}},{id:'dark',label:'深色测试背景',kind:'region',parentId:null,bounds:{x:0,y:0,width:.5,height:1}}],priorities:[{targetId:'bright',tier:'primary',reason:'合成数据中的高亮区域。'},{targetId:'dark',tier:'weak',reason:'合成背景。'}],uncertainties:['固定合成数据不能用于评估真实识别精度。']},provider:'mock',model:'deterministic-focus-v1',run:{promptVersion:FOCUS_PROMPT_VERSION,scope:'source',actualModel:null,durationMs:0,attempts:1}}
 const {value:focus,...provenance}=await runStructuredImageTask(env,request,{schema:semanticFocusSchema,systemPrompt:semanticFocusSystemPrompt,task:'Analyze original-image visual attention using image and independent sampled measurements.',promptVersion:FOCUS_PROMPT_VERSION,maxTokens:4096,observe})
 return focusResultSchema.parse({focus,...provenance})
}
