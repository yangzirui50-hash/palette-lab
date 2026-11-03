import { afterEach,describe,expect,it,vi } from 'vitest'
import { analyzeSemanticFocus } from './focus'
import type { FocusRequest } from '../../domain/focus'

const request:FocusRequest={image:'data:image/png;base64,AA==',measurements:{scope:'source',palette:[],spatial:[],sampleWidth:64,sampleHeight:64,notes:'Synthetic transport fixture.'}}
const env={AI_PROVIDER:'deepseek',AI_MODEL:'deepseek-flash',AI_API_KEY:'TEST_PRIVATE_KEY'}
afterEach(()=>vi.unstubAllGlobals())
describe('dedicated semantic focus provider',()=>{
 it('requests one focused image task with bounded output and server-generated provenance',async()=>{
  const fixture=await analyzeSemanticFocus({AI_PROVIDER:'mock'},request)
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({model:'returned-model-version',usage:{prompt_tokens:100,completion_tokens:200},choices:[{finish_reason:'stop',message:{content:JSON.stringify(fixture.focus)}}]})))
  vi.stubGlobal('fetch',fetchMock)
  const observe=vi.fn(),result=await analyzeSemanticFocus(env,request,observe)
  expect(result.model).toBe('returned-model-version');expect(result.run.promptTokens).toBe(100)
  const body=JSON.parse(fetchMock.mock.calls[0][1].body)
  expect(body.thinking).toEqual({type:'disabled'});expect(body.max_tokens).toBe(4096)
  expect(body.messages[1].content[1].image_url.detail).toBe('original')
  expect(body.messages[0].content).toContain('color-relation')
  expect(JSON.stringify(result)+JSON.stringify(observe.mock.calls)).not.toContain('TEST_PRIVATE_KEY')
 })
 it('retries a structurally contradictory result once without inventing a ranking',async()=>{
  const {focus}=await analyzeSemanticFocus({AI_PROVIDER:'mock'},request)
  const wrong={...focus,dominance:'shared'}
  const response=(data:unknown)=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}))
  const fetchMock=vi.fn().mockResolvedValueOnce(response(wrong)).mockResolvedValueOnce(response(focus))
  vi.stubGlobal('fetch',fetchMock)
  const result=await analyzeSemanticFocus(env,request)
  expect(result.run.attempts).toBe(2);expect(result.focus.dominance).toBe('ranked');expect(fetchMock).toHaveBeenCalledTimes(2)
 })
 it('rejects repeated invalid focus and does not expose schema internals or provider credentials',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>Promise.resolve(new Response(JSON.stringify({choices:[{message:{content:'{"schemaVersion":1}'}}]})))))
  await expect(analyzeSemanticFocus(env,request)).rejects.toThrow('AI_INVALID_SCHEMA')
 })
 it('does not retry credential failures or make requests when unconfigured',async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(null,{status:401}));vi.stubGlobal('fetch',fetchMock)
  await expect(analyzeSemanticFocus(env,request)).rejects.toThrow('AI_PROVIDER_401')
  expect(fetchMock).toHaveBeenCalledTimes(1)
  await expect(analyzeSemanticFocus({},request)).rejects.toThrow('AI_NOT_CONFIGURED')
  expect(fetchMock).toHaveBeenCalledTimes(1)
 })
 it('keeps DeepSeek-specific vision and thinking options out of other compatible providers',async()=>{
  const {focus}=await analyzeSemanticFocus({AI_PROVIDER:'mock'},request)
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(focus)}}]})))
  vi.stubGlobal('fetch',fetchMock)
  await analyzeSemanticFocus({...env,AI_PROVIDER:'openai',AI_MODEL:'test-vision-model'},request)
  const body=JSON.parse(fetchMock.mock.calls[0][1].body)
  expect(body.thinking).toBeUndefined();expect(body.messages[1].content[1].image_url.detail).toBeUndefined()
 })
})
