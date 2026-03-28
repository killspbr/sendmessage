import { query } from '../db.js'
import { toEvolutionNumber } from '../utils/messageUtils.js'

const DEFAULT_DELAY_SECONDS = 5
const DEFAULT_MESSAGES_PER_RUN = 4
const MAX_MESSAGES_PER_RUN = 20
const ACTIVE_RUNS = new Set()

const LAB_TEXT_MESSAGES = [
  'Bom dia. Teste técnico de conectividade entre instâncias.',
  'Tudo certo por aí? Rodando validação de entrega agora.',
  'Mensagem de teste enviada para validar latência e entrega.',
  'Confirmando recepção do payload de texto nesta rodada.',
  'Seguimos na validação técnica do laboratório de instâncias.',
  'Teste rápido: conferindo estabilidade da Evolution API.',
]

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeTrim(value) {
  return String(value || '').trim()
}

function pickTextMessage(index) {
  return LAB_TEXT_MESSAGES[index % LAB_TEXT_MESSAGES.length]
}

function inferFileNameFromUrl(url, fallback) {
  try {
    const parsed = new URL(String(url || '').trim())
    const pathname = parsed.pathname || ''
    const lastSegment = decodeURIComponent(pathname.split('/').pop() || '')
    return safeTrim(lastSegment) || fallback
  } catch {
    return fallback
  }
}

function inferMimeTypeFromUrl(url, type) {
  const lower = String(url || '').toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint'
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.mp4')) return 'video/mp4'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (type === 'audio') return 'audio/mpeg'
  if (type === 'document') return 'application/octet-stream'
  return 'image/jpeg'
}

async function ensureLabSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS warmer_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
      initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
      steps_total INTEGER NOT NULL DEFAULT 1,
      steps_completed INTEGER NOT NULL DEFAULT 0,
      step_delay_seconds INTEGER NOT NULL DEFAULT 5,
      preferred_start_side TEXT CHECK (preferred_start_side IN ('a', 'b')),
      last_error TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      finished_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await query(`
    ALTER TABLE warmer_configs
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS default_delay_seconds INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS default_messages_per_run INTEGER DEFAULT 4,
      ADD COLUMN IF NOT EXISTS sample_image_url TEXT,
      ADD COLUMN IF NOT EXISTS sample_document_url TEXT,
      ADD COLUMN IF NOT EXISTS sample_audio_url TEXT,
      ADD COLUMN IF NOT EXISTS last_run_status TEXT,
      ADD COLUMN IF NOT EXISTS last_run_error TEXT,
      ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE
  `)

  await query(`
    ALTER TABLE warmer_logs
      ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES warmer_runs(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS from_instance TEXT,
      ADD COLUMN IF NOT EXISTS to_instance TEXT,
      ADD COLUMN IF NOT EXISTS payload_type TEXT,
      ADD COLUMN IF NOT EXISTS ok BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS provider_status INTEGER,
      ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
      ADD COLUMN IF NOT EXISTS error_detail TEXT
  `)

  await query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_warmer_created_at ON warmer_runs(warmer_id, created_at DESC)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_status_created_at ON warmer_runs(status, created_at DESC)`)
}

async function getGlobalEvolutionConfig() {
  const result = await query(
    'SELECT evolution_api_url, evolution_api_key FROM app_settings ORDER BY id DESC LIMIT 1'
  )

  const settings = result.rows[0] || {}
  return {
    url: safeTrim(settings.evolution_api_url),
    apiKey: safeTrim(settings.evolution_api_key),
  }
}

async function postEvolution(url, apiKey, body) {
  const startedAt = Date.now()
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify(body),
  })

  const responseTimeMs = Date.now() - startedAt
  const rawText = await response.text()

  if (!response.ok) {
    const error = new Error(rawText || `Erro HTTP ${response.status}`)
    error.status = response.status
    error.responseTimeMs = responseTimeMs
    throw error
  }

  return { status: response.status, responseTimeMs, rawText }
}

async function sendText({ evolutionUrl, apiKey, instanceName, toPhone, text }) {
  const number = toEvolutionNumber(toPhone)
  if (!number) {
    throw new Error('Telefone de destino inválido para o laboratório.')
  }

  return postEvolution(`${evolutionUrl}/message/sendText/${safeTrim(instanceName)}`, apiKey, {
    number,
    text,
    linkPreview: false,
  })
}

async function sendMedia({ evolutionUrl, apiKey, instanceName, toPhone, mediaUrl, mediaType, caption }) {
  const number = toEvolutionNumber(toPhone)
  if (!number) {
    throw new Error('Telefone de destino inválido para o laboratório.')
  }

  return postEvolution(`${evolutionUrl}/message/sendMedia/${safeTrim(instanceName)}`, apiKey, {
    number,
    mediatype: mediaType,
    mimetype: inferMimeTypeFromUrl(mediaUrl, mediaType),
    fileName: inferFileNameFromUrl(
      mediaUrl,
      mediaType === 'document' ? 'documento' : 'imagem'
    ),
    caption: safeTrim(caption),
    media: mediaUrl,
  })
}

async function sendAudio({ evolutionUrl, apiKey, instanceName, toPhone, audioUrl }) {
  const number = toEvolutionNumber(toPhone)
  if (!number) {
    throw new Error('Telefone de destino inválido para o laboratório.')
  }

  return postEvolution(`${evolutionUrl}/message/sendWhatsAppAudio/${safeTrim(instanceName)}`, apiKey, {
    number,
    audio: audioUrl,
  })
}

async function loadLabPair(pairId) {
  await ensureLabSchema()
  const result = await query('SELECT * FROM warmer_configs WHERE id = $1 LIMIT 1', [pairId])
  return result.rows[0] || null
}

function buildStepPayloads(pair) {
  const payloads = [{ type: 'text' }]

  if (safeTrim(pair.sample_image_url)) {
    payloads.push({ type: 'image', url: safeTrim(pair.sample_image_url) })
  }

  if (safeTrim(pair.sample_document_url)) {
    payloads.push({ type: 'document', url: safeTrim(pair.sample_document_url) })
  }

  if (safeTrim(pair.sample_audio_url)) {
    payloads.push({ type: 'audio', url: safeTrim(pair.sample_audio_url) })
  }

  return payloads
}

function resolveDirection(pair, preferredStartSide, stepIndex) {
  const startWithA = preferredStartSide
    ? preferredStartSide === 'a'
    : stepIndex % 2 === 0

  const useA = stepIndex % 2 === 0 ? startWithA : !startWithA

  if (useA) {
    return {
      side: 'a',
      fromInstance: pair.instance_a_id,
      toInstance: pair.instance_b_id,
      fromPhone: pair.phone_a,
      toPhone: pair.phone_b,
    }
  }

  return {
    side: 'b',
    fromInstance: pair.instance_b_id,
    toInstance: pair.instance_a_id,
    fromPhone: pair.phone_b,
    toPhone: pair.phone_a,
  }
}

async function createRunLog({
  runId,
  pairId,
  direction,
  payloadType,
  contentSummary,
  ok,
  providerStatus,
  responseTimeMs,
  errorDetail,
}) {
  await query(
    `INSERT INTO warmer_logs (
      warmer_id, run_id, from_phone, to_phone, from_instance, to_instance,
      message_type, payload_type, content_summary, ok, provider_status, response_time_ms, error_detail
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      pairId,
      runId,
      direction.fromPhone,
      direction.toPhone,
      direction.fromInstance,
      direction.toInstance,
      payloadType === 'audio' ? 'audio' : 'text',
      payloadType,
      contentSummary,
      ok,
      providerStatus || null,
      responseTimeMs || null,
      errorDetail || null,
    ]
  )
}

