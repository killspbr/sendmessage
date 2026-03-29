import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken, checkAdmin } from '../lib/auth'
import { getDb } from '../lib/db'
import { toEvolutionNumber } from '../lib/messageUtils'

const DEFAULT_DELAY_SECONDS = 5
const DEFAULT_MESSAGES_PER_RUN = 4
const MAX_MESSAGES_PER_RUN = 20
const ACTIVE_RUNS = new Set<string>()

const LAB_TEXT_MESSAGES = [
  'Bom dia. Teste tecnico de conectividade entre instancias.',
  'Tudo certo por ai? Rodando validacao de entrega agora.',
  'Mensagem de teste enviada para validar latencia e entrega.',
  'Confirmando recepcao do payload de texto nesta rodada.',
  'Seguimos na validacao tecnica do laboratorio de instancias.',
  'Teste rapido: conferindo estabilidade da Evolution API.',
]

function safeTrim(value: unknown) {
  return String(value || '').trim()
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(min, Math.min(max, num))
}

function pickTextMessage(index: number) {
  return LAB_TEXT_MESSAGES[index % LAB_TEXT_MESSAGES.length]
}

function normalizeEvolutionBaseUrl(url: unknown) {
  return safeTrim(url).replace(/\/+$/, '')
}

function inferFileNameFromUrl(url: unknown, fallback: string) {
  try {
    const parsed = new URL(safeTrim(url))
    const value = decodeURIComponent(parsed.pathname.split('/').pop() || '').trim()
    return value || fallback
  } catch {
    return fallback
  }
}

function inferMimeTypeFromUrl(url: unknown, mediaType: 'image' | 'document' | 'audio') {
  const lower = safeTrim(url).toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint'
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.mp4')) return 'video/mp4'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (mediaType === 'audio') return 'audio/mpeg'
  if (mediaType === 'document') return 'application/octet-stream'
  return 'image/jpeg'
}

function toErrorMessage(error: unknown) {
  if (!error) return 'Falha desconhecida'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message || 'Erro interno'

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

async function ensureInstanceLabSchema(db: ReturnType<typeof getDb>) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS warmer_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      instance_a_id TEXT NOT NULL,
      instance_b_id TEXT NOT NULL,
      phone_a TEXT NOT NULL,
      phone_b TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
      default_delay_seconds INTEGER DEFAULT 5,
      default_messages_per_run INTEGER DEFAULT 4,
      sample_image_url TEXT,
      sample_document_url TEXT,
      sample_audio_url TEXT,
      notes TEXT,
      last_run_status TEXT,
      last_run_error TEXT,
      last_run_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS warmer_logs (
      id BIGSERIAL PRIMARY KEY,
      warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
      from_phone TEXT NOT NULL,
      to_phone TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      content_summary TEXT,
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      run_id UUID REFERENCES warmer_runs(id) ON DELETE SET NULL,
      from_instance TEXT,
      to_instance TEXT,
      payload_type TEXT,
      ok BOOLEAN DEFAULT true,
      provider_status INTEGER,
      response_time_ms INTEGER,
      error_detail TEXT
    )
  `)

  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS name TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS notes TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS default_delay_seconds INTEGER DEFAULT 5`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS default_messages_per_run INTEGER DEFAULT 4`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS sample_image_url TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS sample_document_url TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS sample_audio_url TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS last_run_status TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS last_run_error TEXT`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE`)
  await db.query(`ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`)

  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES warmer_runs(id) ON DELETE SET NULL`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS from_instance TEXT`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS to_instance TEXT`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS payload_type TEXT`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS ok BOOLEAN DEFAULT true`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS provider_status INTEGER`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS response_time_ms INTEGER`)
  await db.query(`ALTER TABLE warmer_logs ADD COLUMN IF NOT EXISTS error_detail TEXT`)

  await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_configs_status ON warmer_configs(status)`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_logs_warmer_id_sent_at ON warmer_logs(warmer_id, sent_at DESC)`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_warmer_created_at ON warmer_runs(warmer_id, created_at DESC)`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_status_created_at ON warmer_runs(status, created_at DESC)`)
}

