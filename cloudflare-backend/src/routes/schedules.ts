import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'
import { isSchemaMissingError, runBestEffortDdl } from '../lib/ddl'
import { executeWhatsappCampaignDelivery, validateCampaignDeliveryPayload } from '../lib/campaignDelivery'
import { runSchemaBestEffort } from '../lib/runtimeSchema'
import { logger } from '../lib/logger'
import { buildContactSendHistoryEntry, insertContactSendHistory } from '../lib/sendHistory'
import { htmlToWhatsapp, resolveTemplate } from '../lib/messageUtils'

const ACTIVE_SCHEDULE_STATUSES = ['agendado', 'preparando', 'em_execucao', 'pausado']
const HISTORY_SCHEDULE_STATUSES = ['concluido', 'cancelado', 'erro']

function getAuthenticatedUserId(c: { get: (key: 'user') => { id?: string } | undefined }) {
  const user = c.get('user')
  return user?.id ?? null
}

function getSystemTimezone(env: Bindings) {
  return String(env.SYSTEM_TIMEZONE || 'America/Sao_Paulo').trim() || 'America/Sao_Paulo'
}

function getSystemTimezoneLabel(env: Bindings) {
  return String(env.SYSTEM_TIMEZONE_LABEL || 'GMT-3 (America/Sao_Paulo)').trim() || 'GMT-3 (America/Sao_Paulo)'
}

function formatInTimezone(date: Date, timezone: string, options: Intl.DateTimeFormatOptions) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour12: false,
    ...options,
  })
  return formatter.format(date)
}

