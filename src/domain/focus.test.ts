import { describe, expect, it } from 'vitest'
import { focusDisplayGroups, semanticFocusSchema } from './focus'

const make=()=>({schemaVersion:1,dominance:'ranked',summary:'头像突出。',entities:[{id:'person',label:'人物',kind:'person',parentId:null,bounds:{x:.1,y:.1,width:.6,height:.8}},{id:'face',label:'脸部',kind:'part',parentId:'person',bounds:{x:.2,y:.15,width:.2,height:.2}},{id:'suit',label:'衣服',kind:'part',parentId:'person',bounds:{x:.1,y:.4,width:.6,height:.5}}],priorities:[{targetId:'face',tier:'primary',reason:'表情引人注意。'},{targetId:'suit',tier:'secondary',reason:'明暗反差。'}],uncertainties:[]})

describe('semantic focus result integrity',()=>{
 it('keeps meaningful face and clothing priorities within one person',()=>{
  expect(semanticFocusSchema.safeParse(make()).success).toBe(true)
 })
 it('rejects out-of-source boxes and dangling or repeated subject references',()=>{
  const overflow=make();overflow.entities[1].bounds.x=.9
  expect(semanticFocusSchema.safeParse(overflow).success).toBe(false)
  const unknown=make();unknown.priorities[0].targetId='missing'
  expect(semanticFocusSchema.safeParse(unknown).success).toBe(false)
  const repeated=make();repeated.entities.push(repeated.entities[0])
  expect(semanticFocusSchema.safeParse(repeated).success).toBe(false)
 })
 it('rejects cyclic hierarchy and duplicate parent/part primary counting',()=>{
  const cycle=make();cycle.entities[0].parentId='face'
  expect(semanticFocusSchema.safeParse(cycle).success).toBe(false)
  const duplicate=make();duplicate.dominance='shared';duplicate.priorities.push({targetId:'person',tier:'primary',reason:'同一个人物。'})
  expect(semanticFocusSchema.safeParse(duplicate).success).toBe(false)
 })
 it('distinguishes shared priority, diffuse relationships and no dominant focus',()=>{
  const shared=make();shared.dominance='shared'
  expect(semanticFocusSchema.safeParse(shared).success).toBe(false)
  const none=make();none.dominance='none'
  expect(semanticFocusSchema.safeParse(none).success).toBe(false)
  const relationship={schemaVersion:1,dominance:'distributed',summary:'配色关系突出。',entities:[{id:'colors',label:'黄紫对比',kind:'color-relation',parentId:null,bounds:null}],priorities:[{targetId:'colors',tier:'primary',reason:'互相衬托。'}],uncertainties:[]}
  expect(semanticFocusSchema.safeParse(relationship).success).toBe(true)
  expect(semanticFocusSchema.safeParse({...relationship,dominance:'none',priorities:[]}).success).toBe(true)
 })
 it('nests same-subject context and facial details while retaining sibling clothing as a secondary target',()=>{
  const data=make();data.entities.push({id:'eyes',label:'眼睛',kind:'part',parentId:'face',bounds:{x:.2,y:.2,width:.1,height:.05}})
  data.priorities.push({targetId:'person',tier:'secondary',reason:'人物整体。'},{targetId:'eyes',tier:'secondary',reason:'局部五官。'})
  const view=focusDisplayGroups(semanticFocusSchema.parse(data))
  expect(view.primary.map(item=>item.targetId)).toEqual(['face'])
  expect(view.secondary.map(item=>item.targetId)).toEqual(['suit'])
  expect(view.details.map(item=>item.targetId)).toEqual(['person','eyes'])
 })
})