async function getGlobalEvolutionConfig(db: ReturnType<typeof getDb>) {
  const result = await db.query(
    `SELECT evolution_api_url, evolution_api_key
       FROM app_settings
       ORDER BY id DESC
       LIMIT 1`
  )

  const row = result.rows[0] || {}
  return {
    url: normalizeEvolutionBaseUrl(row.evolution_api_url),
    apiKey: safeTrim(row.evolution_api_key),
  }
}

async function postEvolution(url: string, apiKey: string, body: unknown) {
  const startedAt = Date.now()
  let response: Response

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(`Falha de conexao com a Evolution API: ${toErrorMessage(error)}`)
  }

  const responseTimeMs = Date.now() - startedAt
  const rawText = await response.text().catch(() => '')

  if (!response.ok) {
    throw Object.assign(new Error(rawText || `Erro HTTP ${response.status}`), {
      status: response.status,
      responseTimeMs,
    })
  }

  return {
    status: response.status,
    responseTimeMs,
    rawText,
  }
}

async function sendText({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  text,
}: {
  evolutionUrl: string
  apiKey: string
  instanceName: string
  toPhone: string
  text: string
}) {
  const number = toEvolutionNumber(toPhone)
  if (!number) throw new Error('Telefone de destino invalido para o laboratorio.')

  return postEvolution(`${evolutionUrl}/message/sendText/${safeTrim(instanceName)}`, apiKey, {
    number,
    text,
    linkPreview: false,
  })
}

async function sendMedia({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  mediaUrl,
  mediaType,
  caption,
}: {
  evolutionUrl: string
  apiKey: string
  instanceName: string
  toPhone: string
  mediaUrl: string
  mediaType: 'image' | 'document'
  caption: string
}) {
  const number = toEvolutionNumber(toPhone)
  if (!number) throw new Error('Telefone de destino invalido para o laboratorio.')

  return postEvolution(`${evolutionUrl}/message/sendMedia/${safeTrim(instanceName)}`, apiKey, {
    number,
    mediatype: mediaType,
    mimetype: inferMimeTypeFromUrl(mediaUrl, mediaType),
    fileName: inferFileNameFromUrl(mediaUrl, mediaType === 'document' ? 'documento' : 'imagem'),
    caption: safeTrim(caption),
    media: mediaUrl,
  })
}

async function sendAudio({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  audioUrl,
}: {
  evolutionUrl: string
  apiKey: string
  instanceName: string
  toPhone: string
  audioUrl: string
}) {
  const number = toEvolutionNumber(toPhone)
  if (!number) throw new Error('Telefone de destino invalido para o laboratorio.')

  return postEvolution(`${evolutionUrl}/message/sendWhatsAppAudio/${safeTrim(instanceName)}`, apiKey, {
    number,
    audio: audioUrl,
  })
}

type PairRecord = {
  id: string
  instance_a_id: string
  instance_b_id: string
  phone_a: string
  phone_b: string
  status: 'active' | 'paused' | 'error'
  default_delay_seconds: number | null
  default_messages_per_run: number | null
  sample_image_url: string | null
  sample_document_url: string | null
  sample_audio_url: string | null
}

type RunRecord = {
  id: string
  warmer_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  steps_total: number
  steps_completed: number
  step_delay_seconds: number
  preferred_start_side: 'a' | 'b' | null
}

function buildStepPayloads(pair: PairRecord) {
  const payloads: Array<{ type: 'text' | 'image' | 'document' | 'audio'; url?: string }> = [{ type: 'text' }]

  if (safeTrim(pair.sample_image_url)) payloads.push({ type: 'image', url: safeTrim(pair.sample_image_url) })
  if (safeTrim(pair.sample_document_url)) payloads.push({ type: 'document', url: safeTrim(pair.sample_document_url) })
  if (safeTrim(pair.sample_audio_url)) payloads.push({ type: 'audio', url: safeTrim(pair.sample_audio_url) })

  return payloads
}

function resolveDirection(pair: PairRecord, preferredStartSide: 'a' | 'b' | null, stepIndex: number) {
  const startsWithA = preferredStartSide ? preferredStartSide === 'a' : stepIndex % 2 === 0
  const useAOnStep = stepIndex % 2 === 0 ? startsWithA : !startsWithA

  if (useAOnStep) {
    return {
      side: 'a' as const,
      fromInstance: pair.instance_a_id,
      toInstance: pair.instance_b_id,
      fromPhone: pair.phone_a,
      toPhone: pair.phone_b,
    }
  }

  return {
    side: 'b' as const,
    fromInstance: pair.instance_b_id,
    toInstance: pair.instance_a_id,
    fromPhone: pair.phone_b,
    toPhone: pair.phone_a,
  }
}

