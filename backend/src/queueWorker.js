import 'dotenv/config'
import { query } from './db.js'
import { executeWhatsappCampaignDelivery } from './services/campaignDeliveryService.js'

process.env.TZ = process.env.SYSTEM_TIMEZONE || process.env.TZ || 'America/Sao_Paulo'

const queueWorkerDeps = {
  query,
  fetchImpl: (...args) => globalThis.fetch(...args),
  sleepImpl: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

export function setQueueWorkerDepsForTests(overrides = {}) {
  Object.assign(queueWorkerDeps, overrides)
}

export function resetQueueWorkerDepsForTests() {
  queueWorkerDeps.query = query
  queueWorkerDeps.fetchImpl = (...args) => globalThis.fetch(...args)
  queueWorkerDeps.sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}

function sleep(ms) {
  return queueWorkerDeps.sleepImpl(ms)
}

function normalizeReputationLevel(level) {
  const raw = String(level || '').toUpperCase()
  if (raw.includes('AQUE')) return 'AQUECENDO'
  if (raw.includes('ALER')) return 'ALERTA'
  if (raw.includes('CR')) return 'CRITICO'
  return 'NOVO'
}

function getEffectiveDailyLimit(reputationLevel, configuredLimit) {
  const normalizedLevel = normalizeReputationLevel(reputationLevel)
  let effectiveLimit = Number(configuredLimit || 300)
  if (normalizedLevel === 'NOVO') effectiveLimit = Math.min(effectiveLimit, 40)
  if (normalizedLevel === 'AQUECENDO') effectiveLimit = Math.min(effectiveLimit, 100)
  if (normalizedLevel === 'ALERTA') effectiveLimit = Math.min(effectiveLimit, 20)
  return effectiveLimit
}

function parseCampaignChannels(channels) {
  if (Array.isArray(channels)) return channels
  if (typeof channels === 'string') {
    try {
      const parsed = JSON.parse(channels)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function parseVariations(variations) {
  if (Array.isArray(variations)) return variations
  if (typeof variations === 'string') {
    try {
      const parsed = JSON.parse(variations)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

async function resolveEvolutionConfigForUser(userId) {
  const [profileResult, globalSettingsResult] = await Promise.all([
    queueWorkerDeps.query(
      'SELECT evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1 LIMIT 1',
      [userId]
    ),
    queueWorkerDeps.query(
      'SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM app_settings ORDER BY id DESC LIMIT 1'
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

async function pauseSchedulesForUser(userId, reason, details) {
  const result = await queueWorkerDeps.query(
    `UPDATE campaign_schedule
     SET status = 'pausado',
         pause_reason = $1,
         pause_details = $2,
         paused_at = NOW()
     WHERE user_id = $3
       AND status = 'em_execucao'
     RETURNING id, campaign_id`,
    [reason, details, userId]
  )

  for (const item of result.rows) {
    await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
      'schedule_paused',
      JSON.stringify({
        schedule_id: item.id,
        campaign_id: item.campaign_id,
        user_id: userId,
        pause_reason: reason,
        pause_details: details,
      }),
    ])
  }

  return result.rows
}

async function resumeSchedule(scheduleId, campaignId, reason) {
  await queueWorkerDeps.query(
    `UPDATE campaign_schedule
     SET status = 'em_execucao',
         pause_reason = NULL,
         pause_details = NULL,
         resumed_at = NOW(),
         scheduler_claimed_at = NULL
     WHERE id = $1`,
    [scheduleId]
  )

  await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
    'schedule_resumed',
    JSON.stringify({
      schedule_id: scheduleId,
      campaign_id: campaignId,
      resume_reason: reason,
    }),
  ])
}

async function markScheduleError(scheduleId, campaignId, reason) {
  await queueWorkerDeps.query(
    `UPDATE campaign_schedule
     SET status = 'erro',
         pause_details = $1,
         scheduler_claimed_at = NULL
     WHERE id = $2`,
    [reason, scheduleId]
  )

  if (campaignId) {
    await queueWorkerDeps.query('UPDATE campaigns SET status = $1 WHERE id = $2', ['rascunho', campaignId])
  }

  await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
    'schedule_error',
    JSON.stringify({
      schedule_id: scheduleId,
      campaign_id: campaignId,
      motivo: reason,
    }),
  ])
}

async function recoverStuckPreparingSchedules() {
  const result = await queueWorkerDeps.query(
    `SELECT cs.id, cs.campaign_id,
            EXISTS (
              SELECT 1
              FROM message_queue mq
              WHERE mq.schedule_id = cs.id
            ) AS has_queue
     FROM campaign_schedule cs
     WHERE cs.status = 'preparando'
       AND cs.scheduler_claimed_at IS NOT NULL
       AND cs.scheduler_claimed_at < NOW() - INTERVAL '30 seconds'`
  )

  for (const item of result.rows) {
    if (item.has_queue) {
      await queueWorkerDeps.query(
        `UPDATE campaign_schedule
         SET status = 'em_execucao',
             scheduler_claimed_at = NULL
         WHERE id = $1`,
        [item.id]
      )
      continue
    }

    await queueWorkerDeps.query(
      `UPDATE campaign_schedule
       SET status = 'agendado',
           scheduler_claimed_at = NULL
       WHERE id = $1`,
      [item.id]
    )

    await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
      'schedule_requeued',
      JSON.stringify({
        schedule_id: item.id,
        campaign_id: item.campaign_id,
        motivo: 'Agendamento ficou preso em preparando sem fila e voltou para agendado.',
      }),
    ])
  }
}

async function setCampaignStatusFromQueue(campaignId) {
  const summaryResult = await queueWorkerDeps.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pendente')::int AS pendente,
       COUNT(*) FILTER (WHERE status = 'processando')::int AS processando,
       COUNT(*) FILTER (WHERE status = 'enviado')::int AS enviado,
       COUNT(*) FILTER (WHERE status = 'falhou')::int AS falhou
     FROM message_queue
     WHERE campaign_id = $1`,
    [campaignId]
  )

  const summary = summaryResult.rows[0] || {}
  const pending = Number(summary.pendente || 0)
  const processing = Number(summary.processando || 0)
  const sent = Number(summary.enviado || 0)
  const failed = Number(summary.falhou || 0)

  let nextStatus = 'rascunho'
  if (pending > 0 || processing > 0) {
    nextStatus = 'agendada'
  } else if (failed > 0) {
    nextStatus = 'enviada_com_erros'
  } else if (sent > 0) {
    nextStatus = 'enviada'
  }

  await queueWorkerDeps.query('UPDATE campaigns SET status = $1 WHERE id = $2', [nextStatus, campaignId])
}

async function finalizeCompletedSchedules() {
  const completedResult = await queueWorkerDeps.query(
    `SELECT cs.id, cs.campaign_id
     FROM campaign_schedule cs
     WHERE cs.status = 'em_execucao'
       AND EXISTS (
         SELECT 1
         FROM message_queue mq_exists
         WHERE mq_exists.schedule_id = cs.id
       )
       AND NOT EXISTS (
         SELECT 1
         FROM message_queue mq
         WHERE mq.schedule_id = cs.id
           AND mq.status IN ('pendente', 'processando')
       )`
  )

  for (const schedule of completedResult.rows) {
    await queueWorkerDeps.query('UPDATE campaign_schedule SET status = $1 WHERE id = $2', ['concluido', schedule.id])
    await setCampaignStatusFromQueue(schedule.campaign_id)
  }
}

async function resumePausedSchedules() {
  const pausedResult = await queueWorkerDeps.query(
    `SELECT cs.id, cs.campaign_id, cs.user_id, cs.limite_diario,
            cs.pause_reason, cs.pause_details, cs.paused_at,
            COALESCE(wr.level, 'NOVO') AS reputation_level
     FROM campaign_schedule cs
     LEFT JOIN whatsapp_reputation wr ON wr.user_id = cs.user_id
     WHERE cs.status = 'pausado'
       AND (cs.data_inicio < CURRENT_DATE OR (cs.data_inicio = CURRENT_DATE AND cs.hora_inicio <= CURRENT_TIME))
       AND EXISTS (
         SELECT 1
         FROM message_queue mq
         WHERE mq.schedule_id = cs.id
           AND mq.status = 'pendente'
       )`
  )

  for (const item of pausedResult.rows) {
    const reputationLevel = normalizeReputationLevel(item.reputation_level)

    if (item.pause_reason === 'reputation_critical' && reputationLevel === 'CRITICO') {
      continue
    }

    if (item.pause_reason === 'daily_limit' && item.paused_at) {
      const pausedDate = new Date(item.paused_at)
      const today = new Date()
      const isSameLocalDay =
        pausedDate.getFullYear() === today.getFullYear() &&
        pausedDate.getMonth() === today.getMonth() &&
        pausedDate.getDate() === today.getDate()

      if (isSameLocalDay) {
        continue
      }
    }

    if (!item.pause_reason && reputationLevel === 'CRITICO') {
      continue
    }

    const sentCountResult = await queueWorkerDeps.query(
      "SELECT COUNT(*)::int AS total FROM message_queue WHERE user_id = $1 AND status = 'enviado' AND data_envio >= CURRENT_DATE",
      [item.user_id]
    )
    const sentToday = Number(sentCountResult.rows[0]?.total || 0)
    const effectiveLimit = getEffectiveDailyLimit(reputationLevel, item.limite_diario)

    if (sentToday >= effectiveLimit) {
      continue
    }

    const resumeReason =
      item.pause_reason === 'daily_limit'
        ? 'daily_limit_window_reset'
        : item.pause_reason === 'reputation_critical'
          ? 'reputation_recovered'
          : 'automatic_resume'

    await resumeSchedule(item.id, item.campaign_id, resumeReason)
    console.log(`[Scheduler] Retomando agendamento pausado ${item.id} da campanha ${item.campaign_id}`)
  }
}

async function enqueueScheduleMessages(schedule, campaign) {
  const channels = parseCampaignChannels(campaign.channels)
  if (!channels.includes('whatsapp')) {
    await markScheduleError(schedule.id, campaign.id, 'Campanha sem canal WhatsApp para agendamento profissional')
    return
  }

  const queueExists = await queueWorkerDeps.query(
    'SELECT 1 FROM message_queue WHERE schedule_id = $1 LIMIT 1',
    [schedule.id]
  )

  if (queueExists.rows.length > 0) {
    await queueWorkerDeps.query(
      `UPDATE campaign_schedule
       SET status = $1,
           pause_reason = NULL,
           pause_details = NULL,
           scheduler_claimed_at = NULL
       WHERE id = $2`,
      ['em_execucao', schedule.id]
    )
    return
  }

  const variations = parseVariations(campaign.variations)
  const variationsList = [campaign.message, ...variations].filter((t) => t && String(t).trim().length > 5)

  const listResult = await queueWorkerDeps.query(
    'SELECT id FROM lists WHERE user_id = $1 AND name = $2 LIMIT 1',
    [schedule.user_id, campaign.list_name]
  )
  const list = listResult.rows[0]

  if (!list) {
    console.log(`[Scheduler] Lista nÃƒÂ£o encontrada para a campanha ${campaign.id}: ${campaign.list_name}.`)
    await markScheduleError(schedule.id, campaign.id, 'Lista da campanha nÃƒÂ£o encontrada')
    return
  }

  const contactsResult = await queueWorkerDeps.query(
    `SELECT *
     FROM contacts
     WHERE user_id = $1
       AND list_id = $2
       AND COALESCE(TRIM(phone), '') <> ''`,
    [schedule.user_id, list.id]
  )
  const contacts = contactsResult.rows

  if (contacts.length === 0) {
    console.log(`[Scheduler] Nenhum contato elegÃƒÂ­vel encontrado para a lista ${campaign.list_name}.`)
    await markScheduleError(schedule.id, campaign.id, 'Nenhum contato ativo com telefone vÃƒÂ¡lido')
    return
  }

  console.log(`[Scheduler] Gerando fila para ${contacts.length} contatos na campanha ${campaign.id}.`)

  for (const contact of contacts) {
    const baseMessage = variationsList[Math.floor(Math.random() * variationsList.length)] || campaign.message || ''
      await queueWorkerDeps.query(
        `INSERT INTO message_queue (schedule_id, campaign_id, user_id, contact_id, telefone, nome, mensagem)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          schedule.id,
          schedule.campaign_id,
          schedule.user_id,
          contact.id == null ? null : String(contact.id),
          contact.phone,
          contact.name,
          baseMessage,
        ]
      )
  }

  await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
    'queue_created',
    JSON.stringify({
      schedule_id: schedule.id,
      campaign_id: schedule.campaign_id,
      total_contatos: contacts.length,
    }),
  ])

  await queueWorkerDeps.query(
    `UPDATE campaign_schedule
     SET status = $1,
         pause_reason = NULL,
         pause_details = NULL,
         scheduler_claimed_at = NULL
     WHERE id = $2`,
    ['em_execucao', schedule.id]
  )
}

