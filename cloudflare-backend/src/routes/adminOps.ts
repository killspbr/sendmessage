import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken, checkAdmin } from '../lib/auth'
import { getDb } from '../lib/db'
import { runBestEffortDdl } from '../lib/ddl'

async function ensureAdminOpsTables(db: ReturnType<typeof getDb>) {
  await runBestEffortDdl(db, 'adminOps.ensureAdminOpsTables', [
    `
      CREATE TABLE IF NOT EXISTS campaign_schedule (
        id SERIAL PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data_inicio DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        limite_diario INTEGER DEFAULT 300,
        intervalo_minimo INTEGER DEFAULT 30,
        intervalo_maximo INTEGER DEFAULT 90,
        mensagens_por_lote INTEGER DEFAULT 45,
        tempo_pausa_lote INTEGER DEFAULT 15,
        status TEXT DEFAULT 'agendado',
        scheduler_claimed_at TIMESTAMP WITH TIME ZONE,
        pause_reason TEXT,
        pause_details TEXT,
        paused_at TIMESTAMP WITH TIME ZONE,
        resumed_at TIMESTAMP WITH TIME ZONE,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS message_queue (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES campaign_schedule(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_id TEXT,
        telefone TEXT NOT NULL,
        nome TEXT,
        mensagem TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        tentativas INTEGER DEFAULT 0,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_envio TIMESTAMP WITH TIME ZONE,
        processing_started_at TIMESTAMP WITH TIME ZONE,
        recovered_at TIMESTAMP WITH TIME ZONE,
        erro TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS gemini_api_keys (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        api_key TEXT NOT NULL,
        status TEXT DEFAULT 'ativa',
        ultimo_uso TIMESTAMP WITH TIME ZONE,
        requests_count INTEGER DEFAULT 0,
        data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        observacoes TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS gemini_api_usage_logs (
        id SERIAL PRIMARY KEY,
        key_id INTEGER,
        user_id UUID,
        module TEXT,
        resultado TEXT,
        erro TEXT,
        source TEXT DEFAULT 'global-pool',
        key_label TEXT,
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS erro TEXT`,
    `ALTER TABLE gemini_api_usage_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'global-pool'`,
    `ALTER TABLE gemini_api_usage_logs ADD COLUMN IF NOT EXISTS key_label TEXT`,
  ])
}

export const adminOpsRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

adminOpsRoutes.get('/admin/gemini-keys', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminOpsTables(db)
  const result = await db.query(
    `SELECT id, nome, status, ultimo_uso, requests_count, data_cadastro, observacoes
       FROM gemini_api_keys
      ORDER BY data_cadastro DESC`
  )
  return c.json({ success: true, data: result.rows })
})

adminOpsRoutes.post('/admin/gemini-keys', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminOpsTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const nome = String(body.nome || '').trim()
  const apiKey = String(body.api_key || '').trim()
  const status = String(body.status || 'ativa').trim() || 'ativa'
  const observacoes = body.observacoes == null ? null : String(body.observacoes)

  if (!nome || !apiKey) {
    return c.json({ success: false, error: 'Nome e chave de API são obrigatórios' }, 400)
  }

  const result = await db.query(
    `INSERT INTO gemini_api_keys (nome, api_key, status, observacoes)
     VALUES ($1,$2,$3,$4)
     RETURNING id, nome, status, ultimo_uso, requests_count, data_cadastro, observacoes`,
    [nome, apiKey, status, observacoes]
  )
  return c.json({ success: true, data: result.rows[0] }, 201)
})

adminOpsRoutes.delete('/admin/gemini-keys/:id', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminOpsTables(db)
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ success: false, error: 'ID inválido.' }, 400)
  await db.query('DELETE FROM gemini_api_keys WHERE id = $1', [id])
  return c.json({ success: true })
})

adminOpsRoutes.post('/admin/gemini-keys/reset', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminOpsTables(db)
  await db.query("UPDATE gemini_api_keys SET requests_count = 0, status = CASE WHEN status = 'limite_atingido' THEN 'ativa' ELSE status END")
  return c.json({ success: true })
})

adminOpsRoutes.get('/admin/operational-stats', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminOpsTables(db)

  const [sentToday, sentLastHour, pendingQueue, failedToday, runningSchedules, activeKeys, aiUsage] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS total FROM message_queue WHERE status = 'enviado' AND data_envio >= CURRENT_DATE"),
    db.query("SELECT COUNT(*)::int AS total FROM message_queue WHERE status = 'enviado' AND data_envio >= (NOW() - INTERVAL '1 hour')"),
    db.query("SELECT COUNT(*)::int AS total FROM message_queue WHERE status = 'pendente'"),
    db.query("SELECT COUNT(*)::int AS total FROM message_queue WHERE status = 'falhou' AND data_criacao >= CURRENT_DATE"),
    db.query("SELECT COUNT(*)::int AS total FROM campaign_schedule WHERE status = 'em_execucao'"),
    db.query("SELECT COUNT(*)::int AS total FROM gemini_api_keys WHERE status = 'ativa'"),
    db.query(
      `SELECT
         COUNT(*)::int AS requests_today,
         COUNT(*) FILTER (WHERE source IN ('admin-pool', 'global-pool'))::int AS global_pool_requests_today,
         COUNT(*) FILTER (WHERE source = 'legacy-global-settings')::int AS legacy_global_requests_today,
         COUNT(*) FILTER (WHERE source = 'user-profile')::int AS user_requests_today,
         COUNT(*) FILTER (WHERE source = 'environment')::int AS environment_requests_today
       FROM gemini_api_usage_logs
       WHERE data_solicitacao >= CURRENT_DATE`
    ),
  ])

  const usageRow = aiUsage.rows[0] || {}

  return c.json({
    enviadas_hoje: Number(sentToday.rows[0]?.total || 0),
    enviadas_ultima_hora: Number(sentLastHour.rows[0]?.total || 0),
    fila_pendente: Number(pendingQueue.rows[0]?.total || 0),
    falhas_hoje: Number(failedToday.rows[0]?.total || 0),
    campanhas_em_execucao: Number(runningSchedules.rows[0]?.total || 0),
    ai: {
      activeKeys: Number(activeKeys.rows[0]?.total || 0),
      requestsToday: Number(usageRow.requests_today || 0),
      poolRequestsToday: Number(usageRow.global_pool_requests_today || 0),
      globalRequestsToday: Number(usageRow.global_pool_requests_today || 0),
      legacyGlobalRequestsToday: Number(usageRow.legacy_global_requests_today || 0),
      userRequestsToday: Number(usageRow.user_requests_today || 0),
      environmentRequestsToday: Number(usageRow.environment_requests_today || 0),
    },
  })
})

adminOpsRoutes.get('/admin/queue', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminOpsTables(db)
  const result = await db.query(
    `SELECT q.*, c.name as campaign_name
       FROM message_queue q
       LEFT JOIN campaigns c ON q.campaign_id = c.id
      ORDER BY q.data_criacao DESC
      LIMIT 100`
  )
  return c.json({ success: true, data: result.rows })
})