async function createRunLog({
  db,
  runId,
  pairId,
  direction,
  payloadType,
  contentSummary,
  ok,
  providerStatus,
  responseTimeMs,
  errorDetail,
}: {
  db: ReturnType<typeof getDb>
  runId: string
  pairId: string
  direction: {
    fromPhone: string
    toPhone: string
    fromInstance: string
    toInstance: string
  }
  payloadType: 'text' | 'image' | 'document' | 'audio'
  contentSummary: string
  ok: boolean
  providerStatus?: number | null
  responseTimeMs?: number | null
  errorDetail?: string | null
}) {
  await db.query(
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

async function executeRunStep({
  db,
  runId,
  pair,
  evolutionUrl,
  apiKey,
  stepIndex,
  stepsTotal,
  preferredStartSide,
}: {
  db: ReturnType<typeof getDb>
  runId: string
  pair: PairRecord
  evolutionUrl: string
  apiKey: string
  stepIndex: number
  stepsTotal: number
  preferredStartSide: 'a' | 'b' | null
}) {
  const payloads = buildStepPayloads(pair)
  const direction = resolveDirection(pair, preferredStartSide, stepIndex)
  const payload = payloads[stepIndex % payloads.length]
  const textContent = pickTextMessage(stepIndex)

  try {
    let responseMeta: { status: number; responseTimeMs: number } | null = null
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
        audioUrl: String(payload.url || ''),
      })
    } else {
      const isDocument = payload.type === 'document'
      contentSummary = `${isDocument ? 'Documento' : 'Imagem'} de teste: ${inferFileNameFromUrl(payload.url, 'arquivo')}`
      responseMeta = await sendMedia({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        mediaUrl: String(payload.url || ''),
        mediaType: payload.type,
        caption: isDocument ? '' : `Laboratorio de instancias ${stepIndex + 1}/${stepsTotal}`,
      })
    }

    await createRunLog({
      db,
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
      db,
      runId,
      pairId: pair.id,
      direction,
      payloadType: payload.type,
      contentSummary: payload.type === 'text' ? textContent : `${payload.type} de teste`,
      ok: false,
      providerStatus: Number((error as any)?.status || 0) || null,
      responseTimeMs: Number((error as any)?.responseTimeMs || 0) || null,
      errorDetail: toErrorMessage(error),
    })
    throw error
  }
}

