import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'
import { isSchemaMissingError, runBestEffortDdl } from '../lib/ddl'
import { DEFAULT_USER_UPLOAD_QUOTA_BYTES, getUploadUsageBytes } from '../lib/uploads'

const DEFAULT_DAILY_MESSAGE_LIMIT = 300
const DEFAULT_MONTHLY_MESSAGE_LIMIT = 9000
const DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT = 5000

function getAuthenticatedUserId(c: { get: (key: 'user') => { id?: string } | undefined }) {
  const user = c.get('user')
  return user?.id ?? null
}

async function isAdminUser(userId: string, db: ReturnType<typeof getDb>) {
  try {
    const result = await db.query(
      `SELECT 1
         FROM public.user_profiles up
         JOIN public.user_groups ug ON ug.id = up.group_id
        WHERE up.id = $1
          AND ug.name = 'Administrador'
        LIMIT 1`,
      [userId]
    )
    return result.rows.length > 0
  } catch (error) {
    if (isSchemaMissingError(error)) return false
    throw error
  }
}

async function ensureUserProfile(userId: string, db: ReturnType<typeof getDb>) {
  await runBestEffortDdl(db, 'profileSettings.ensureUserProfile', [
    `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        display_name TEXT,
        phone TEXT,
        group_id UUID,
        use_global_ai BOOLEAN DEFAULT true,
        ai_api_key TEXT,
        company_info TEXT,
        evolution_url TEXT,
        evolution_apikey TEXT,
        evolution_instance TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS group_id UUID`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS use_global_ai BOOLEAN DEFAULT true`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ai_api_key TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_info TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_url TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_apikey TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_instance TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
  ])

  await db.query('INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [userId])
}

async function ensureAppSettingsTable(db: ReturnType<typeof getDb>) {
  await runBestEffortDdl(db, 'profileSettings.ensureAppSettingsTable', [
    `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        id SERIAL PRIMARY KEY,
        global_ai_api_key TEXT,
        evolution_api_url TEXT,
        evolution_api_key TEXT,
        evolution_shared_instance TEXT,
        google_maps_api_key TEXT,
        gemini_model TEXT,
        gemini_api_version TEXT,
        gemini_temperature NUMERIC(3,2),
        gemini_max_tokens INTEGER,
        send_interval_min INTEGER,
        send_interval_max INTEGER,
        default_daily_message_limit INTEGER DEFAULT 300,
        default_monthly_message_limit INTEGER DEFAULT 9000,
        default_upload_quota_bytes BIGINT DEFAULT 104857600,
        global_gemini_daily_limit INTEGER DEFAULT 5000,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS global_ai_api_key TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS evolution_api_url TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS evolution_api_key TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS evolution_shared_instance TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_model TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_api_version TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2)`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS send_interval_min INTEGER`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS send_interval_max INTEGER`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS default_daily_message_limit INTEGER DEFAULT 300`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS default_monthly_message_limit INTEGER DEFAULT 9000`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS default_upload_quota_bytes BIGINT DEFAULT 104857600`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS global_gemini_daily_limit INTEGER DEFAULT 5000`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
  ])
}

async function getEffectiveLimitSnapshot(userId: string, db: ReturnType<typeof getDb>) {
  const [isAdmin, settingsResult, profileResult, sentTodayResult, sentMonthResult, geminiUsageResult, uploadUsageBytes] =
    await Promise.all([
      isAdminUser(userId, db),
      db.query(
        `SELECT
           default_daily_message_limit,
           default_monthly_message_limit,
           default_upload_quota_bytes,
           global_gemini_daily_limit
         FROM public.app_settings
         ORDER BY id DESC
         LIMIT 1`
      ),
      db.query(
        `SELECT
           use_global_ai,
           daily_message_limit,
           monthly_message_limit,
           upload_quota_bytes
         FROM public.user_profiles
         WHERE id = $1
         LIMIT 1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM public.contact_send_history
         WHERE user_id = $1
           AND channel = 'whatsapp'
           AND ok = true
           AND run_at >= CURRENT_DATE`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM public.contact_send_history
         WHERE user_id = $1
           AND channel = 'whatsapp'
           AND ok = true
           AND date_trunc('month', run_at) = date_trunc('month', CURRENT_DATE)`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM public.gemini_api_usage_logs
         WHERE source = 'global-pool'
           AND data_solicitacao >= CURRENT_DATE`
      ),
      getUploadUsageBytes(db, userId),
    ])

  const settings = settingsResult.rows[0] || {}
  const profile = profileResult.rows[0] || {}
  const uploadLimit = isAdmin
    ? null
    : Number(profile.upload_quota_bytes || settings.default_upload_quota_bytes || DEFAULT_USER_UPLOAD_QUOTA_BYTES)

  return {
    isAdmin,
    dailyMessages: {
      used: Number(sentTodayResult.rows[0]?.total || 0),
      limit: Number(profile.daily_message_limit || settings.default_daily_message_limit || DEFAULT_DAILY_MESSAGE_LIMIT),
    },
    monthlyMessages: {
      used: Number(sentMonthResult.rows[0]?.total || 0),
      limit: Number(profile.monthly_message_limit || settings.default_monthly_message_limit || DEFAULT_MONTHLY_MESSAGE_LIMIT),
    },
    geminiGlobal: {
      usingGlobalPool: profile.use_global_ai ?? true,
      usedToday: Number(geminiUsageResult.rows[0]?.total || 0),
      limit: Number(settings.global_gemini_daily_limit || DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT),
    },
    uploads: {
      usedBytes: Number(uploadUsageBytes || 0),
      limitBytes: uploadLimit,
      unlimited: isAdmin,
    },
  }
}

export const profileSettingsRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

profileSettingsRoutes.get('/profile', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureUserProfile(userId, db)
  const result = await db.query('SELECT * FROM public.user_profiles WHERE id = $1 LIMIT 1', [userId])
  return c.json(result.rows[0] || {})
})

profileSettingsRoutes.get('/profile/full', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureUserProfile(userId, db)
  const profile = await db.query(
    `SELECT up.*, ug.name as group_name
       FROM public.user_profiles up
       LEFT JOIN public.user_groups ug ON up.group_id = ug.id
      WHERE up.id = $1
      LIMIT 1`,
    [userId]
  )
  let permissionsRows: Array<{ code: string }> = []
  try {
    const permissions = await db.query(
      `SELECT p.code
         FROM public.user_profiles up
         JOIN public.group_permissions gp ON up.group_id = gp.group_id
         JOIN public.permissions p ON gp.permission_id = p.id
        WHERE up.id = $1`,
      [userId]
    )
    permissionsRows = permissions.rows as Array<{ code: string }>
  } catch (error) {
    if (!isSchemaMissingError(error)) throw error
  }

  return c.json({
    ...(profile.rows[0] || {}),
    permission_codes: permissionsRows.map((row) => row.code),
  })
})

profileSettingsRoutes.get('/profile/limits', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  const limits = await getEffectiveLimitSnapshot(userId, db)
  return c.json(limits)
})

profileSettingsRoutes.post('/profile', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  const body = await c.req.json().catch(() => ({} as any))
  await ensureUserProfile(userId, db)

  await db.query(
    `UPDATE public.user_profiles SET
        webhook_email_url = COALESCE($1, webhook_email_url),
        use_global_ai = COALESCE($2, use_global_ai),
        ai_api_key = COALESCE($3, ai_api_key),
        use_global_webhooks = COALESCE($4, use_global_webhooks),
        evolution_url = COALESCE($5, evolution_url),
        evolution_apikey = COALESCE($6, evolution_apikey),
        evolution_instance = COALESCE($7, evolution_instance),
        company_info = COALESCE($8, company_info)
      WHERE id = $9`,
    [
      body.webhook_email_url ?? null,
      body.use_global_ai ?? null,
      body.ai_api_key ?? null,
      body.use_global_webhooks ?? null,
      body.evolution_url ?? null,
      body.evolution_apikey ?? null,
      body.evolution_instance ?? null,
      body.company_info ?? null,
      userId,
    ]
  )

  return c.json({ ok: true })
})

profileSettingsRoutes.put('/profile', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  const body = await c.req.json().catch(() => ({} as any))
  await ensureUserProfile(userId, db)

  if (body.display_name !== undefined) {
    await db.query('UPDATE public.users SET name = $1 WHERE id = $2', [body.display_name, userId])
  }

  const fields: string[] = []
  const values: unknown[] = []
  let count = 1

  const addField = (column: string, value: unknown) => {
    if (value !== undefined) {
      fields.push(`${column} = $${count}`)
      values.push(value)
      count += 1
    }
  }

  addField('use_global_ai', body.use_global_ai)
  addField('ai_api_key', body.ai_api_key)
  addField('evolution_url', body.evolution_url)
  addField('evolution_apikey', body.evolution_apikey)
  addField('evolution_instance', body.evolution_instance)
  addField('company_info', body.company_info)
  addField('display_name', body.display_name)
  addField('phone', body.phone)
  addField('gemini_model', body.gemini_model)
  addField('gemini_api_version', body.gemini_api_version)
  addField('gemini_temperature', body.gemini_temperature)
  addField('gemini_max_tokens', body.gemini_max_tokens)
  addField('send_interval_min', body.send_interval_min)
  addField('send_interval_max', body.send_interval_max)

  if (fields.length === 0) {
    return c.json({ error: 'Nenhum campo para atualizar' }, 400)
  }

  values.push(userId)
  await db.query(`UPDATE public.user_profiles SET ${fields.join(', ')} WHERE id = $${count}`, values as unknown[])
  return c.json({ ok: true })
})

profileSettingsRoutes.get('/settings', authenticateToken, async (c) => {
  try {
    const db = getDb(c.env)
    await ensureAppSettingsTable(db)
    const result = await db.query('SELECT * FROM public.app_settings LIMIT 1')
    return c.json(result.rows[0] || {})
  } catch (err: any) {
    console.error('[Settings.get] Erro:', err.message)
    return c.json({ error: 'Erro ao carregar configuracoes.', technical: err.message }, 500)
  }
})

profileSettingsRoutes.post('/settings', authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const db = getDb(c.env)
  await ensureAppSettingsTable(db)
  const check = await db.query('SELECT id FROM public.app_settings LIMIT 1')

  let result
  if (check.rows.length > 0) {
    result = await db.query(
      `UPDATE public.app_settings SET
          global_ai_api_key = $1,
          evolution_api_url = $2,
          evolution_api_key = $3,
          evolution_shared_instance = $4,
          gemini_model = $5,
          gemini_api_version = $6,
          gemini_temperature = $7,
          gemini_max_tokens = $8,
          send_interval_min = $9,
          send_interval_max = $10,
          google_maps_api_key = $11
       RETURNING *`,
      [
        body.global_ai_api_key ?? null,
        body.evolution_api_url ?? null,
        body.evolution_api_key ?? null,
        body.evolution_shared_instance ?? null,
        body.gemini_model ?? null,
        body.gemini_api_version ?? null,
        body.gemini_temperature ?? null,
        body.gemini_max_tokens ?? null,
        body.send_interval_min ?? null,
        body.send_interval_max ?? null,
        body.google_maps_api_key ?? null,
      ]
    )
  } else {
    result = await db.query(
      `INSERT INTO public.app_settings (
          global_ai_api_key,
          evolution_api_url,
          evolution_api_key,
          evolution_shared_instance,
          gemini_model,
          gemini_api_version,
          gemini_temperature,
          gemini_max_tokens,
          send_interval_min,
          send_interval_max,
          google_maps_api_key
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        body.global_ai_api_key ?? null,
        body.evolution_api_url ?? null,
        body.evolution_api_key ?? null,
        body.evolution_shared_instance ?? null,
        body.gemini_model ?? null,
        body.gemini_api_version ?? null,
        body.gemini_temperature ?? null,
        body.gemini_max_tokens ?? null,
        body.send_interval_min ?? null,
        body.send_interval_max ?? null,
        body.google_maps_api_key ?? null,
      ]
    )
  }

  return c.json(result.rows[0] || {})
})
