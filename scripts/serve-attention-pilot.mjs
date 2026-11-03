import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

export function createPilotServer(directory) {
  const root = path.resolve(directory)
  const files = new Map([['/', '评审A.html'], ['/review-a', '评审A.html'], ['/review-b', '评审B.html']])
  for (const filename of files.values()) if (!fs.statSync(path.join(root, filename)).isFile()) throw new Error('Generate both reviewer pages first')
  return http.createServer((request, response) => {
    const filename = files.get(request.url)
    if (!['GET', 'HEAD'].includes(request.method) || !filename) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); return
    }
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    })
    if (request.method === 'HEAD') { response.end(); return }
    fs.createReadStream(path.join(root, filename)).pipe(response)
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, rawPort = '7107'] = process.argv.slice(2), port = Number(rawPort)
  if (!directory || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Usage: node scripts/serve-attention-pilot.mjs PACKET_DIRECTORY [PORT]')
  const server = createPilotServer(directory)
  server.on('error', error => { console.error(error.message); process.exitCode = 1 })
  server.listen(port, '127.0.0.1', () => console.log(`Local only: http://127.0.0.1:${port}/review-a and /review-b. No upload endpoints.`))
}
