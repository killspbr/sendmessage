import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'

export const statusRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

statusRoutes.get('/_migration-status', (c) => {
  return c.json({
    ok: true,
    runtime: 'cloudflare-workers',
    version: 1,
    migratedNow: [
      'health',
      'presence',
      'active-users-admin-card',
      'uploads-r2',
      'public-upload-delivery',
      'instance-lab-admin-api',
    ],
    pendingMigration: [
      'auth-login-signup-password-reset',
      'contacts-crud',
      'campaigns-crud',
      'reports',
      'gemini-proxy',
      'manual-whatsapp-send',
      'campaign-scheduler',
      'queue-worker',
      'scheduled-worker',
    ],
    recommendedNextStep: 'Migrar login/permissoes e depois portar scheduler/queue para Workflows e Queues.',
    timestamp: new Date().toISOString(),
  })
})
