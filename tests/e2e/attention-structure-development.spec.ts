import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { AttentionEvidence } from '../../src/lib/color/attention'

type Packet = { entries: Array<{ id: string; file: string; sha256: string }> }
type Stored = { results: Array<{ id: string; file: string; sha256: string; prediction: Omit<AttentionEvidence,'heat'> & { heat: { width: number; height: number; peak: number; values: number[] } } }> }

test('audits structural evidence on an unchanged development packet without manufacturing human accuracy', async ({page}) => {
  const packetFile=process.env.ATTENTION_STRUCTURE_PACKET
  test.skip(!packetFile,'Opt-in diagnostic packet; not independent human qualification')
  test.setTimeout(300_000)
  const images=process.env.ATTENTION_STRUCTURE_IMAGES, previousFile=process.env.ATTENTION_STRUCTURE_PREVIOUS, output=process.env.ATTENTION_STRUCTURE_OUTPUT
  if(!images||!previousFile||!output)throw Error('Provide image directory, previous predictions and explicit output file')
  const packet=JSON.parse(fs.readFileSync(packetFile!,'utf8')) as Packet
  const previous=JSON.parse(fs.readFileSync(previousFile,'utf8')) as Stored
  if(!packet.entries.length||packet.entries.length>1000||new Set(packet.entries.map(row=>row.id)).size!==packet.entries.length)throw Error('Invalid diagnostic packet')
  await page.route('**/api/**',route=>route.abort())
  await page.goto('/')
  const results=[]
  for(const entry of packet.entries){
    if(entry.file!==path.basename(entry.file))throw Error('Image must be a basename')
    const bytes=fs.readFileSync(path.join(images,entry.file))
    if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Image changed')
    const before=previous.results.find(row=>row.id===entry.id)
    if(!before||before.file!==entry.file||before.sha256!==entry.sha256)throw Error('Previous prediction identity mismatch')
    const prediction=await page.evaluate(async({bytes,name})=>{
      const {loadRaster}=await import('/src/lib/color/raster.ts')
      const {analyzeAttention}=await import('/src/lib/color/attention.ts')
      const frame=await loadRaster(new File([new Uint8Array(bytes)],name))
      const start=performance.now(),result=analyzeAttention(frame.pixels,frame.width,frame.height)
      return {...result,heat:{...result.heat,values:[...result.heat.values]},elapsedMs:performance.now()-start}
    },{bytes:[...bytes],name:entry.file})
    expect(prediction.heat).toEqual(before.prediction.heat)
    expect(prediction.scope).toBe('contrast-only')
    const cells=new Set(prediction.regions.flatMap(region=>region.cells))
    for(const cell of cells)expect(prediction.heat.values[cell]).toBeGreaterThanOrEqual(prediction.heat.peak*.35)
    for(const focus of prediction.foci){
      const cell=Math.floor(focus.y*prediction.heat.height)*prediction.heat.width+Math.floor(focus.x*prediction.heat.width)
      expect(cells.has(cell)).toBe(true)
      expect(prediction.heat.values[cell]).toBeGreaterThan(0)
    }
    expect(prediction.regions.length).toBeLessThanOrEqual(3)
    expect(prediction.foci.length).toBeLessThanOrEqual(3)
    results.push({id:entry.id,file:entry.file,sha256:entry.sha256,baseline:{state:before.prediction.state,reason:before.prediction.reason,foci:before.prediction.foci},prediction,heatUnchanged:true})
  }
  const summary={scope:'Development diagnostics after model-assisted verbal review; not held-out attention accuracy',modelVersion:results[0].prediction.version,images:results.length,states:Object.fromEntries([...new Set(results.map(row=>row.prediction.state))].map(state=>[state,results.filter(row=>row.prediction.state===state).length])),heatUnchanged:results.length,humanAccuracy:null}
  fs.mkdirSync(path.dirname(output),{recursive:true})
  fs.writeFileSync(output,JSON.stringify({summary,results},null,2)+'\n')
})
