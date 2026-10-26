import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', (c) => c.json({ status: 'ok', phase: 0 }))

export default app
