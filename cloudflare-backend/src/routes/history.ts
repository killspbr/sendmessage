import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'
import { runSchemaBestEffort } from '../lib/runtimeSchema'
import { logger } from '../lib/logger'

function getAuthenticatedUserId(c: { get: (key: 'user') => { id?: string } | undefined }) {
  const user = c.get('user')
  return user?.id ?? null
}

async function ensureHistoryTables(db: ReturnType<typeof getDb>) {
  const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)"
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

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_send_history_user_run_at
        ON public.contact_send_history(user_id, run_at DESC)
    `)

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_send_history_campaign_run_at
        ON public.contact_send_history(campaign_id, run_at DESC)
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS public.campaign_history (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        campaign_id UUID,
        status TEXT,
        ok BOOLEAN DEFAULT false,
        total INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_history_user_run_at
        ON public.campaign_history(user_id, run_at DESC)
    `)
  }, 'history')
}

export const historyRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

historyRoutes.post('/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureHistoryTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const historyId = crypto.randomUUID()
  const result = await db.query(
    `INSERT INTO public.contact_send_history (
      id,
      user_id,
      campaign_id,
      campaign_name,
      contact_name,
      phone_key,
      channel,
      ok,
      status,
      webhook_ok,
      run_at,
      provider_status,
      error_detail,
      payload_raw,
      delivery_summary
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb)
    RETURNING *`,
    [
      historyId,
      userId,
      body.campaign_id ?? null,
      body.campaign_name ?? null,
      body.contact_name ?? null,
      body.phone_key ?? null,
      body.channel ?? null,
      body.ok ?? false,
      body.status ?? null,
      body.webhook_ok ?? false,
      body.run_at ?? new Date().toISOString(),
      body.provider_status ?? null,
      body.error_detail ?? null,
      body.payload_raw ? JSON.stringify(body.payload_raw) : null,
      body.delivery_summary ? JSON.stringify(body.delivery_summary) : null,
    ]
  )

  return c.json(result.rows[0], 201)
})

historyRoutes.get('/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  // Paginação: page (default 1), limit (default 50)
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.max(1, Math.min(200, Number(c.req.query('limit') || 50)))

  try {
    const offset = (page - 1) * limit
    const db = getDb(c.env)

    // Busca total para metadados de paginação
    const countRes = await db.query(
      'SELECT COUNT(*)::int AS total FROM public.contact_send_history WHERE user_id = $1',
      [userId]
    )
    const total = countRes.rows[0]?.total || 0

    // Busca paginada
    const result = await db.query(
      'SELECT * FROM public.contact_send_history WHERE user_id = $1 ORDER BY run_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    )

    logger.info(c.env, 'Historico de envios carregado', { userId, page, limit, total })

    return c.json({
      rows: result.rows,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    const technical =
      error instanceof Error ? error.message : String(error || 'Erro interno')
    
    logger.error(c.env, '[history.get] Falha ao carregar historico', error, { 
      userId, 
      technical,
      page,
      limit
    })

    return c.json(
      {
        error: 'Erro ao carregar historico de envios.',
        technical,
      },
      500
    )
  }
})

historyRoutes.delete('/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureHistoryTables(db)
  await db.query('DELETE FROM public.contact_send_history WHERE user_id = $1', [userId])
  return c.json({ ok: true })
})

historyRoutes.get('/campaigns/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)

  // Paginação: page (default 1), limit (default 50)
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.max(1, Math.min(200, Number(c.req.query('limit') || 50)))

  try {
    const offset = (page - 1) * limit
    const db = getDb(c.env)

    // Busca total para metadados de paginação
    const countRes = await db.query(
      'SELECT COUNT(*)::int AS total FROM public.campaign_history WHERE user_id = $1',
      [userId]
    )
    const total = countRes.rows[0]?.total || 0

    // Busca paginada
    const result = await db.query(
      'SELECT * FROM public.campaign_history WHERE user_id = $1 ORDER BY run_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    )

    logger.info(c.env, 'Historico de campanhas carregado', { userId, page, limit, total })

    return c.json({
      rows: result.rows,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    const technical =
      error instanceof Error ? error.message : String(error || 'Erro interno')

    logger.error(c.env, '[campaigns.history.get] Falha ao carregar historico de campanhas', error, {
      userId,
      technical,
      page,
      limit
    })

    return c.json(
      {
        error: 'Erro ao carregar historico de campanhas.',
        technical,
      },
      500
    )
  }
})

historyRoutes.post('/campaigns/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureHistoryTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const historyId = crypto.randomUUID()
  const result = await db.query(
    `INSERT INTO public.campaign_history (
      id,
      user_id,
      campaign_id,
      status,
      ok,
      total,
      error_count,
      run_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      historyId,
      userId,
      body.campaign_id ?? null,
      body.status ?? null,
      body.ok ?? false,
      body.total ?? 0,
      body.error_count ?? 0,
      body.run_at ?? new Date().toISOString(),
    ]
  )

  return c.json(result.rows[0], 201)
})

historyRoutes.delete('/campaigns/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureHistoryTables(db)
  await db.query('DELETE FROM public.campaign_history WHERE user_id = $1', [userId])
  return c.json({ ok: true })
})
