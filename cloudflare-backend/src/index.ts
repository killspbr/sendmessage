import { Hono } from 'hono'
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

app.use('*', async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error('[CloudflareBackend] Erro capturado no guard global:', error)
    const message = error instanceof Error ? error.message : String(error)

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


app.onError((err, c) => {
  console.error('[Hono-Level-Error]', err)
  const origin = c.req.header('Origin') || '*'
  const isAllowed = origin.endsWith('.pages.dev') || ALLOWED_ORIGINS.includes(origin)
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Content-Type': 'application/json'
  }
  if (isAllowed) headers['Access-Control-Allow-Credentials'] = 'true'

  // Retornamos 400 em vez de 500 para CORS funcionar no Cloudflare
  return c.json({ error: 'Erro interno no servidor.', technical: err.message, status: 500 }, 400, headers)
})

app.notFound((c) => {
  const origin = c.req.header('Origin') || '*'
  return c.json({ error: 'Rota nao encontrada' }, 404, { 'Access-Control-Allow-Origin': origin })
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

// ── CONFIGURAÇÃO DEFINITIVA DE CORS (RUNTIME LEVEL) ──────────────────
const ALLOWED_ORIGINS = [
  'https://sendmessage-frontend.pages.dev',
  'https://sendmessage-frontend-pgs.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000'
]

const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Version',
  'Access-Control-Expose-Headers': 'Content-Length, X-Koyeb-Project',
  'Access-Control-Max-Age': '86400',
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')
  const headers: Record<string, string> = { ...DEFAULT_CORS_HEADERS, 'Vary': 'Origin' }

  const isAllowed = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.pages.dev'))
  
  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin!
    headers['Access-Control-Allow-Credentials'] = 'true'
  } else {
    headers['Access-Control-Allow-Origin'] = origin || '*'
  }

  // Suporte para requisições de redes privadas (chrome às vezes pede isso)
  if (request.headers.get('Access-Control-Request-Private-Network') === 'true') {
    headers['Access-Control-Allow-Private-Network'] = 'true'
  }

  return headers
}


export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    let corsHeaders: Record<string, string> = { 'Access-Control-Allow-Origin': '*' }
    
    try {
      corsHeaders = getCorsHeaders(request)

      // 1. Preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
      }

      // 2. Transmissão Hono
      const response = await app.fetch(request, env, ctx)
      
      // 🚨 INTERCEPTAÇÃO DEFINITIVA: Se o status for 500+, forçamos 400 para manter o CORS integro no Cloudflare
      const isError500 = response.status >= 500
      const finalStatus = isError500 ? 400 : response.status
      
      // 3. Clone e injeção de CORS
      const patched = new Response(response.body, {
        status: finalStatus,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      })

      Object.entries(corsHeaders).forEach(([k, v]) => patched.headers.set(k, v))
      
      if (isError500) {
        console.warn(`[CORS-SHIELD] Status 500 detectado e convertido para 400 em ${request.url}`)
      }

      return patched

    } catch (err: any) {
      console.error('[Worker-Fatal]', err.message || err)
      // Usamos 400 em vez de 500 para evitar que o Cloudflare intercepte 
      // e substitua por uma página de erro sem headers CORS.
      return new Response(
        JSON.stringify({ error: 'Erro interno capturado.', technical: err.message || String(err), status: 500 }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  },

  async scheduled(event: any, env: Bindings, ctx: ExecutionContext) {
    if (String(env.WARMER_CRON_ENABLED || '').trim().toLowerCase() !== 'true') return
    const { handleScheduledWarming } = await import('./routes/instanceLab')
    ctx.waitUntil(handleScheduledWarming(env))
  }
}
