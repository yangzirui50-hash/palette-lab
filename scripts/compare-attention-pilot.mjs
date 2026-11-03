import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { compareReviews } from './lib/attention-pilot.mjs'
const [packetFile, firstFile, secondFile] = process.argv.slice(2)
if (!packetFile || !firstFile || !secondFile) throw new Error('Usage: node scripts/compare-attention-pilot.mjs PACKET_JSON REVIEW_A_JSON REVIEW_B_JSON')
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
const packet = read(packetFile), root = path.dirname(path.resolve(packetFile))
for (const entry of packet.entries) {
  if (entry.file !== path.basename(entry.file) || !/^https:\/\//.test(entry.source) || !entry.license) throw new Error('Invalid provenance')
  if (createHash('sha256').update(fs.readFileSync(path.join(root, 'images', entry.file))).digest('hex') !== entry.sha256) throw new Error(`Image checksum mismatch: ${entry.file}`)
}
const report = compareReviews(packet, read(firstFile), read(secondFile))
fs.writeFileSync(path.join(root, '双人试标比较.json'), JSON.stringify(report, null, 2))
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const regions = row => row.targets.map((box, i) => `<rect x="${box.x * 1000}" y="${box.y * 1000}" width="${box.width * 1000}" height="${box.height * 1000}"/><text x="${box.x * 1000 + 8}" y="${box.y * 1000 + 28}">${i + 1}</text>`).join('')
const cards = report.results.map(row => `<section><h2>${escape(row.id)} · ${escape(row.status)}</h2>${row.status === 'incomplete' ? `<p>缺少已确认标注：${escape(row.missing.join('、'))}</p>` : `<p>讨论原因：${escape(row.reasons.join('、') || '暂未发现')}；最低对应框 IoU：${row.minimumIoU === null ? '无框' : row.minimumIoU.toFixed(3)}</p><div class="pair">${row.reviews.map((review, i) => `<article><h3>评审 ${escape(report.reviewers[i])} · ${escape(review.state)}${review.uncertain ? ' · 不确定' : ''}</h3><div class="image"><img src="images/${escape(row.file)}" alt="原图"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none">${regions(review)}</svg></div><p>${escape(review.notes || '无备注')}</p></article>`).join('')}</div>`}</section>`).join('')
fs.writeFileSync(path.join(root, '双人试标复核.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>双人试标复核</title><style>body{margin:24px;background:#eef1eb;color:#203c32;font:16px/1.6 system-ui}section{background:white;padding:20px;border-radius:14px;margin:20px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.image{position:relative;display:inline-block;max-width:100%}img{display:block;max-width:100%;max-height:60vh}svg{position:absolute;inset:0;width:100%;height:100%}rect{fill:#ffda4522;stroke:#ffd940;stroke-width:3;vector-effect:non-scaling-stroke}text{fill:white;font:24px sans-serif;paint-order:stroke;stroke:#111;stroke-width:3px}p{white-space:pre-wrap}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>双人试标复核 · 不构成算法验收</h1><p>两人完成前请勿展示本页。IoU 0.5 仅用于列出讨论项，不自动裁决谁正确；相同错误也可能一致。未生成保留集标签或算法准确率。</p><p>${escape(JSON.stringify(report.summary))}</p>${cards}</html>`)
console.log(JSON.stringify(report.summary, null, 2))
