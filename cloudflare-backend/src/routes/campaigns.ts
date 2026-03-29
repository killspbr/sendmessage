import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

const ALLOWED_CHANNELS = new Set(['whatsapp', 'email'])

function getAuthenticatedUserId(c: { get: (key: 'user') => { id?: string } | undefined }) {
  const user = c.get('user')
  return user?.id ?? null
}

function normalizeText(value: unknown, fallback = '') {
  if (value == null) return fallback
  return String(value).trim()
}

function parseCampaignChannels(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item || '').trim().toLowerCase())
      .filter((channel) => ALLOWED_CHANNELS.has(channel))
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) return parseCampaignChannels(parsed)
    } catch {
      const parts = input.split(',').map((item) => item.trim().toLowerCase())
      return parts.filter((channel) => ALLOWED_CHANNELS.has(channel))
    }
  }

  return []
}

function normalizeDeliveryPayload(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  return input
}

async function ensureCampaignsTable(db: ReturnType<typeof getDb>) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'rascunho',
      channels JSONB NOT NULL DEFAULT '["whatsapp"]'::jsonb,
      list_name TEXT NOT NULL,
      message TEXT NOT NULL,
      variations JSONB NOT NULL DEFAULT '[]'::jsonb,
      interval_min_seconds INTEGER NOT NULL DEFAULT 30,
      interval_max_seconds INTEGER NOT NULL DEFAULT 90,
      delivery_payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_campaigns_user_created_at
      ON campaigns(user_id, created_at DESC)
  `)
}

export const campaignRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

campaignRoutes.get('/campaigns', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  const result = await db.query(
    'SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  )

  return c.json(result.rows)
})

campaignRoutes.post('/campaigns', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const name = normalizeText(body.name)
  const listName = normalizeText(body.list_name)
  const message = normalizeText(body.message)
  const status = normalizeText(body.status, 'rascunho')
  const channels = parseCampaignChannels(body.channels)
  const normalizedChannels = channels.length > 0 ? channels : ['whatsapp']
  const variations = Array.isArray(body.variations) ? body.variations : []
  const deliveryPayload = normalizeDeliveryPayload(body.delivery_payload)
  const intervalMin = Number(body.interval_min_seconds || 30)
  const intervalMax = Number(body.interval_max_seconds || 90)

  if (!name) return c.json({ error: 'Nome da campanha é obrigatório.' }, 400)
  if (!listName) return c.json({ error: 'Lista da campanha é obrigatória.' }, 400)
  if (!message) return c.json({ error: 'Mensagem da campanha é obrigatória.' }, 400)

  const result = await db.query(
    `INSERT INTO campaigns (
      user_id, name, status, channels, list_name, message, variations,
      interval_min_seconds, interval_max_seconds, delivery_payload
    ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7::jsonb,$8,$9,$10::jsonb)
    RETURNING *`,
    [
      userId,
      name,
      status || 'rascunho',
      JSON.stringify(normalizedChannels),
      listName,
      message,
      JSON.stringify(variations),
      Number.isFinite(intervalMin) ? intervalMin : 30,
      Number.isFinite(intervalMax) ? intervalMax : 90,
      deliveryPayload ? JSON.stringify(deliveryPayload) : null,
    ]
  )

  return c.json(result.rows[0], 201)
})

campaignRoutes.put('/campaigns/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const name = normalizeText(body.name)
  const listName = normalizeText(body.list_name)
  const message = normalizeText(body.message)
  const status = normalizeText(body.status, 'rascunho')
  const channels = parseCampaignChannels(body.channels)
  const normalizedChannels = channels.length > 0 ? channels : ['whatsapp']
  const variations = Array.isArray(body.variations) ? body.variations : []
  const deliveryPayload = normalizeDeliveryPayload(body.delivery_payload)
  const intervalMin = Number(body.interval_min_seconds || 30)
  const intervalMax = Number(body.interval_max_seconds || 90)

  const result = await db.query(
    `UPDATE campaigns SET
      name = $1,
      status = $2,
      channels = $3::jsonb,
      list_name = $4,
      message = $5,
      variations = $6::jsonb,
      interval_min_seconds = $7,
      interval_max_seconds = $8,
      delivery_payload = $9::jsonb,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
      AND user_id = $11
    RETURNING *`,
    [
      name,
      status || 'rascunho',
      JSON.stringify(normalizedChannels),
      listName,
      message,
      JSON.stringify(variations),
      Number.isFinite(intervalMin) ? intervalMin : 30,
      Number.isFinite(intervalMax) ? intervalMax : 90,
      deliveryPayload ? JSON.stringify(deliveryPayload) : null,
      campaignId,
      userId,
    ]
  )

  if (!result.rows[0]) return c.json({ error: 'Campanha nao encontrada.' }, 404)
  return c.json(result.rows[0])
})

campaignRoutes.delete('/campaigns/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  await db.query('DELETE FROM campaigns WHERE id = $1 AND user_id = $2', [campaignId, userId])
  return c.json({ ok: true })
})

campaignRoutes.delete('/campaigns', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  await db.query('DELETE FROM campaigns WHERE user_id = $1', [userId])
  return c.json({ ok: true })
})