async function executeLabRun(env: Bindings, runId: string) {
  if (ACTIVE_RUNS.has(runId)) return
  ACTIVE_RUNS.add(runId)

  const db = getDb(env)

  try {
    await ensureInstanceLabSchema(db)
    const config = await getGlobalEvolutionConfig(db)
    if (!config.url || !config.apiKey) {
      throw new Error('Evolution API global nao configurada para o laboratorio.')
    }

    const runResult = await db.query(
      `SELECT
         r.id AS run_id,
         r.warmer_id,
         r.status AS run_status,
         r.steps_total,
         r.steps_completed,
         r.step_delay_seconds,
         r.preferred_start_side,
         w.id,
         w.instance_a_id,
         w.instance_b_id,
         w.phone_a,
         w.phone_b,
         w.status,
         w.default_delay_seconds,
         w.default_messages_per_run,
         w.sample_image_url,
         w.sample_document_url,
         w.sample_audio_url
       FROM warmer_runs r
       JOIN warmer_configs w ON w.id = r.warmer_id
       WHERE r.id = $1
       LIMIT 1`,
      [runId]
    )

    const row = runResult.rows[0]
    if (!row) throw new Error('Rodada do laboratorio nao encontrada.')

    const run: RunRecord = {
      id: String(row.run_id),
      warmer_id: String(row.warmer_id),
      status: String(row.run_status) as RunRecord['status'],
      steps_total: Number(row.steps_total || 0),
      steps_completed: Number(row.steps_completed || 0),
      step_delay_seconds: Number(row.step_delay_seconds || 0),
      preferred_start_side: (row.preferred_start_side === 'a' || row.preferred_start_side === 'b')
        ? row.preferred_start_side
        : null,
    }

    const pair: PairRecord = {
      id: String(row.id),
      instance_a_id: String(row.instance_a_id || ''),
      instance_b_id: String(row.instance_b_id || ''),
      phone_a: String(row.phone_a || ''),
      phone_b: String(row.phone_b || ''),
      status: (row.status || 'active') as PairRecord['status'],
      default_delay_seconds: Number(row.default_delay_seconds || 0) || null,
      default_messages_per_run: Number(row.default_messages_per_run || 0) || null,
      sample_image_url: row.sample_image_url || null,
      sample_document_url: row.sample_document_url || null,
      sample_audio_url: row.sample_audio_url || null,
    }

    if (run.status === 'completed' || run.status === 'failed') return
    if (pair.status === 'paused') throw new Error('Par pausado. Ative-o para rodar.')

    await db.query(
      `UPDATE warmer_runs
          SET status = 'running',
              started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
        WHERE id = $1`,
      [run.id]
    )

    const totalSteps = clampNumber(
      run.steps_total || pair.default_messages_per_run || DEFAULT_MESSAGES_PER_RUN,
      1,
      MAX_MESSAGES_PER_RUN,
      DEFAULT_MESSAGES_PER_RUN
    )
    const delaySeconds = clampNumber(
      run.step_delay_seconds || pair.default_delay_seconds || DEFAULT_DELAY_SECONDS,
      1,
      120,
      DEFAULT_DELAY_SECONDS
    )

    for (let stepIndex = clampNumber(run.steps_completed, 0, MAX_MESSAGES_PER_RUN, 0); stepIndex < totalSteps; stepIndex++) {
      await executeRunStep({
        db,
        runId: run.id,
        pair,
        evolutionUrl: config.url,
        apiKey: config.apiKey,
        stepIndex,
        stepsTotal: totalSteps,
        preferredStartSide: run.preferred_start_side,
      })

      await db.query('UPDATE warmer_runs SET steps_completed = $1 WHERE id = $2', [stepIndex + 1, run.id])
      if (stepIndex < totalSteps - 1) await wait(delaySeconds * 1000)
    }

    await db.query(
      `UPDATE warmer_runs
          SET status = 'completed',
              finished_at = CURRENT_TIMESTAMP,
              last_error = NULL
        WHERE id = $1`,
      [run.id]
    )

    await db.query(
      `UPDATE warmer_configs
          SET last_run_status = 'completed',
              last_run_error = NULL,
              last_run_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [pair.id]
    )
  } catch (error) {
    const errorMessage = toErrorMessage(error)
    const runInfo = await db.query('SELECT warmer_id FROM warmer_runs WHERE id = $1 LIMIT 1', [runId])
    const pairId = String(runInfo.rows[0]?.warmer_id || '')

    await db.query(
      `UPDATE warmer_runs
          SET status = 'failed',
              finished_at = CURRENT_TIMESTAMP,
              last_error = $2
        WHERE id = $1`,
      [runId, errorMessage]
    )

    if (pairId) {
      await db.query(
        `UPDATE warmer_configs
            SET last_run_status = 'failed',
                last_run_error = $2,
                last_run_at = CURRENT_TIMESTAMP,
                status = CASE WHEN status = 'paused' THEN status ELSE 'error' END,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [pairId, errorMessage]
      )
    }

    console.error('[InstanceLab] Falha na rodada:', errorMessage)
  } finally {
    ACTIVE_RUNS.delete(runId)
  }
}

