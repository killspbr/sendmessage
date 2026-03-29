import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './lib/db'
import { ensureCloudflareSchema } from './lib/schema'
import type { AppVariables, Bindings } from './types'
import { healthRoutes } from './routes/health'
import { statusRoutes } from './routes/status'
import { authRoutes } from './routes/auth'
import { presenceRoutes } from './routes/presence'
import { uploadRoutes } from './routes/uploads'
import { instanceLabRoutes } from './routes/instanceLab'
import { profileSettingsRoutes } from './routes/profileSettings'
import { historyRoutes } from './routes/history'
import { listsContactsRoutes } from './routes/listsContacts'
import { campaignRoutes } from './routes/campaigns'
import { extensionRoutes } from './routes/extension'
import { scheduleRoutes } from './routes/schedules'
import { aiRoutes } from './routes/ai'
import { adminOpsRoutes } from './routes/adminOps'
import { adminUsersRoutes } from './routes/adminUsers'
import { extractMapsRoutes } from './routes/extractMaps'
import { emailWebhookRoutes } from './routes/emailWebhook'

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()
const ALLOWED_ORIGINS = new Set([
  'https://sendmessage-frontend.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
])

app.use('*', cors({
  origin: [...ALLOWED_ORIGINS],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}))

app.options('*', (c) => {
  const origin = c.req.header('origin') || ''
  if (ALLOWED_ORIGINS.has(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
  }
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
  return c.body(null, 204)
})

app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    await next()
    return
  }

  const db = getDb(c.env)
  c.set('db', db)
  await ensureCloudflareSchema(db)
  await next()
})

app.route('/api', healthRoutes)
app.route('/api', statusRoutes)
app.route('/api', authRoutes)
app.route('/api', profileSettingsRoutes)
app.route('/api', presenceRoutes)
app.route('/api', uploadRoutes)
app.route('/api', instanceLabRoutes)
app.route('/api', historyRoutes)
app.route('/api', listsContactsRoutes)
app.route('/api', campaignRoutes)
app.route('/api', extensionRoutes)
app.route('/api', scheduleRoutes)
app.route('/api', aiRoutes)
app.route('/api', adminOpsRoutes)
app.route('/api', adminUsersRoutes)
app.route('/api', extractMapsRoutes)
app.route('/api', emailWebhookRoutes)

app.notFound((c) => c.json({ error: 'Rota nao encontrada no backend Cloudflare.' }, 404))
app.onError((error, c) => {
  console.error('[CloudflareBackend] Erro nao tratado:', error)
  const origin = c.req.header('origin') || ''
  if (ALLOWED_ORIGINS.has(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
  }
  const technical =
    typeof (error as any)?.message === 'string'
      ? (error as any).message
      : String(error || 'Erro interno')
  return c.json({ error: 'Erro interno no backend Cloudflare.', technical }, 500)
})

export default app