async function executeRunStep({ runId, pair, evolutionUrl, apiKey, stepIndex, stepsTotal, preferredStartSide }) {
  const payloads = buildStepPayloads(pair)
  const direction = resolveDirection(pair, preferredStartSide, stepIndex)
  const payload = payloads[stepIndex % payloads.length]
  const textContent = pickTextMessage(stepIndex)

  try {
    let responseMeta = null
    let contentSummary = ''

    if (payload.type === 'text') {
      contentSummary = textContent
      responseMeta = await sendText({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        text: textContent,
      })
    } else if (payload.type === 'audio') {
      contentSummary = `Audio de teste: ${inferFileNameFromUrl(payload.url, 'audio.mp3')}`
      responseMeta = await sendAudio({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        audioUrl: payload.url,
      })
    } else {
      contentSummary = `${payload.type === 'document' ? 'Documento' : 'Imagem'} de teste: ${inferFileNameFromUrl(payload.url, 'arquivo')}`
      responseMeta = await sendMedia({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        mediaUrl: payload.url,
        mediaType: payload.type,
        caption: payload.type === 'image' ? `Laboratório de instâncias ${stepIndex + 1}/${stepsTotal}` : '',
      })
    }

    await createRunLog({
      runId,
      pairId: pair.id,
      direction,
      payloadType: payload.type,
      contentSummary,
      ok: true,
      providerStatus: responseMeta.status,
      responseTimeMs: responseMeta.responseTimeMs,
    })
  } catch (error) {
    await createRunLog({
      runId,
      pairId: pair.id,
      direction,
      payloadType: payload.type,
      contentSummary: payload.type === 'text' ? textContent : `${payload.type} de teste`,
      ok: false,
      providerStatus: error?.status || null,
      responseTimeMs: error?.responseTimeMs || null,
      errorDetail: String(error?.message || 'Falha desconhecida'),
    })
    throw error
  }
}

