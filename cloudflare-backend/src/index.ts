import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './lib/db'
import { ensureCloudflareSchema } from './lib/schema'
import type { AppVariables, Bindings } from './types'
import { healthRoutes } from './routes/health'
import { presenceRoutes } from './routes/presence'
import { uploadRoutes } from './routes/uploads'
import { instanceLabRoutes } from './routes/instanceLab'

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

app.use('*', cors({
  origin: [
    'https://sendmessage-frontend.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}))

app.use('*', async (c, next) => {
  const db = getDb(c.env)
  c.set('db', db)
  await ensureCloudflareSchema(db)
  await next()
})

app.route('/api', healthRoutes)
app.route('/api', presenceRoutes)
app.route('/api', uploadRoutes)
app.route('/api', instanceLabRoutes)

app.notFound((c) => c.json({ error: 'Rota nao encontrada no backend Cloudflare.' }, 404))
app.onError((error, c) => {
  console.error('[CloudflareBackend] Erro nao tratado:', error)
  return c.json({ error: 'Erro interno no backend Cloudflare.' }, 500)
})

export default app
