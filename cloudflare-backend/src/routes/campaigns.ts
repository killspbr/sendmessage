import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'
import { executeWhatsappCampaignDelivery, validateCampaignDeliveryPayload } from '../lib/campaignDelivery'
import { buildContactSendHistoryEntry, insertContactSendHistory } from '../lib/sendHistory'
import { toEvolutionNumber, ensureAbsoluteUrl } from '../lib/messageUtils'
import { runSchemaBestEffort } from '../lib/runtimeSchema'

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

let campaignsSchemaChecked = false

async function ensureCampaignsTable(db: ReturnType<typeof getDb>) {
  if (campaignsSchemaChecked) return
  campaignsSchemaChecked = true

  await runSchemaBestEffort(async () => {
    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {})
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'rascunho',
        channels JSONB NOT NULL DEFAULT '["whatsapp"]'::jsonb,
        list_name TEXT NOT NULL,
        message TEXT NOT NULL,
        variations JSONB NOT NULL DEFAULT '[]'::jsonb,
        interval_min_seconds INTEGER NOT NULL DEFAULT 30,
        interval_max_seconds INTEGER NOT NULL DEFAULT 90,
        delivery_payload JSONB,
        poll JSONB,
        buttons JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS variations JSONB NOT NULL DEFAULT '[]'::jsonb`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS delivery_payload JSONB`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS poll JSONB`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS buttons JSONB`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS interval_min_seconds INTEGER NOT NULL DEFAULT 30`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS interval_max_seconds INTEGER NOT NULL DEFAULT 90`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`).catch(() => {})
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`).catch(() => {})
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_user_created_at
        ON public.campaigns(user_id, created_at DESC)
    `).catch(() => {})
  }, 'campaigns_v3')
}

let historyTableCreated = false

async function ensureContactHistoryTable(db: ReturnType<typeof getDb>) {
  if (historyTableCreated) return
  const UUID_GEN = "gen_random_uuid()"
  await runSchemaBestEffort(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.contact_send_history (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        campaign_id UUID,
        campaign_name TEXT,
        contact_name TEXT,
        phone_key TEXT,
        channel TEXT,
        ok BOOLEAN DEFAULT false,
        status INTEGER,
        webhook_ok BOOLEAN DEFAULT false,
        provider_status TEXT,
        error_detail TEXT,
        payload_raw JSONB,
        delivery_summary JSONB,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }, 'campaigns-history')
  historyTableCreated = true
}

async function resolveEvolutionConfigForUser(userId: string, db: ReturnType<typeof getDb>) {
  const [profileResult, globalSettingsResult] = await Promise.all([
    db.query(
      'SELECT evolution_url, evolution_apikey, evolution_instance FROM public.user_profiles WHERE id = $1 LIMIT 1',
      [userId]
    ),
    db.query(
      'SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM public.app_settings ORDER BY id DESC LIMIT 1'
    ),
  ])

  const profile = profileResult.rows[0] || {}
  const globalSettings = globalSettingsResult.rows[0] || {}

  return {
    evolutionUrl: String(profile.evolution_url || globalSettings.evolution_api_url || '').trim(),
    evolutionApiKey: String(profile.evolution_apikey || globalSettings.evolution_api_key || '').trim(),
    evolutionInstance: String(profile.evolution_instance || globalSettings.evolution_shared_instance || '').trim(),
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const campaignRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

campaignRoutes.get('/campaigns', authenticateToken, async (c) => {
  try {
    const userId = getAuthenticatedUserId(c)
    if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

    const db = getDb(c.env)
    await ensureCampaignsTable(db)
    const result = await db.query(
      'SELECT * FROM public.campaigns WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    return c.json(result.rows)
  } catch (err: any) {
    console.error('[Campaigns.get] Erro:', err.message)
    return c.json({ error: 'Erro ao carregar campanhas.', technical: err.message }, 500)
  }
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

  const campaignId = crypto.randomUUID()

  const result = await db.query(
    `INSERT INTO public.campaigns (
      id, user_id, name, status, channels, list_name, message,
      variations, delivery_payload, interval_min_seconds, interval_max_seconds
    ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb,$9::jsonb,$10,$11)
    RETURNING *`,
    [
      campaignId,
      userId,
      name,
      status || 'rascunho',
      JSON.stringify(normalizedChannels),
      listName,
      message,
      JSON.stringify(variations),
      deliveryPayload ? JSON.stringify(deliveryPayload) : null,
      Number.isFinite(intervalMin) ? intervalMin : 30,
      Number.isFinite(intervalMax) ? intervalMax : 90,
    ]
  )

  return c.json(result.rows[0], 201)
})

// GET individual campaign (polling de status)
campaignRoutes.get('/campaigns/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureCampaignsTable(db)

  const result = await db.query(
    'SELECT id, name, status, list_name, channels, poll, buttons, delivery_payload, interval_min_seconds, interval_max_seconds, created_at FROM public.campaigns WHERE id = $1 AND user_id = $2 LIMIT 1',
    [campaignId, userId]
  )
  const campaign = result.rows[0]
  if (!campaign) return c.json({ error: 'Campanha não encontrada.' }, 404)

  return c.json({
    data: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      listName: campaign.list_name,
      channels: campaign.channels,
      poll: campaign.poll,
      buttons: campaign.buttons,
    },
  })
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
    `UPDATE public.campaigns SET
      name = $1, status = $2, channels = $3::jsonb, list_name = $4, message = $5,
      variations = $6::jsonb, delivery_payload = $7::jsonb,
      interval_min_seconds = $8, interval_max_seconds = $9,
      poll = $10::jsonb, buttons = $11::jsonb,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $12 AND user_id = $13
    RETURNING *`,
    [
      name,
      status || 'rascunho',
      JSON.stringify(normalizedChannels),
      listName,
      message,
      JSON.stringify(variations),
      deliveryPayload ? JSON.stringify(deliveryPayload) : null,
      Number.isFinite(intervalMin) ? intervalMin : 30,
      Number.isFinite(intervalMax) ? intervalMax : 90,
      body.poll ? JSON.stringify(body.poll) : null,
      body.buttons ? JSON.stringify(body.buttons) : null,
      campaignId,
      userId,
    ]
  )

  if (result.rows.length === 0) return c.json({ error: 'Campanha não encontrada ou acesso negado.' }, 404)
  return c.json(result.rows[0])
})

campaignRoutes.delete('/campaigns/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  await db.query('DELETE FROM public.campaigns WHERE id = $1 AND user_id = $2', [campaignId, userId])
  return c.json({ ok: true })
})

campaignRoutes.delete('/campaigns', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  await db.query('DELETE FROM public.campaigns WHERE user_id = $1', [userId])
  return c.json({ ok: true })
})

campaignRoutes.post('/campaigns/:id/send', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureCampaignsTable(db)
  await ensureContactHistoryTable(db)

  const campaignResult = await db.query('SELECT * FROM public.campaigns WHERE id = $1 AND user_id = $2 LIMIT 1', [campaignId, userId])
  const campaign = campaignResult.rows[0]
  if (!campaign) return c.json({ error: 'Campanha não encontrada.' }, 404)

  const listResult = await db.query(
    'SELECT id, name FROM public.lists WHERE user_id = $1 AND name = $2 LIMIT 1',
    [userId, campaign.list_name]
  )
  const list = listResult.rows[0]
  if (!list) return c.json({ error: 'Lista da campanha não encontrada.' }, 400)

  const contactsResult = await db.query(
    `SELECT id, name, phone, email, category, cep, address, city, rating
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2`,
    [userId, list.id]
  )
  const contacts = contactsResult.rows
  if (!contacts.length) return c.json({ error: 'Lista não possui contatos para envio.' }, 400)

  const channels = parseCampaignChannels(campaign.channels)
  const payloadValidation = validateCampaignDeliveryPayload(campaign.delivery_payload, channels)
  if (payloadValidation.errors.length > 0) {
    return c.json({ error: payloadValidation.errors[0] }, 400)
  }

  const evolution = await resolveEvolutionConfigForUser(userId, db)
  const canWhatsapp = channels.includes('whatsapp') && evolution.evolutionUrl && evolution.evolutionApiKey && evolution.evolutionInstance
  if (!canWhatsapp) {
    return c.json({
      error: 'Nenhum serviço de envio configurado. Verifique as configurações da Evolution API para WhatsApp.',
    }, 400)
  }

  if (contacts.length > 120) {
    return c.json({
      error: 'Esta campanha possui muitos contatos para envio direto. Use o agendamento em fila.',
    }, 400)
  }

  // Marca campanha como "em processamento"
  await db.query('UPDATE public.campaigns SET status = $1 WHERE id = $2', ['enviando', campaignId])

  const baseUrl = new URL(c.req.url).origin
  // IMPORTANTE: Não fazer spread de c.env - bindings como R2 podem se perder
  const workerEnv = c.env
  const env = { UPLOADS_BUCKET: workerEnv.UPLOADS_BUCKET, db }

  // Processa os contatos em BACKGROUND usando waitUntil
  // O handler retorna 202 imediatamente, mas o Worker continua executando
  const backgroundTask = (async () => {
    let errors = 0
    let sent = 0

    for (let index = 0; index < contacts.length; index += 1) {
      const contact = contacts[index]
      const evolutionNumber = toEvolutionNumber(contact.phone)

      if (!evolutionNumber) {
        const invalidEntry = buildContactSendHistoryEntry({
          userId,
          campaign,
          contact,
          channel: 'whatsapp',
          error: new Error('Contato sem telefone válido para envio no formato Evolution.'),
        })
        await insertContactSendHistory((sql, params) => db.query(sql, params), invalidEntry)
        errors += 1
        continue
      }

      try {
        const deliveryResult = await executeWhatsappCampaignDelivery({
          evolutionUrl: evolution.evolutionUrl,
          evolutionApiKey: evolution.evolutionApiKey,
          evolutionInstance: evolution.evolutionInstance,
          campaign,
          contact,
          baseUrl,
          env,
        })

        const historyEntry = buildContactSendHistoryEntry({
          userId,
          campaign,
          contact,
          channel: 'whatsapp',
          deliveryResult,
        })
        await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry)
        if (historyEntry.status !== 200) errors += 1
        else sent += 1
      } catch (sendError) {
        const historyEntry = buildContactSendHistoryEntry({
          userId,
          campaign,
          contact,
          channel: 'whatsapp',
          error: sendError,
        })
        await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry)
        errors += 1
      }

      // Delay entre contatos — respeita os valores configurados na campanha
      if (index < contacts.length - 1) {
        const intervalMin = Math.max(Number(campaign.interval_min_seconds || 3), 2)
        const intervalMax = Math.max(Number(campaign.interval_max_seconds || 5), intervalMin)
        const randomDelay = intervalMin + Math.floor(Math.random() * Math.max(1, intervalMax - intervalMin + 1))
        await sleep(randomDelay * 1000)
      }
    }

    // Atualiza status final da campanha no DB
    const finalStatus = errors > 0 ? 'enviada_com_erros' : 'enviada'
    await db.query('UPDATE public.campaigns SET status = $1 WHERE id = $2', [finalStatus, campaignId])
    console.log(`[Campaigns] Disparo concluido: ${campaignId} | Enviados: ${sent} | Erros: ${errors}`)
  })()

  // waitUntil permite que o Worker continue processando depois de responder
  c.executionCtx.waitUntil(backgroundTask)

  return c.json({
    ok: true,
    accepted: true,
    campaignId,
    contactsCount: contacts.length,
    estimatedSeconds: contacts.length * 6,
    message: `Disparo iniciado. ${contacts.length} contato(s) serão processados em segundo plano.`,
  }, 202)
})