async function createRunRecord(
  db: ReturnType<typeof getDb>,
  pairId: string,
  initiatedBy: string | null,
  overrides: {
    stepsTotal?: number
    stepDelaySeconds?: number
    preferredStartSide?: 'a' | 'b' | null
  } = {}
) {
  await ensureInstanceLabSchema(db)
  const pairResult = await db.query('SELECT * FROM warmer_configs WHERE id = $1 LIMIT 1', [pairId])
  const pair = pairResult.rows[0]

  if (!pair) throw new Error('Par de instancias nao encontrado.')
  if (pair.status === 'paused') throw new Error('Este par esta pausado. Ative-o antes de iniciar uma rodada.')

  const activeRunResult = await db.query(
    `SELECT id
       FROM warmer_runs
      WHERE warmer_id = $1
        AND status IN ('queued', 'running')
      ORDER BY created_at DESC
      LIMIT 1`,
    [pairId]
  )
  if (activeRunResult.rows.length > 0) {
    throw new Error('Ja existe uma rodada em execucao para este par.')
  }

  const stepsTotal = clampNumber(
    overrides.stepsTotal ?? pair.default_messages_per_run ?? DEFAULT_MESSAGES_PER_RUN,
    1,
    MAX_MESSAGES_PER_RUN,
    DEFAULT_MESSAGES_PER_RUN
  )
  const stepDelaySeconds = clampNumber(
    overrides.stepDelaySeconds ?? pair.default_delay_seconds ?? DEFAULT_DELAY_SECONDS,
    1,
    120,
    DEFAULT_DELAY_SECONDS
  )
  const preferredStartSide = overrides.preferredStartSide === 'a' || overrides.preferredStartSide === 'b'
    ? overrides.preferredStartSide
    : null

  const insertResult = await db.query(
    `INSERT INTO warmer_runs (
      warmer_id, initiated_by, status, steps_total, step_delay_seconds, preferred_start_side
    ) VALUES ($1, $2, 'queued', $3, $4, $5)
    RETURNING *`,
    [pairId, initiatedBy || null, stepsTotal, stepDelaySeconds, preferredStartSide]
  )

  return insertResult.rows[0]
}

function runInBackground(c: any, promise: Promise<unknown>) {
  if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
    c.executionCtx.waitUntil(promise)
  } else {
    void promise
  }
}

export const instanceLabRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

instanceLabRoutes.get('/admin/warmer', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)

  const result = await db.query(`
    SELECT
      w.*,
      COALESCE(today.total_events, 0)::int AS sent_today,
      COALESCE(today.failed_events, 0)::int AS failed_today,
      recent_run.id AS active_run_id,
      recent_run.status AS active_run_status,
      recent_run.steps_total AS active_run_steps_total,
      recent_run.steps_completed AS active_run_steps_completed,
      last_run.status AS last_run_status_actual,
      last_run.finished_at AS last_run_finished_at,
      last_run.last_error AS last_run_error_actual
    FROM warmer_configs w
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS total_events, COUNT(*) FILTER (WHERE ok = false) AS failed_events
      FROM warmer_logs l
      WHERE l.warmer_id = w.id
        AND l.sent_at >= CURRENT_DATE
    ) today ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM warmer_runs r
      WHERE r.warmer_id = w.id
        AND r.status IN ('queued', 'running')
      ORDER BY r.created_at DESC
      LIMIT 1
    ) recent_run ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM warmer_runs r
      WHERE r.warmer_id = w.id
      ORDER BY r.created_at DESC
      LIMIT 1
    ) last_run ON TRUE
    ORDER BY COALESCE(w.updated_at, w.created_at) DESC
  `)

  return c.json(result.rows)
})

