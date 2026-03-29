import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'

export const statusRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

statusRoutes.get('/_migration-status', (c) => {
  return c.json({
    ok: true,
    runtime: 'cloudflare-workers',
    version: 2,
    migratedNow: [
      'auth-login-signup-password-reset',
      'profile-and-settings',
      'permissions-and-admin-users-groups',
      'presence-and-active-users-admin-card',
      'uploads-r2-and-public-download',
      'lists-and-contacts-crud',
      'campaigns-crud-and-direct-send',
      'campaign-scheduler-professional-and-queue-endpoints',
      'campaign-send-history',
      'gemini-proxy-and-admin-gemini-keys',
      'google-maps-extraction-routes',
      'instance-lab-admin-api-with-force-and-manual-run',
      'email-webhook-compat-n8n-trigger',
      'extension-info-route',
    ],
    pendingMigration: [
      'queue/scheduler hardening to Cloudflare Queues + Workflows for long running background reliability',
      'observability improvements (structured tracing/alerts)',
      'load-test and soak-test in production traffic profile',
    ],
    recommendedNextStep:
      'Deploy the worker to staging, switch frontend VITE_API_URL, and run end-to-end smoke tests for auth, campaigns, schedules, uploads, AI, and admin.',
    timestamp: new Date().toISOString(),
  })
})
