import { cors as honoCors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'

/**
 * CORS Middleware Definitivo
 * Garante que domínios permitidos sempre tenham acesso, inclusive localhost.
 */
export const cors: MiddlewareHandler = (c, next) => {
  const handler = honoCors({
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
  })
  return handler(c, next)
}