async function executeLabRun(runId) {
  if (ACTIVE_RUNS.has(runId)) return
  ACTIVE_RUNS.add(runId)

  try {
    await ensureLabSchema()
    const { url: evolutionUrl, apiKey } = await getGlobalEvolutionConfig()
    if (!evolutionUrl || !apiKey) {
      throw new Error('Evolution API global não configurada para o laboratório.')
    }

    const runResult = await query(
      `SELECT r.*, w.*
       FROM warmer_runs r
       JOIN warmer_configs w ON w.id = r.warmer_id
       WHERE r.id = $1
       LIMIT 1`,
      [runId]
    )

    const record = runResult.rows[0]
    if (!record) {
      throw new Error('Rodada do laboratório não encontrada.')
    }

    if (record.status === 'completed' || record.status === 'failed') {
      return
    }

    await query(
      `UPDATE warmer_runs
       SET status = 'running',
           started_at = COALESCE(started_at, NOW())
       WHERE id = $1`,
      [runId]
    )

    const totalSteps = Math.max(1, Math.min(Number(record.steps_total || DEFAULT_MESSAGES_PER_RUN), MAX_MESSAGES_PER_RUN))
    const delaySeconds = Math.max(1, Number(record.step_delay_seconds || DEFAULT_DELAY_SECONDS))

    for (let stepIndex = Number(record.steps_completed || 0); stepIndex < totalSteps; stepIndex++) {
      await executeRunStep({
        runId,
        pair: record,
        evolutionUrl,
        apiKey,
        stepIndex,
        stepsTotal: totalSteps,
        preferredStartSide: record.preferred_start_side || null,
      })

      await query(
        `UPDATE warmer_runs
         SET steps_completed = $1
         WHERE id = $2`,
        [stepIndex + 1, runId]
      )

      if (stepIndex < totalSteps - 1) {
        await wait(delaySeconds * 1000)
      }
    }

    await query(
      `UPDATE warmer_runs
       SET status = 'completed',
           finished_at = NOW(),
           last_error = NULL
       WHERE id = $1`,
      [runId]
    )

    await query(
      `UPDATE warmer_configs
       SET last_run_status = 'completed',
           last_run_error = NULL,
           last_run_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [record.id]
    )
  } catch (error) {
    const runResult = await query('SELECT warmer_id FROM warmer_runs WHERE id = $1 LIMIT 1', [runId])
    const pairId = runResult.rows[0]?.warmer_id

    await query(
      `UPDATE warmer_runs
       SET status = 'failed',
           finished_at = NOW(),
           last_error = $2
       WHERE id = $1`,
      [runId, String(error?.message || 'Falha desconhecida')]
    )

    if (pairId) {
      await query(
        `UPDATE warmer_configs
         SET last_run_status = 'failed',
             last_run_error = $2,
             last_run_at = NOW(),
             status = CASE WHEN status = 'paused' THEN status ELSE 'error' END,
             updated_at = NOW()
         WHERE id = $1`,
        [pairId, String(error?.message || 'Falha desconhecida')]
      )
    }

    console.error('[InstanceLab] Falha na rodada:', error)
  } finally {
    ACTIVE_RUNS.delete(runId)
  }
}

async function createRunRecord(pairId, initiatedBy, overrides = {}) {
  await ensureLabSchema()
  const pair = await loadLabPair(pairId)
  if (!pair) {
    throw new Error('Par de instâncias não encontrado.')
  }

  if (pair.status === 'paused') {
    throw new Error('Este par está pausado. Ative-o antes de iniciar uma rodada.')
  }

  const activeRun = await query(
    `SELECT id
     FROM warmer_runs
     WHERE warmer_id = $1
       AND status IN ('queued', 'running')
     LIMIT 1`,
    [pairId]
  )

  if (activeRun.rows.length > 0) {
    throw new Error('Já existe uma rodada em execução para este par.')
  }

  const stepsTotal = Math.max(
    1,
    Math.min(
      Number(overrides.stepsTotal || pair.default_messages_per_run || DEFAULT_MESSAGES_PER_RUN),
      MAX_MESSAGES_PER_RUN
    )
  )
  const stepDelaySeconds = Math.max(
    1,
    Number(overrides.stepDelaySeconds || pair.default_delay_seconds || DEFAULT_DELAY_SECONDS)
  )
  const preferredStartSide = ['a', 'b'].includes(String(overrides.preferredStartSide || ''))
    ? String(overrides.preferredStartSide)
    : null

  const result = await query(
    `INSERT INTO warmer_runs (warmer_id, initiated_by, status, steps_total, step_delay_seconds, preferred_start_side)
     VALUES ($1, $2, 'queued', $3, $4, $5)
     RETURNING *`,
    [pairId, initiatedBy || null, stepsTotal, stepDelaySeconds, preferredStartSide]
  )

  return result.rows[0]
}

export async function runWarmer() {
  await ensureLabSchema()
  return
}

export async function forceRunWarmer(warmerId, initiatedBy = null) {
  const run = await createRunRecord(warmerId, initiatedBy)
  void executeLabRun(run.id)
  return { success: true, run }
}

export async function performManualSend(warmerId, fromSide = 'a', initiatedBy = null) {
  const run = await createRunRecord(warmerId, initiatedBy, {
    stepsTotal: 1,
    preferredStartSide: fromSide === 'b' ? 'b' : 'a',
    stepDelaySeconds: 1,
  })

  void executeLabRun(run.id)
  return {
    success: true,
    run,
    message: `Rodada manual iniciada a partir do lado ${fromSide === 'b' ? 'B' : 'A'}.`,
  }
}