/**
 * SCHEDULER: Transforma agendamentos em fila de mensagens.
 * Roda periodicamente para verificar o que precisa entrar na fila.
 */
export async function runScheduler() {
  try {
    await recoverStuckPreparingSchedules()
    await resumePausedSchedules()

    const result = await queueWorkerDeps.query(
      `WITH due_schedules AS (
         SELECT id
         FROM campaign_schedule
         WHERE status = 'agendado'
           AND (data_inicio < CURRENT_DATE OR (data_inicio = CURRENT_DATE AND hora_inicio <= CURRENT_TIME))
         ORDER BY data_inicio ASC, hora_inicio ASC, id ASC
         FOR UPDATE SKIP LOCKED
       )
       UPDATE campaign_schedule cs
       SET status = 'preparando',
           scheduler_claimed_at = NOW()
       FROM due_schedules ds
       WHERE cs.id = ds.id
       RETURNING cs.*`
    )

    for (const schedule of result.rows) {
      console.log(`[Scheduler] Processando agendamento ${schedule.id} para campanha ${schedule.campaign_id}`)

      try {
        const campResult = await queueWorkerDeps.query('SELECT * FROM campaigns WHERE id = $1', [schedule.campaign_id])
        const campaign = campResult.rows[0]

        if (!campaign) {
          await markScheduleError(schedule.id, schedule.campaign_id, 'Campanha nÃƒÂ£o encontrada para montar a fila.')
          continue
        }

        await enqueueScheduleMessages(schedule, campaign)
      } catch (error) {
        console.error(`[Scheduler] Falha ao montar fila do agendamento ${schedule.id}:`, error)
        await markScheduleError(
          schedule.id,
          schedule.campaign_id,
          `Falha ao montar a fila do agendamento: ${error?.message || 'erro desconhecido'}`
        )
      }
    }

    await finalizeCompletedSchedules()
  } catch (error) {
    console.error('[Scheduler] Erro no processamento:', error)
  }
}

