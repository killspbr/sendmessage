import { Hono } from 'hono'
import type { Bindings, AppVariables } from './types'
import { cors } from './core/middlewares/cors'
import { errorHandler } from './core/middlewares/errorHandler'
import { authRoutes } from './modules/auth/routes'
import { profileRoutes } from './modules/profile/routes'

/**
 * SendMessage Backend 2.0 (Refactored)
 */
const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

// 1. FUNDACAO: Middlewares Globais
app.use('*', cors)
app.onError(errorHandler)

// Responder OPTIONS imediatamente para performance
app.options('*', (c) => c.text('', 204))

// 2. MODULOS (A serem implementados)
app.get('/api/health', (c) => c.json({ status: 'ok', version: '2.0.0-refactor' }))
app.route('/api/auth', authRoutes)
app.route('/api/profile', profileRoutes)
// app.route('/api/contacts', contactsRoutes)

/**
 * EXPORTACAO WRAPPER (Fail-safe para Cloudflare Workers)
 */
export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') || '*'
    
    try {
      const response = await app.fetch(request, env, ctx)
      
      // Injeção forçada de CORS se a resposta original falhou em incluí-los
      if (!response.headers.has('Access-Control-Allow-Origin')) {
        const newHeaders = new Headers(response.headers)
        newHeaders.set('Access-Control-Allow-Origin', origin)
        newHeaders.set('Access-Control-Allow-Credentials', 'true')
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        })
      }
      
      return response
    } catch (err: any) {
      console.error('[Critical-Panic]', err)
      return new Response(JSON.stringify({ 
        error: 'Critical Server Panic', 
        technical: err.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }
  }
}