function getSystemDateTimeParts(env: Bindings) {
  const timezone = getSystemTimezone(env)
  const now = new Date()
  const date = formatInTimezone(now, timezone, { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = formatInTimezone(now, timezone, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return {
    date,
    time,
    timeShort: time.slice(0, 5),
  }
}

function parseCampaignChannels(channels: unknown): string[] {
  if (Array.isArray(channels)) return channels.map((item) => String(item).trim().toLowerCase())
  if (typeof channels === 'string') {
    try {
      const parsed = JSON.parse(channels)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim().toLowerCase())
    } catch {
      return channels.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
    }
  }
  return []
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
    if (isSchemaMissingError(error)) {
      console.warn('[Schedules] Estrutura de permissao administrativa nao encontrada. Assumindo usuario nao-admin.')
      return false
    }
    throw error
  }
}

async function getServerClock(env: Bindings) {
  const timezone = getSystemTimezone(env)
  const now = new Date()
  return {
    server_time: now.toISOString(),
    server_date: formatInTimezone(now, timezone, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    server_time_only: formatInTimezone(now, timezone, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timezone: getSystemTimezoneLabel(env),
  }
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

async function ensureScheduleTables(db: ReturnType<typeof getDb>) {
  await runBestEffortDdl(db, 'schedules.ensureScheduleTables', [
    `
      CREATE TABLE IF NOT EXISTS public.campaign_schedule (
        id SERIAL PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
      CREATE TABLE IF NOT EXISTS public.message_queue (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES public.campaign_schedule(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
      CREATE TABLE IF NOT EXISTS public.scheduler_logs (
        id SERIAL PRIMARY KEY,
        event TEXT NOT NULL,
        details TEXT,
        data_evento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS scheduler_claimed_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS pause_reason TEXT`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS pause_details TEXT`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS contact_id TEXT`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS erro TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_mq_user_status ON public.message_queue(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_mq_schedule_status ON public.message_queue(schedule_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_schedule_user_status ON public.campaign_schedule(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduler_logs_event_date ON public.scheduler_logs(event, data_evento DESC)`,
    `ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS last_scheduled_at TIMESTAMP WITH TIME ZONE`,
  ])
}

async function writeSchedulerLog(db: ReturnType<typeof getDb>, event: string, details: Record<string, unknown>) {
  await db.query('INSERT INTO public.scheduler_logs (event, details) VALUES ($1, $2)', [
    event,
    JSON.stringify(details),
  ])
}

async function setCampaignStatusFromQueue(db: ReturnType<typeof getDb>, campaignId: string) {
  const summaryResult = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'pendente')::int AS pendente,
      COUNT(*) FILTER (WHERE status = 'processando')::int AS processando,
      COUNT(*) FILTER (WHERE status = 'enviado')::int AS enviado,
      COUNT(*) FILTER (WHERE status = 'falhou')::int AS falhou
     FROM public.message_queue
     WHERE campaign_id = $1`,
    [campaignId]
  )

  const summary = summaryResult.rows[0] || {}
  const pending = Number(summary.pendente || 0)
  const processing = Number(summary.processando || 0)
  const sent = Number(summary.enviado || 0)
  const failed = Number(summary.falhou || 0)

  let nextStatus = 'rascunho'
  if (pending > 0 || processing > 0) nextStatus = 'agendada'
  else if (failed > 0) nextStatus = sent > 0 ? 'enviada_com_erros' : 'rascunho'
  else if (sent > 0) nextStatus = 'enviada'

  await db.query('UPDATE public.campaigns SET status = $1 WHERE id = $2', [nextStatus, campaignId])
}

function renderQueuedMessage(campaignMessage: unknown, contact: Record<string, unknown>) {
  const resolved = resolveTemplate(String(campaignMessage || ''), contact)
  const parsed = htmlToWhatsapp(resolved)
  return parsed || String(resolved || '').trim()
}

async function prepareQueueForSchedule(
  db: ReturnType<typeof getDb>,
  schedule: any
) {
  const existing = await db.query('SELECT COUNT(*)::int AS total FROM public.message_queue WHERE schedule_id = $1', [schedule.id])
  if (Number(existing.rows[0]?.total || 0) > 0) return Number(existing.rows[0]?.total || 0)

  const campaignResult = await db.query(
    'SELECT id, user_id, name, list_name, message, channels, delivery_payload FROM public.campaigns WHERE id = $1 LIMIT 1',
    [schedule.campaign_id]
  )
  const campaign = campaignResult.rows[0]
  if (!campaign) throw new Error('Campanha do agendamento não encontrada.')

  const channels = parseCampaignChannels(campaign.channels)
  if (!channels.includes('whatsapp')) {
    throw new Error('Agendamento exige canal WhatsApp ativo na campanha.')
  }

  const payloadValidation = validateCampaignDeliveryPayload(campaign.delivery_payload, channels)
  if (payloadValidation.errors.length > 0) {
    throw new Error(payloadValidation.errors[0])
  }

  const listResult = await db.query(
    'SELECT id FROM public.lists WHERE user_id = $1 AND name = $2 LIMIT 1',
    [campaign.user_id, campaign.list_name]
  )
  const list = listResult.rows[0]
  if (!list) throw new Error('Lista vinculada à campanha não foi encontrada.')

  const contactsResult = await db.query(
    `SELECT id, name, phone, email, category, city, rating, address, cep
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2
        AND COALESCE(TRIM(phone), '') <> ''
      ORDER BY name ASC`,
    [campaign.user_id, list.id]
  )
  const contacts = contactsResult.rows
  if (!contacts.length) {
    throw new Error('Não há contatos com telefone válido para montar a fila.')
  }

  for (const contact of contacts) {
    const message = renderQueuedMessage(campaign.message, contact)
    await db.query(
      `INSERT INTO public.message_queue (
        schedule_id, campaign_id, user_id, contact_id, telefone, nome, mensagem, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pendente')`,
      [
        schedule.id,
        campaign.id,
        campaign.user_id,
        String(contact.id),
        String(contact.phone || ''),
        String(contact.name || ''),
        message,
      ]
    )
  }

  await db.query(
    `UPDATE public.campaigns
        SET status = 'agendada',
            last_scheduled_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [campaign.id]
  )

  return contacts.length
}

async function runScheduler(db: ReturnType<typeof getDb>, env: Bindings) {
  const nowParts = getSystemDateTimeParts(env)

  await db.query(
    `UPDATE public.campaign_schedule
        SET status = 'agendado',
            scheduler_claimed_at = NULL
      WHERE status = 'preparando'
        AND scheduler_claimed_at IS NOT NULL
        AND scheduler_claimed_at < NOW() - INTERVAL '2 minutes'`
  )

  const dueResult = await db.query(
    `SELECT *
       FROM public.campaign_schedule
      WHERE status = 'agendado'
        AND (
          data_inicio < $1::date
          OR (data_inicio = $1::date AND hora_inicio <= $2::time)
        )
      ORDER BY data_criacao ASC
      LIMIT 20`,
    [nowParts.date, `${nowParts.timeShort}:00`]
  )

  for (const schedule of dueResult.rows) {
    const claimed = await db.query(
      `UPDATE public.campaign_schedule
          SET status = 'preparando',
              scheduler_claimed_at = NOW(),
              pause_reason = NULL,
              pause_details = NULL
        WHERE id = $1
          AND status = 'agendado'
      RETURNING *`,
      [schedule.id]
    )
    if (!claimed.rows[0]) continue

    try {
      const count = await prepareQueueForSchedule(db, schedule)
      await db.query(
        `UPDATE public.campaign_schedule
            SET status = 'em_execucao',
                scheduler_claimed_at = NULL
          WHERE id = $1`,
        [schedule.id]
      )

      await writeSchedulerLog(db, 'schedule_started', {
        schedule_id: schedule.id,
        campaign_id: schedule.campaign_id,
        queued_contacts: count,
      })
    } catch (error) {
      const reason = String((error as any)?.message || error || 'Erro ao preparar fila')
      await db.query(
        `UPDATE public.campaign_schedule
            SET status = 'erro',
                pause_details = $1,
                scheduler_claimed_at = NULL
          WHERE id = $2`,
        [reason, schedule.id]
      )
      await setCampaignStatusFromQueue(db, schedule.campaign_id)
      await writeSchedulerLog(db, 'schedule_error', {
        schedule_id: schedule.id,
        campaign_id: schedule.campaign_id,
        motivo: reason,
      })
    }
  }
}

async function processQueueItem(db: ReturnType<typeof getDb>, queueItem: any) {
  const campaignResult = await db.query('SELECT * FROM public.campaigns WHERE id = $1 LIMIT 1', [queueItem.campaign_id])
  const campaign = campaignResult.rows[0]
  if (!campaign) throw new Error('Campanha não encontrada para item da fila.')

  const contactResult = await db.query(
    'SELECT * FROM public.contacts WHERE id::text = $1 AND user_id = $2 LIMIT 1',
    [String(queueItem.contact_id || ''), queueItem.user_id]
  )

  const contact =
    contactResult.rows[0] ||
    ({
      id: queueItem.contact_id,
      name: queueItem.nome || 'Contato',
      phone: queueItem.telefone || '',
      email: '',
      category: '',
      city: '',
      rating: '',
      address: '',
      cep: '',
    } as any)

  const evolution = await resolveEvolutionConfigForUser(queueItem.user_id, db)
  if (!evolution.evolutionUrl || !evolution.evolutionApiKey || !evolution.evolutionInstance) {
    throw new Error('Evolution API não configurada para este usuário.')
  }

  const deliveryResult = await executeWhatsappCampaignDelivery({
    evolutionUrl: evolution.evolutionUrl,
    evolutionApiKey: evolution.evolutionApiKey,
    evolutionInstance: evolution.evolutionInstance,
    campaign,
    contact,
    messageOverride: queueItem.mensagem,
  })

  const historyEntry = buildContactSendHistoryEntry({
    userId: queueItem.user_id,
    campaign,
    contact,
    channel: 'whatsapp',
    deliveryResult,
  })

  await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry)

  const queueStatus = historyEntry.ok ? 'enviado' : 'falhou'
  await db.query(
    `UPDATE public.message_queue
        SET status = $1,
            data_envio = NOW(),
            erro = $2
      WHERE id = $3`,
    [queueStatus, historyEntry.errorDetail, queueItem.id]
  )

  await writeSchedulerLog(db, queueStatus === 'enviado' ? 'queue_sent' : 'queue_failed', {
    schedule_id: queueItem.schedule_id,
    campaign_id: queueItem.campaign_id,
    message_id: queueItem.id,
    error: historyEntry.errorDetail,
  })
}

async function runWorker(db: ReturnType<typeof getDb>) {
  const claimed = await db.query(
    `UPDATE public.message_queue
        SET status = 'processando',
            processing_started_at = NOW(),
            tentativas = COALESCE(tentativas, 0) + 1
      WHERE id IN (
        SELECT mq.id
        FROM public.message_queue mq
        JOIN public.campaign_schedule cs ON cs.id = mq.schedule_id
        WHERE mq.status = 'pendente'
          AND cs.status IN ('preparando', 'em_execucao')
        ORDER BY mq.data_criacao ASC
        LIMIT 8
      )
    RETURNING *`
  )

  for (const queueItem of claimed.rows) {
    try {
      await processQueueItem(db, queueItem)
    } catch (error) {
      const reason = String((error as any)?.message || error || 'Erro ao enviar item da fila')

      await db.query(
        `UPDATE public.message_queue
            SET status = 'falhou',
                data_envio = NOW(),
                erro = $1
          WHERE id = $2`,
        [reason, queueItem.id]
      )

      const campaignResult = await db.query('SELECT * FROM public.campaigns WHERE id = $1 LIMIT 1', [queueItem.campaign_id])
      const campaign = campaignResult.rows[0] || { id: queueItem.campaign_id, name: 'Campanha' }
      const contact = {
        id: queueItem.contact_id,
        name: queueItem.nome || 'Contato',
        phone: queueItem.telefone || '',
      }
      const historyEntry = buildContactSendHistoryEntry({
        userId: queueItem.user_id,
        campaign,
        contact,
        channel: 'whatsapp',
        error: new Error(reason),
      })
      await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry)

      await writeSchedulerLog(db, 'queue_failed', {
        schedule_id: queueItem.schedule_id,
        campaign_id: queueItem.campaign_id,
        message_id: queueItem.id,
        error: reason,
      })
    }
  }
}

async function runCleanup(db: ReturnType<typeof getDb>) {
  const stale = await db.query(
    `UPDATE public.message_queue
        SET status = 'falhou',
            data_envio = NOW(),
            erro = COALESCE(erro, 'Timeout de processamento no worker')
      WHERE status = 'processando'
        AND processing_started_at IS NOT NULL
        AND processing_started_at < NOW() - INTERVAL '10 minutes'
    RETURNING id, schedule_id, campaign_id, erro`
  )

  for (const row of stale.rows) {
    await writeSchedulerLog(db, 'zombie_failed', {
      schedule_id: row.schedule_id,
      campaign_id: row.campaign_id,
      message_id: row.id,
      motivo: row.erro,
    })
  }
}

async function finalizeSchedules(db: ReturnType<typeof getDb>) {
  const schedules = await db.query(
    `SELECT id, campaign_id, status
       FROM public.campaign_schedule
      WHERE status IN ('preparando', 'em_execucao', 'agendado')`
  )

  for (const schedule of schedules.rows) {
    const summaryResult = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pendente')::int AS pending_count,
        COUNT(*) FILTER (WHERE status = 'processando')::int AS processing_count,
        COUNT(*) FILTER (WHERE status = 'enviado')::int AS sent_count,
        COUNT(*) FILTER (WHERE status = 'falhou')::int AS failed_count
       FROM public.message_queue
       WHERE schedule_id = $1`,
      [schedule.id]
    )

    const summary = summaryResult.rows[0] || {}
    const pending = Number(summary.pending_count || 0)
    const processing = Number(summary.processing_count || 0)
    const sent = Number(summary.sent_count || 0)
    const failed = Number(summary.failed_count || 0)

    let nextStatus: string | null = null
    if (pending > 0 || processing > 0) nextStatus = 'em_execucao'
    else if (sent > 0 && failed === 0) nextStatus = 'concluido'
    else if (sent > 0 || failed > 0) nextStatus = 'erro'

    if (nextStatus && nextStatus !== schedule.status) {
      await db.query(
        `UPDATE public.campaign_schedule
            SET status = $1,
                scheduler_claimed_at = NULL,
                pause_reason = CASE WHEN $1 IN ('concluido', 'erro') THEN pause_reason ELSE NULL END,
                pause_details = CASE WHEN $1 = 'erro' THEN COALESCE(pause_details, 'Envio concluído com falhas.') ELSE pause_details END
          WHERE id = $2`,
        [nextStatus, schedule.id]
      )
      await writeSchedulerLog(db, 'schedule_status_changed', {
        schedule_id: schedule.id,
        campaign_id: schedule.campaign_id,
        next_status: nextStatus,
      })
    }

    await setCampaignStatusFromQueue(db, schedule.campaign_id)
  }
}

async function runSchedulingCycle(db: ReturnType<typeof getDb>, env: Bindings) {
  await runScheduler(db, env)
  await runWorker(db)
  await runCleanup(db)
  await finalizeSchedules(db)
}

async function listSchedulesWithStats(
  db: ReturnType<typeof getDb>,
  statusFilter: string[],
  userId: string,
  admin: boolean,
  limit?: number,
  offset?: number
) {
  const params: unknown[] = [statusFilter]
  let whereClause = 'WHERE s.status = ANY($1)'
  if (!admin) {
    params.push(userId)
    whereClause += ` AND s.user_id = $${params.length}`
  }

  const limitClause = typeof limit === 'number' ? `LIMIT $${params.length + 1}` : ''
  const offsetClause = typeof offset === 'number' ? `OFFSET $${params.length + 2}` : ''
  
  const queryParams = [...params]
  if (typeof limit === 'number') queryParams.push(limit)
  if (typeof offset === 'number') queryParams.push(offset)

  return db.query(
    `SELECT
        s.*,
        c.name as campaign_name,
        COALESCE(q.pending_count, 0) AS pending_count,
        COALESCE(q.processing_count, 0) AS processing_count,
        COALESCE(q.sent_count, 0) AS sent_count,
        COALESCE(q.failed_count, 0) AS failed_count,
        q.last_error,
        q.last_queue_activity_at,
        NULL::text AS last_event,
        NULL::timestamp with time zone AS last_event_at
     FROM public.campaign_schedule s
     LEFT JOIN public.campaigns c ON s.campaign_id = c.id
     LEFT JOIN (
       SELECT
         mq.schedule_id,
         COUNT(*) FILTER (WHERE mq.status = 'pendente')::int AS pending_count,
         COUNT(*) FILTER (WHERE mq.status = 'processando')::int AS processing_count,
         COUNT(*) FILTER (WHERE mq.status = 'enviado')::int AS sent_count,
         COUNT(*) FILTER (WHERE mq.status = 'falhou')::int AS failed_count,
         MAX(COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao)) AS last_queue_activity_at,
         (ARRAY_REMOVE(ARRAY_AGG(mq.erro ORDER BY COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao) DESC), NULL))[1] AS last_error
       FROM public.message_queue mq
       GROUP BY mq.schedule_id
     ) q ON q.schedule_id = s.id
     ${whereClause}
     ORDER BY COALESCE(s.resumed_at, s.paused_at, s.data_criacao) DESC
     ${limitClause} ${offsetClause}`,
    queryParams
  )
}

export const scheduleRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

scheduleRoutes.post('/campaigns/:id/schedule', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureScheduleTables(db)

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const nowParts = getSystemDateTimeParts(c.env)

  const campaignResult = await db.query(
    'SELECT id, user_id, name, list_name, channels, delivery_payload FROM public.campaigns WHERE id = $1 LIMIT 1',
    [campaignId]
  )
  const campaign = campaignResult.rows[0]
  if (!campaign || campaign.user_id !== userId) {
    return c.json({ error: 'Campanha não encontrada para este usuário.' }, 404)
  }

  const channels = parseCampaignChannels(campaign.channels)
  if (!channels.includes('whatsapp')) {
    return c.json({ error: 'O agendamento profissional exige o canal WhatsApp ativo nesta campanha.' }, 400)
  }

  const payloadValidation = validateCampaignDeliveryPayload(campaign.delivery_payload, channels)
  if (payloadValidation.errors.length > 0) {
    return c.json({ error: payloadValidation.errors[0] }, 400)
  }

  const evolution = await resolveEvolutionConfigForUser(userId, db)
  if (!evolution.evolutionUrl || !evolution.evolutionApiKey || !evolution.evolutionInstance) {
    return c.json({
      error: 'A Evolution API não está configurada para este usuário. Ajuste em Meu perfil ou em Configurações globais antes de agendar.',
    }, 400)
  }

  const listResult = await db.query(
    'SELECT id FROM public.lists WHERE user_id = $1 AND name = $2 LIMIT 1',
    [userId, campaign.list_name]
  )
  const list = listResult.rows[0]
  if (!list) return c.json({ error: 'A lista vinculada a esta campanha não foi encontrada.' }, 400)

  const contactsCheck = await db.query(
    `SELECT COUNT(*)::int AS total
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2
        AND COALESCE(TRIM(phone), '') <> ''`,
    [userId, list.id]
  )
  if (!Number(contactsCheck.rows[0]?.total || 0)) {
    return c.json({
      error: 'Não há contatos ativos com telefone válido na lista desta campanha para agendar o envio.',
    }, 400)
  }

  const dataInicio = String(body.data_inicio || nowParts.date).slice(0, 10)
  const horaInicio = String(body.hora_inicio || nowParts.timeShort).slice(0, 5)
  const parsedDateTime = new Date(`${dataInicio}T${horaInicio}:00`)
  if (Number.isNaN(parsedDateTime.getTime())) {
    return c.json({ error: 'Data ou hora de início inválida.' }, 400)
  }

  const intervaloMinimo = Number(body.intervalo_minimo ?? 30)
  const intervaloMaximo = Number(body.intervalo_maximo ?? 90)
  const mensagensPorLote = Number(body.mensagens_por_lote ?? 45)
  const tempoPausaLote = Number(body.tempo_pausa_lote ?? 15)
  const limiteDiario = Number(body.limite_diario ?? 300)

  if (intervaloMinimo <= 0 || intervaloMaximo <= 0) {
    return c.json({ error: 'Os intervalos mínimo e máximo devem ser maiores que zero.' }, 400)
  }
  if (intervaloMinimo > intervaloMaximo) {
    return c.json({ error: 'O intervalo mínimo não pode ser maior que o máximo.' }, 400)
  }
  if (mensagensPorLote <= 0 || tempoPausaLote < 0 || limiteDiario <= 0) {
    return c.json({ error: 'Revise lote, pausa e limite diário antes de agendar.' }, 400)
  }

  await db.query(
    `UPDATE public.campaign_schedule
        SET status = 'cancelado',
            pause_reason = 'manual_cancel',
            pause_details = 'Agendamento substituído por um novo agendamento.',
            paused_at = COALESCE(paused_at, NOW())
      WHERE campaign_id = $1
        AND status = ANY($2)`,
    [campaignId, ACTIVE_SCHEDULE_STATUSES]
  )
  await db.query('DELETE FROM public.message_queue WHERE campaign_id = $1 AND status = $2', [campaignId, 'pendente'])

  const inserted = await db.query(
    `INSERT INTO public.campaign_schedule (
      campaign_id, user_id, data_inicio, hora_inicio, limite_diario,
      intervalo_minimo, intervalo_maximo, mensagens_por_lote, tempo_pausa_lote
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      campaignId,
      userId,
      dataInicio,
      `${horaInicio}:00`,
      limiteDiario,
      intervaloMinimo,
      intervaloMaximo,
      mensagensPorLote,
      tempoPausaLote,
    ]
  )

  await db.query(
    `UPDATE public.campaigns
        SET status = 'agendada',
            last_scheduled_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [campaignId]
  )

  await writeSchedulerLog(db, 'schedule_created', {
    schedule_id: inserted.rows[0]?.id,
    campaign_id: campaignId,
    user_id: userId,
  })

  return c.json(inserted.rows[0], 201)
})

scheduleRoutes.delete('/campaigns/:id/schedule', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ success: false, error: 'Acesso negado.' }, 401)
  const campaignId = c.req.param('id')
  const db = getDb(c.env)
  await ensureScheduleTables(db)

  const campaignResult = await db.query('SELECT id, user_id FROM public.campaigns WHERE id = $1 LIMIT 1', [campaignId])
  const campaign = campaignResult.rows[0]
  if (!campaign || campaign.user_id !== userId) {
    return c.json({ success: false, error: 'Campanha não encontrada para este usuário.' }, 404)
  }

  await db.query('DELETE FROM public.message_queue WHERE campaign_id = $1 AND status = $2', [campaignId, 'pendente'])
  await db.query(
    `UPDATE public.message_queue
        SET status = 'falhou',
            erro = 'Envio cancelado pelo usuário antes da conclusão.',
            processing_started_at = NULL,
            data_envio = NOW()
      WHERE campaign_id = $1
        AND status = 'processando'`,
    [campaignId]
  )
  await db.query(
    `UPDATE public.campaign_schedule
        SET status = 'cancelado',
            pause_reason = 'manual_cancel',
            pause_details = 'Agendamento cancelado manualmente pelo usuário.',
            paused_at = COALESCE(paused_at, NOW())
      WHERE campaign_id = $1
        AND status = ANY($2)`,
    [campaignId, ACTIVE_SCHEDULE_STATUSES]
  )

  await setCampaignStatusFromQueue(db, campaignId)
  await writeSchedulerLog(db, 'schedule_cancelled', {
    campaign_id: campaignId,
    user_id: userId,
  })

  return c.json({ success: true })
})

scheduleRoutes.get('/schedules/professional', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ success: false, error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureScheduleTables(db)

  try {
    await runSchedulingCycle(db, c.env)
  } catch (error) {
    console.error('[CloudflareSchedules] ciclo automático falhou:', error)
  }

  const admin = await isAdminUser(userId, db)
  
  // Paginação
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.max(1, Math.min(200, Number(c.req.query('limit') || 50)))
  const offset = (page - 1) * limit

  const result = await listSchedulesWithStats(db, ACTIVE_SCHEDULE_STATUSES, userId, admin, limit, offset)
  const server = await getServerClock(c.env)
  return c.json({ 
    success: true, 
    data: result.rows, 
    server,
    meta: { page, limit } 
  })
})

scheduleRoutes.post('/schedules/professional/refresh', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ success: false, error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureScheduleTables(db)

  await runSchedulingCycle(db, c.env)
  const server = await getServerClock(c.env)
  return c.json({ success: true, server })
})

scheduleRoutes.get('/schedules/history', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ success: false, error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureScheduleTables(db)

  const requestedStatus = String(c.req.query('status') || 'all').trim().toLowerCase()
  const filteredStatuses =
    requestedStatus === 'all'
      ? HISTORY_SCHEDULE_STATUSES
      : HISTORY_SCHEDULE_STATUSES.filter((status) => status === requestedStatus)

  if (filteredStatuses.length === 0) {
    return c.json({ success: false, error: 'Filtro de histórico inválido.' }, 400)
  }

  const admin = await isAdminUser(userId, db)
  
  // Paginação
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.max(1, Math.min(200, Number(c.req.query('limit') || 50)))
  const offset = (page - 1) * limit

  const result = await listSchedulesWithStats(db, filteredStatuses, userId, admin, limit, offset)
  const server = await getServerClock(c.env)
  
  logger.info(c.env, 'Histórico de agendamentos carregado', { userId, page, limit })

  return c.json({ 
    success: true, 
    data: result.rows, 
    server,
    meta: { page, limit }
  })
})

scheduleRoutes.get('/queue/professional', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ success: false, error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureScheduleTables(db)

  const admin = await isAdminUser(userId, db)
  
  // Paginação
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.max(1, Math.min(200, Number(c.req.query('limit') || 50)))
  const offset = (page - 1) * limit

  const params: unknown[] = []
  let whereClause = ''
  if (!admin) {
    params.push(userId)
    whereClause = `WHERE q.user_id = $${params.length}`
  }

  const queueResult = await db.query(
    `SELECT
        q.id,
        q.schedule_id,
        q.campaign_id,
        q.user_id,
        q.contact_id,
        q.telefone,
        q.nome,
        q.status,
        q.tentativas,
        q.data_criacao,
        q.data_envio,
        q.processing_started_at,
        q.recovered_at,
        q.erro,
        c.name as campaign_name
       FROM public.message_queue q
       LEFT JOIN public.campaigns c ON q.campaign_id = c.id
       ${whereClause}
       ORDER BY q.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  const server = await getServerClock(c.env)
  return c.json({ 
    success: true, 
    data: queueResult.rows, 
    server,
    meta: { page, limit }
  })
})