let isWorkerRunning = false

export function resetQueueWorkerRuntimeForTests() {
  isWorkerRunning = false
}

export async function runWorker() {
  if (isWorkerRunning) return
  isWorkerRunning = true

  try {
    const msgResult = await queueWorkerDeps.query(
      `UPDATE message_queue mq
       SET status = 'processando', processing_started_at = NOW()
       WHERE mq.id = (
         SELECT mq2.id
         FROM message_queue mq2
         JOIN campaign_schedule cs ON cs.id = mq2.schedule_id
         WHERE mq2.status = 'pendente'
           AND cs.status = 'em_execucao'
         ORDER BY mq2.data_criacao ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING mq.*`
    )

    if (msgResult.rows.length === 0) {
      await finalizeCompletedSchedules()
      isWorkerRunning = false
      return
    }

    const msg = msgResult.rows[0]

    const configResult = await queueWorkerDeps.query(
      'SELECT * FROM campaign_schedule WHERE id = $1 LIMIT 1',
      [msg.schedule_id]
    )
    const config = configResult.rows[0]

    if (!config || config.status !== 'em_execucao') {
      await queueWorkerDeps.query(
        'UPDATE message_queue SET status = $1, erro = $2, processing_started_at = NULL WHERE id = $3',
        ['pendente', 'Agendamento n?o est? em execu??o no momento.', msg.id]
      )
      isWorkerRunning = false
      return
    }

    const reputationResult = await queueWorkerDeps.query('SELECT * FROM whatsapp_reputation WHERE user_id = $1', [msg.user_id])
    let reputation = reputationResult.rows[0]

    if (!reputation) {
      const newRep = await queueWorkerDeps.query(
        'INSERT INTO whatsapp_reputation (user_id) VALUES ($1) RETURNING *',
        [msg.user_id]
      )
      reputation = newRep.rows[0]
    }

    const reputationLevel = normalizeReputationLevel(reputation.level)

    if (reputationLevel === 'CRITICO') {
      await pauseSchedulesForUser(
        msg.user_id,
        'reputation_critical',
        'A reputa??o do n?mero entrou em n?vel cr?tico. O envio fica pausado at? a reputa??o melhorar.'
      )
      await queueWorkerDeps.query(
        'UPDATE message_queue SET status = $1, erro = $2, processing_started_at = NULL WHERE id = $3',
        ['pendente', 'Envio pausado por reputa??o cr?tica do n?mero.', msg.id]
      )
      isWorkerRunning = false
      return
    }

    const sentCountResult = await queueWorkerDeps.query(
      "SELECT count(*) FROM message_queue WHERE user_id = $1 AND status = 'enviado' AND data_envio >= CURRENT_DATE",
      [msg.user_id]
    )
    const sentTodayOverall = parseInt(sentCountResult.rows[0].count)

    const effectiveLimit = getEffectiveDailyLimit(reputationLevel, config.limite_diario)

    if (sentTodayOverall >= effectiveLimit) {
      console.log(`[Worker] Limite operacional (${effectiveLimit}) atingido para ${msg.user_id}. Pausando.`)
      await pauseSchedulesForUser(
        msg.user_id,
        'daily_limit',
        `O limite di?rio operacional de ${effectiveLimit} envios foi atingido. O agendamento ser? retomado automaticamente quando voltar a ficar eleg?vel.`
      )
      await queueWorkerDeps.query(
        'UPDATE message_queue SET status = $1, erro = $2, processing_started_at = NULL WHERE id = $3',
        ['pendente', `Limite di?rio operacional atingido (${effectiveLimit}/dia).`, msg.id]
      )
      isWorkerRunning = false
      return
    }

    if (sentTodayOverall > 0 && sentTodayOverall % Number(config.mensagens_por_lote || 45) === 0) {
      console.log(`[Worker] Lote de ${config.mensagens_por_lote} atingido. Pausando por ${config.tempo_pausa_lote} minutos.`)
      await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
        'pausa_lote',
        JSON.stringify({ user_id: msg.user_id, schedule_id: msg.schedule_id, campaign_id: msg.campaign_id }),
      ])
      await sleep(Number(config.tempo_pausa_lote || 15) * 60 * 1000)
    }

    const freshConfigResult = await queueWorkerDeps.query(
      'SELECT status FROM campaign_schedule WHERE id = $1 LIMIT 1',
      [msg.schedule_id]
    )
    const freshConfig = freshConfigResult.rows[0]

    if (!freshConfig || freshConfig.status !== 'em_execucao') {
      await queueWorkerDeps.query(
        'UPDATE message_queue SET status = $1, erro = $2, processing_started_at = NULL WHERE id = $3',
        ['falhou', 'Envio interrompido porque o agendamento n?o est? mais ativo.', msg.id]
      )
      isWorkerRunning = false
      return
    }

    const evolutionConfig = await resolveEvolutionConfigForUser(msg.user_id)
    const { evolutionUrl, evolutionApiKey, evolutionInstance } = evolutionConfig

    if (evolutionUrl && evolutionInstance && evolutionApiKey) {
      try {
        const campaignResult = await queueWorkerDeps.query('SELECT * FROM campaigns WHERE id = $1 LIMIT 1', [msg.campaign_id])
        const campaign = campaignResult.rows[0]

        if (!campaign) {
          throw new Error('Campanha do item de fila n?o foi encontrada.')
        }

        const deliveryResult = await executeWhatsappCampaignDelivery({
          fetchImpl: queueWorkerDeps.fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          campaign,
          contact: {
            id: msg.contact_id,
            name: msg.nome,
            phone: msg.telefone,
          },
          messageOverride: msg.mensagem,
        })

        await queueWorkerDeps.query(
          'UPDATE message_queue SET status = $1, data_envio = NOW(), processing_started_at = NULL, erro = $2 WHERE id = $3',
          [
            'enviado',
            deliveryResult.errors.length > 0 ? deliveryResult.errors.join(' | ') : null,
            msg.id,
          ]
        )
      } catch (err) {
        console.error(`[Worker] Erro no envio (${msg.telefone}):`, err.message)
        await queueWorkerDeps.query(
          'UPDATE message_queue SET status = $1, erro = $2, tentativas = tentativas + 1, processing_started_at = NULL WHERE id = $3',
          ['falhou', err.message, msg.id]
        )
      }
    } else {
      await queueWorkerDeps.query(
        'UPDATE message_queue SET status = $1, erro = $2, processing_started_at = NULL WHERE id = $3',
        ['falhou', 'Evolution API n?o configurada para este perfil.', msg.id]
      )
    }

    let minDelay = Number(config.intervalo_minimo || 30)
    let maxDelay = Number(config.intervalo_maximo || 90)

    if (reputationLevel === 'NOVO') {
      minDelay = Math.ceil(minDelay * 1.5)
      maxDelay = Math.ceil(maxDelay * 1.5)
    }
    if (reputationLevel === 'ALERTA') {
      minDelay = minDelay * 3
      maxDelay = maxDelay * 3
    }

    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
    await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
      'envio_sucesso',
      JSON.stringify({ telefone: msg.telefone, delay, reputacao: reputationLevel, message_id: msg.id }),
    ])

    setTimeout(() => {
      isWorkerRunning = false
    }, delay * 1000)
  } catch (error) {
    console.error('[Worker] Erro cr?tico no worker:', error)
    isWorkerRunning = false
  }
}

