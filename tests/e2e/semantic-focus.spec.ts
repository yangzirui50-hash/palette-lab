import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import fs from 'node:fs'

async function importImage(page:Page,name='palette-test.png'){
 await page.locator('.workspace input[type=file]').setInputFiles(`tests/fixtures/${name}`)
 await expect(page.locator('.source-meta strong')).toHaveText(name)
 await expect(page.locator('.spatial-preview img')).toBeVisible()
}
async function openFocus(page:Page){
 if(await page.locator('.optional-focus').getAttribute('open')===null)await page.locator('.optional-focus>summary').click()
}
const analyze=async(page:Page)=>{await openFocus(page);await page.getByRole('button',{name:/^(分析|重新判断)主体与主次$/}).click()}
const saved=(page:Page)=>expect(page.locator('.project-save-state')).toHaveAttribute('data-save-state','saved')

test('explicit focus requests survive editing, ROI browsing, reload and backup with no extra calls',async({page,browser},info)=>{
 let calls=0
 page.on('request',request=>{if(request.url().endsWith('/api/focus'))calls++})
 await page.goto('/');await importImage(page)
 expect(calls).toBe(0);await analyze(page)
 await expect(page.locator('.semantic-focus')).toContainText('高亮测试色块')
 await expect(page.locator('.semantic-focus-bound')).toHaveCount(0)
 await page.getByRole('button',{name:'查看估计范围：高亮测试色块'}).click()
 await expect(page.locator('.semantic-focus-bound')).toHaveCSS('background-color','rgba(0, 0, 0, 0)')
 await page.getByLabel('增加颜色数量',{exact:true}).click()
 await page.getByRole('button',{name:'Art / Poster',exact:true}).click()
 await page.locator('.spatial-roi-actions button').first().click()
 await page.locator('.spatial-image-stage').scrollIntoViewIfNeeded()
 const box=await page.locator('.spatial-image-stage').boundingBox();if(!box)throw Error('Missing ROI stage')
 await page.mouse.move(box.x+box.width*.2,box.y+box.height*.2);await page.mouse.down()
 await page.mouse.move(box.x+box.width*.7,box.y+box.height*.7);await page.mouse.up()
 await expect(page.locator('.spatial-palette-heading')).toContainText('局部色板')
 await saved(page);await page.reload();await openFocus(page)
 await expect(page.locator('.semantic-focus')).toContainText('高亮测试色块')
 expect(calls).toBe(1)
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'导出项目备份',exact:true}).click()
 const file=info.outputPath('focus-backup.json');await(await downloaded).saveAs(file)
 expect(JSON.parse(fs.readFileSync(file,'utf8')).project.core.single.focusSnapshots).toHaveLength(1)
 const context=await browser.newContext()
 try{
  const restored=await context.newPage();await restored.goto('http://127.0.0.1:7101/')
  await restored.getByLabel('打开本地项目备份',{exact:true}).setInputFiles(file)
  await expect(restored.locator('.source-meta strong')).toHaveText('palette-test.png');await openFocus(restored)
  await expect(restored.locator('.semantic-focus')).toContainText('高亮测试色块')
  await expect(restored.locator('.semantic-focus-bound')).toHaveCount(0)
 }finally{await context.close()}
})

test('ignores a pending result when its source is replaced',async({page})=>{
 let release!:()=>void
 const gate=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/api/focus',async route=>{
  const response=await route.fetch();await gate
  await route.fulfill({response}).catch(()=>{})
 })
 await page.goto('/');await importImage(page)
 const requested=page.waitForRequest('**/api/focus');await analyze(page);await requested
 await importImage(page,'monochrome-test.png');release();await openFocus(page)
 await expect(page.locator('[data-semantic-status=not-analyzed]')).toBeVisible()
 await saved(page);await page.reload();await expect(page.locator('.optional-focus')).toBeVisible();await openFocus(page)
 await expect(page.locator('[data-semantic-status=not-analyzed]')).toBeVisible()
 await expect(page.locator('.semantic-focus')).toHaveCount(0)
})

test('keeps the saved result and timestamp when a refresh fails validation',async({page})=>{
 await page.goto('/');await importImage(page);await analyze(page)
 await expect(page.locator('.semantic-focus time')).toBeVisible()
 const timestamp=await page.locator('.semantic-focus time').getAttribute('datetime')
 await page.route('**/api/focus',route=>route.fulfill({json:{focus:{schemaVersion:1}}}))
 await analyze(page)
 await expect(page.locator('.focus-analysis [role=alert]')).toContainText('未通过格式检查')
 await expect(page.locator('.semantic-focus time')).toHaveAttribute('datetime',timestamp!)
 await expect(page.locator('.semantic-focus')).toContainText('高亮测试色块')
})

test('selects independent focus history and clears an old estimated box',async({page})=>{
 let count=0
 await page.route('**/api/focus',async route=>{
  const response=await route.fetch(),payload=await response.json();count++
  payload.focus.summary=`合成工作流记录 ${count}`
  await route.fulfill({json:payload})
 })
 await page.goto('/');await importImage(page);await analyze(page)
 await expect(page.locator('.semantic-focus-summary')).toHaveText('合成工作流记录 1')
 await analyze(page)
 await expect(page.locator('.semantic-focus-summary')).toHaveText('合成工作流记录 2')
 await page.getByRole('button',{name:'查看估计范围：高亮测试色块'}).click()
 await page.getByLabel('选择主体判断记录').selectOption({index:0})
 await expect(page.locator('.semantic-focus-summary')).toHaveText('合成工作流记录 1')
 await expect(page.locator('.semantic-focus-bound')).toHaveCount(0)
 await page.getByRole('button',{name:'生成 AI 美学分析',exact:true}).click()
 await expect(page.locator('.analysis-report')).toBeVisible()
 await expect(page.locator('.semantic-focus-summary')).toHaveText('合成工作流记录 1')
 await page.setViewportSize({width:390,height:844})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false)
})
