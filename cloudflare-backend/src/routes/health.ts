import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'

export const healthRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

healthRoutes.get('/health', (c) => {
  return c.json({
    ok: true,
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  })
})
