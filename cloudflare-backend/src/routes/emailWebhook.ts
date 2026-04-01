import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

function safeTrim(value: unknown) {
  return String(value || '').trim()
}

async function ensureWebhookSchema(db: ReturnType<typeof getDb>) {
  await db.query('ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS webhook_email_url TEXT')
  await db.query('ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS use_global_webhooks BOOLEAN DEFAULT true')
  await db.query('ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS global_webhook_email_url TEXT')
}

async function resolveEmailWebhookUrl(db: ReturnType<typeof getDb>, userId: string, env: Bindings) {
  const [profileResult, appSettingsResult] = await Promise.all([
    db.query(
      `SELECT webhook_email_url
         FROM public.user_profiles
        WHERE id = $1
        LIMIT 1`,
      [userId]
    ),
    db.query(
      `SELECT global_webhook_email_url
         FROM public.app_settings
        ORDER BY id DESC
        LIMIT 1`
    ),
  ])

  const profile = profileResult.rows[0] || {}
  const settings = appSettingsResult.rows[0] || {}

  return (
    safeTrim(profile.webhook_email_url) ||
    safeTrim(settings.global_webhook_email_url) ||
    safeTrim(env.WEBHOOK_EMAIL) ||
    null
  )
}

export const emailWebhookRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

emailWebhookRoutes.post('/n8n/trigger', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)

  const payload = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const db = getDb(c.env)
  await ensureWebhookSchema(db)

  const webhookUrl = await resolveEmailWebhookUrl(db, user.id, c.env)
  if (!webhookUrl) {
    return c.json({ error: 'Webhook de email nao configurado.' }, 400)
  }

  let response: Response
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    return c.json({ error: `Falha ao acionar webhook de email: ${String((error as any)?.message || error)}` }, 502)
  }

  const contentType = response.headers.get('content-type') || ''
  let body: unknown = null
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null)
  } else {
    body = await response.text().catch(() => '')
  }

  return c.json({
    ok: response.ok,
    status: response.status,
    data: body,
  })
})
