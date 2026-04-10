import type { ErrorHandler } from 'hono'

/**
 * Global Error Handler (SendMessage 2.0)
 * Captura qualquer exceção não tratada e a transforma em um JSON padronizado.
 * Crucial para manter o CORS funcionando mesmo em falhas críticas.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  const origin = c.req.header('Origin') || '*'
  console.error(`[Global-Error] [${c.req.method}] ${c.req.path}:`, err)

  const status = (err as any).status || 500
  const message = err.message || 'Erro interno no servidor'

  // Retorna JSON com os headers de CORS injetados manualmente
  // Isso previne o erro de 'No Access-Control-Allow-Origin' no navegador
  return c.json({
    error: message,
    technical: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: c.req.path,
    status
  }, status as any, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, X-Version, Origin'
  })
}
