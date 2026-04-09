import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './lib/db'
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
import { adminSchemaRoutes } from './routes/adminSchema'
import { extractMapsRoutes } from './routes/extractMaps'
import { emailWebhookRoutes } from './routes/emailWebhook'
import { chatRoutes } from './routes/chat'
import { webhookRoutes } from './routes/webhooks'

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

// 1. MIDDLEWARE DE CORS (Deve ser o primeiríssimo)
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    if (origin.includes('pages.dev') || origin.includes('localhost') || origin.includes('127.0.0.1')) return origin
    return '*'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Version', 'Origin'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}))

// Responder OPTIONS imediatamente
app.options('*', (c) => c.text('', 204))

// 2. MIDDLEWARE DE INJEÇÃO DE BANCO
app.use('/api/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next()
  c.set('db', getDb(c.env))
  await next()
})

// Registro de Rotas (vão aqui todas as rotas omitidas para brevidade no diff, mas mantendo a estrutura)
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
app.route('/api', adminSchemaRoutes)
app.route('/api', extractMapsRoutes)
app.route('/api/email-webhook', emailWebhookRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/webhooks', webhookRoutes)

app.onError((err, c) => {
  const origin = c.req.header('Origin') || '*'
  console.error(`[Global-Error] [${c.req.method}] ${c.req.path}:`, err)
  
  return c.json({ 
    error: 'Erro interno no servidor.', 
    technical: err.message,
    path: c.req.path
  }, 500, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true'
  })
})

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') || '*'
    
    // Configura headers padrão de erro/fallback
    const standardHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, X-Version, Origin',
      'Content-Type': 'application/json'
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: standardHeaders })
    }

    try {
      const response = await app.fetch(request, env, ctx)
      
      // Injeção forçada mesmo se o Hono retornar erro
      const newHeaders = new Headers(response.headers)
      newHeaders.set('Access-Control-Allow-Origin', origin)
      newHeaders.set('Access-Control-Allow-Credentials', 'true')
      
      // Se for 500 sem corpo JSON, convertemos para JSON
      const contentType = response.headers.get('content-type') || ''
      if (response.status >= 500 && !contentType.includes('json')) {
        return new Response(JSON.stringify({ 
          error: 'Erro interno no backend.', 
          status: response.status 
        }), {
          status: response.status,
          headers: { ...standardHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      })
    } catch (err: any) {
      console.error('[Critical-Edge-Panic]', err)
      return new Response(JSON.stringify({ 
        error: 'Critical Server Failure (Edge)', 
        technical: err.message,
        path: new URL(request.url).pathname
      }), {
        status: 500,
        headers: standardHeaders
      })
    }
  },

  async scheduled(event: any, env: Bindings, ctx: ExecutionContext) {
    if (String(env.WARMER_CRON_ENABLED || '').trim().toLowerCase() !== 'true') return
    try {
      const { handleScheduledWarming } = await import('./routes/instanceLab')
      ctx.waitUntil(handleScheduledWarming(env))
    } catch (e) {
      console.error('[Cron-Error]', e)
    }
  }
}
