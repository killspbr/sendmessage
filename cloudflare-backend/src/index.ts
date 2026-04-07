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
import { chatRoutes } from './routes/chat'
import { webhookRoutes } from './routes/webhooks'
import { isSkippableRuntimeSchemaError } from './lib/runtimeSchema'

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()


// Logger para monitorar requisições
app.use('*', async (c, next) => {
  console.log(`[REQUEST] ${c.req.method} ${c.req.url} ${c.req.header('content-type') || ''}`)
  await next()
})

// Configuração CENTRALIZADA de CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}))

app.use('*', async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error('[CloudflareBackend] Erro capturado no guard global:', error)
    const message = error instanceof Error ? error.message : String(error)

    // Defense-in-depth: garantir CORS mesmo se o middleware chain falhar
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')

    return c.json(
      {
        error: 'Erro interno no backend Cloudflare.',
        technical: message,
      },
      500
    )
  }
})



app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    await next()
    return
  }

  let db
  try {
    db = getDb(c.env)
    c.set('db', db)
  } catch (dbError) {
    console.error('[DBInit] Falha ao obter pool do banco:', (dbError as Error).message)
    return c.json(
      { error: 'Servidor temporariamente indisponivel. Tente novamente.', technical: (dbError as Error).message },
      503
    )
  }

  // Schema e repair rodam apenas 1x em background — nunca bloqueiam request
  if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
    c.executionCtx.waitUntil(
      ensureCloudflareSchema(db).catch(() => {})
    )
  }

  await next()
})

app.get('/api/rescue-migration', async (c) => {
  const secret = c.req.query('secret')
  const expected = String(c.env.MIGRATION_SECRET || '').trim()
  if (!expected || secret !== expected) {
    return c.json({ error: 'Acesso negado.' }, 401)
  }
  const db = getDb(c.env)
  try {
    await db.query(`
      ALTER TABLE campaigns ALTER COLUMN channels TYPE JSONB USING to_jsonb(channels);
    `)
    return c.json({ ok: true, message: 'Schema migrado para JSONB com sucesso!' })
  } catch (err: any) {
    return c.json({ ok: false, error: 'Falha na migracao.' }, 500)
  }
})


app.get('/api/version-check', (c) => {
  return c.json({
    status: 'ONLINE',
    version: '1.1.0',
    marker: 'RANDOM-V9-XYZ',
    time: new Date().toISOString()
  })
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
app.route('/api/email-webhook', emailWebhookRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/webhooks', webhookRoutes)

// CORS headers explícitos para handlers que BYPASSAM o middleware chain do Hono
const CORS_SAFE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin',
}

app.notFound((c) => {
  return c.json({ error: 'Rota nao encontrada no backend Cloudflare.' }, 404, CORS_SAFE_HEADERS)
})

app.onError((err, c) => {
  console.error('[GlobalError]', err)

  const msg = err instanceof Error ? err.message : String(err)
  let status = 500
  let body: Record<string, string> = { error: 'Erro interno no servidor.' }

  if (msg.includes('timeout') || msg.includes('DB_QUERY_TIMEOUT')) {
    status = 504
    body = { error: 'Erro de timeout no banco de dados. Tente novamente em instantes.' }
  }

  if (msg.includes('HYPERDRIVE') || msg.includes('DATABASE_URL') || msg.includes('ECONN') || msg.includes('ETIMEDOUT')) {
    status = 503
    body = { error: 'Banco de dados temporariamente indisponivel. Tente novamente.' }
  }

  // onError BYPASSA o middleware cors() do Hono — headers CORS devem ser explicitos aqui
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_SAFE_HEADERS,
      'Content-Type': 'application/json',
    },
  })
})

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Bindings, ctx: ExecutionContext) {
    if (String(env.WARMER_CRON_ENABLED || '').trim().toLowerCase() !== 'true') {
      console.log('[ScheduledTrigger] Warmer cron desabilitado por configuracao.')
      return
    }

    console.log(`[ScheduledTrigger] Executing at ${new Date().toISOString()}. Event: ${event.cron || 'manual'}`)
    
    // Importacao dinamica para evitar problemas de carregamento circular se houver
    const { handleScheduledWarming } = await import('./routes/instanceLab')
    
    // Usamos waitUntil para garantir que o processo termine mesmo se a funcao retornar
    ctx.waitUntil(handleScheduledWarming(env))
  }
}