instanceLabRoutes.post('/admin/warmer', authenticateToken, checkAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)

  const instanceA = safeTrim(body.instance_a_id)
  const instanceB = safeTrim(body.instance_b_id)
  const phoneA = safeTrim(body.phone_a)
  const phoneB = safeTrim(body.phone_b)

  if (!instanceA || !instanceB || !phoneA || !phoneB) {
    return c.json({ error: 'Preencha instancias e telefones dos dois lados.' }, 400)
  }

  const result = await db.query(
    `INSERT INTO warmer_configs (
      name, instance_a_id, instance_b_id, phone_a, phone_b, status,
      default_delay_seconds, default_messages_per_run,
      sample_image_url, sample_document_url, sample_audio_url, notes
    ) VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      safeTrim(body.name) || null,
      instanceA,
      instanceB,
      phoneA,
      phoneB,
      clampNumber(body.default_delay_seconds, 1, 120, DEFAULT_DELAY_SECONDS),
      clampNumber(body.default_messages_per_run, 1, MAX_MESSAGES_PER_RUN, DEFAULT_MESSAGES_PER_RUN),
      safeTrim(body.sample_image_url) || null,
      safeTrim(body.sample_document_url) || null,
      safeTrim(body.sample_audio_url) || null,
      safeTrim(body.notes) || null,
    ]
  )

  return c.json(result.rows[0], 201)
})

instanceLabRoutes.put('/admin/warmer/:id', authenticateToken, checkAdmin, async (c) => {
  const id = safeTrim(c.req.param('id'))
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)

  const instanceA = safeTrim(body.instance_a_id)
  const instanceB = safeTrim(body.instance_b_id)
  const phoneA = safeTrim(body.phone_a)
  const phoneB = safeTrim(body.phone_b)

  if (!id) return c.json({ error: 'Par invalido.' }, 400)
  if (!instanceA || !instanceB || !phoneA || !phoneB) {
    return c.json({ error: 'Preencha instancias e telefones dos dois lados.' }, 400)
  }

  const result = await db.query(
    `UPDATE warmer_configs SET
      name = $1,
      instance_a_id = $2,
      instance_b_id = $3,
      phone_a = $4,
      phone_b = $5,
      default_delay_seconds = $6,
      default_messages_per_run = $7,
      sample_image_url = $8,
      sample_document_url = $9,
      sample_audio_url = $10,
      notes = $11,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $12
    RETURNING *`,
    [
      safeTrim(body.name) || null,
      instanceA,
      instanceB,
      phoneA,
      phoneB,
      clampNumber(body.default_delay_seconds, 1, 120, DEFAULT_DELAY_SECONDS),
      clampNumber(body.default_messages_per_run, 1, MAX_MESSAGES_PER_RUN, DEFAULT_MESSAGES_PER_RUN),
      safeTrim(body.sample_image_url) || null,
      safeTrim(body.sample_document_url) || null,
      safeTrim(body.sample_audio_url) || null,
      safeTrim(body.notes) || null,
      id,
    ]
  )

  if (result.rows.length === 0) return c.json({ error: 'Par nao encontrado.' }, 404)
  return c.json(result.rows[0])
})

instanceLabRoutes.put('/admin/warmer/:id/status', authenticateToken, checkAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const status = safeTrim(body.status).toLowerCase()
  if (!['active', 'paused', 'error'].includes(status)) {
    return c.json({ error: 'Status invalido para o laboratorio.' }, 400)
  }

  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)
  const result = await db.query(
    `UPDATE warmer_configs
        SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
    [status, c.req.param('id')]
  )

  if (!result.rows[0]) return c.json({ error: 'Par nao encontrado.' }, 404)
  return c.json(result.rows[0])
})

instanceLabRoutes.get('/admin/warmer/:id/logs', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)
  const result = await db.query(
    `SELECT l.*, r.status AS run_status
       FROM warmer_logs l
       LEFT JOIN warmer_runs r ON r.id = l.run_id
      WHERE l.warmer_id = $1
      ORDER BY l.sent_at DESC
      LIMIT 200`,
    [c.req.param('id')]
  )
  return c.json(result.rows)
})

instanceLabRoutes.post('/admin/warmer/:id/force', authenticateToken, checkAdmin, async (c) => {
  const user = c.get('user')
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)

  try {
    const run = await createRunRecord(db, safeTrim(c.req.param('id')), user?.id || null)
    runInBackground(c, executeLabRun(c.env, String(run.id)))
    return c.json({ success: true, run })
  } catch (error) {
    return c.json({ error: toErrorMessage(error) }, 400)
  }
})

instanceLabRoutes.post('/admin/warmer/:id/manual', authenticateToken, checkAdmin, async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const side = safeTrim(body.side).toLowerCase() === 'b' ? 'b' : 'a'
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)

  try {
    const run = await createRunRecord(db, safeTrim(c.req.param('id')), user?.id || null, {
      stepsTotal: 1,
      stepDelaySeconds: 1,
      preferredStartSide: side,
    })
    runInBackground(c, executeLabRun(c.env, String(run.id)))
    return c.json({
      success: true,
      run,
      message: `Rodada manual iniciada a partir do lado ${side.toUpperCase()}.`,
    })
  } catch (error) {
    return c.json({ error: toErrorMessage(error) }, 400)
  }
})
