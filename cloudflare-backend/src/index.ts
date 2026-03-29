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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin',
}

app.use('*', async (c, next) => {
  console.log(`[REQUEST] ${c.req.method} ${c.req.url}`)
  if (c.req.method !== 'GET' && c.req.method !== 'OPTIONS') {
    try {
      const cloned = c.req.raw.clone()
      const body = await cloned.json().catch(() => ({}))
      console.log(`[BODY]`, JSON.stringify(body))
    } catch {}
  }
  await next()
})

app.use('*', cors({ origin: '*' }))

app.use('*', async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error('[CloudflareBackend] Erro capturado no guard global:', error)
    const errObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: String(error) }

    return c.json(
      {
        error: 'Erro interno no backend Cloudflare.',
        technical: errObj.message,
        details: errObj
      },
      500,
      CORS_HEADERS
    )
  }
})

app.options('*', (c) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => c.header(key, value))
  return c.body(null, 204)
})

app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    await next()
    return
  }

  const db = getDb(c.env)
  c.set('db', db)
  // Garante o esquema em background ou na primeira requisição. 
  // O ensureCloudflareSchema possui trava interna para rodar apenas uma vez por isolate.
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
  const technical =
    typeof (error as any)?.message === 'string'
      ? (error as any).message
      : String(error || 'Erro interno')
  return c.json({ error: 'Erro interno no backend Cloudflare.', technical }, 500, CORS_HEADERS)
})

export default app