export async function runCleanup() {
  try {
    const MAX_TRIES = 3

    const recoveryRes = await queueWorkerDeps.query(
      `UPDATE message_queue
       SET status = 'pendente',
           tentativas = tentativas + 1,
           erro = 'Recuperado automaticamente: timeout de processamento',
           recovered_at = NOW(),
           processing_started_at = NULL
       WHERE status = 'processando'
         AND processing_started_at < NOW() - INTERVAL '10 minutes'
         AND tentativas < $1
       RETURNING id, schedule_id, user_id, tentativas`,
      [MAX_TRIES]
    )

    for (const msg of recoveryRes.rows) {
      console.log(`[Cleanup] Mensagem ${msg.id} recuperada para pendente.`)
      await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
        'zombie_recovered',
        JSON.stringify({
          message_id: msg.id,
          schedule_id: msg.schedule_id,
          user_id: msg.user_id,
          motivo: 'Timeout de processamento (>10 min)',
          tentativa_final: msg.tentativas,
          timestamp: new Date().toISOString(),
        }),
      ])
    }

    const failRes = await queueWorkerDeps.query(
      `UPDATE message_queue
       SET status = 'falhou',
           erro = 'Falha definitiva: timeout de processamento excedido',
           data_envio = NOW(),
           processing_started_at = NULL
       WHERE status = 'processando'
         AND processing_started_at < NOW() - INTERVAL '10 minutes'
         AND tentativas >= $1
       RETURNING id, schedule_id, user_id, tentativas, campaign_id`,
      [MAX_TRIES]
    )

    for (const msg of failRes.rows) {
      console.log(`[Cleanup] Mensagem ${msg.id} marcada como falha definitiva.`)
      await queueWorkerDeps.query('INSERT INTO scheduler_logs (event, details) VALUES ($1, $2)', [
        'zombie_failed',
        JSON.stringify({
          message_id: msg.id,
          schedule_id: msg.schedule_id,
          user_id: msg.user_id,
          motivo: 'Limite de tentativas excedido por timeout',
          tentativa_final: msg.tentativas,
          timestamp: new Date().toISOString(),
        }),
      ])
      await setCampaignStatusFromQueue(msg.campaign_id)
    }

    await finalizeCompletedSchedules()
  } catch (error) {
    console.error('[Cleanup] Erro na rotina de recuperaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o:', error)
  }
}

export function startQueueWorkerLoops() {
  setInterval(runScheduler, 15_000)
  setInterval(runWorker, 2000)
  setInterval(runCleanup, 300_000)

  void runScheduler()
  void runWorker()
  void runCleanup()

  console.log('================================================')
  console.log('MOTOR DE ENVIO (QUEUE + WORKER) ATIVO')
  console.log('ProteÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o anti-bloqueio: habilitada')
  console.log('GestÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o de filas: habilitada')
  console.log('================================================')
}

if (process.env.DISABLE_QUEUE_WORKER_LOOPS !== 'true') {
  startQueueWorkerLoops()
}
