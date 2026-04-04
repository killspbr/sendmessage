import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken, checkAdmin } from '../lib/auth'
import { getDb } from '../lib/db'
import { toEvolutionNumber, ensureAbsoluteUrl, ensureValidMediaUrl, postEvolution, postEvolutionWithRetry } from '../lib/messageUtils'
import { runSchemaBestEffort } from '../lib/runtimeSchema'

const DEFAULT_DELAY_SECONDS = 5
const DEFAULT_MESSAGES_PER_RUN = 4
const MAX_MESSAGES_PER_RUN = 20
const ACTIVE_RUNS = new Set<string>()
const COLUMN_CACHE_TTL_MS = 60_000
const tableColumnsCache = new Map<string, { expiresAt: number; columns: Set<string> }>()

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


async function sendPresence({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  presence
}: {
  evolutionUrl: string
  apiKey: string
  instanceName: string
  toPhone: string
  presence: 'composing' | 'recording' | 'paused'
}) {
  const number = toEvolutionNumber(toPhone)
  if (!number) return
  
  try {
    await postEvolution(fetch, `${evolutionUrl}/chat/sendPresence/${safeTrim(instanceName)}`, apiKey, {
      number,
      presence
    })
  } catch (err) {
    console.warn(`[InstanceLab] Falha ao enviar presenca ${presence} para ${instanceName}:`, (err as any)?.message || String(err))
  }
}

async function generateLabMessage({
  db,
  userId,
  env,
  fromPhone,
  toPhone,
  pairId,
}: {
  db: ReturnType<typeof getDb>
  userId: string
  env: Bindings
  fromPhone: string
  toPhone: string
  pairId: string
}): Promise<string> {
  try {
    const access = await resolveGeminiAccess(userId, db, env)
    if (!access.apiKey) return pickTextMessage(Math.floor(Math.random() * 10))

    // Busca as ultimas 5 mensagens para dar contexto a IA
    const history = await db.query(
      `SELECT from_phone, content_summary
         FROM public.warmer_logs
        WHERE warmer_id = $1
          AND message_type = 'text'
        ORDER BY sent_at DESC
        LIMIT 5`,
      [pairId]
    )

    const contextStr = history.rows
      .reverse()
      .map((r: any) => `${r.from_phone === fromPhone ? 'Eu' : 'Outro'}: ${r.content_summary}`)
      .join('\n')

    // Persona personalizada ou padrão
    const warmerData = await db.query('SELECT ai_persona FROM public.warmer_configs WHERE id = $1', [pairId])
    const persona = warmerData.rows[0]?.ai_persona || 'participando de uma conversa informal e rápida para validar a conexão'

    const prompt = `
Você é um usuário de WhatsApp ${persona}. 
Histórico recente:
${contextStr || '(Sem histórico ainda)'}

Gere a PRÓXIMA mensagem curta (máximo 15 palavras), informal, em Português do Brasil. 
Não use emojis excessivos. Seja natural como um humano. Responda apenas com o texto da mensagem.
`.trim()

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${access.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 60 }
      })
    })

    if (!res.ok) throw new Error('Falha Gemini')
    const data: any = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text || pickTextMessage(Math.floor(Math.random() * 10))
  } catch {
    return pickTextMessage(Math.floor(Math.random() * 10))
  }
}

async function resolveGeminiAccess(userId: string, db: ReturnType<typeof getDb>, env: Bindings) {
  // Logic based on ai.ts
  const [profileResult, settingsResult] = await Promise.all([
    db.query('SELECT use_global_ai, ai_api_key FROM public.user_profiles WHERE id = $1 LIMIT 1', [userId]),
    db.query('SELECT global_ai_api_key FROM public.app_settings ORDER BY id DESC LIMIT 1'),
  ])

  const profile = profileResult.rows[0] || {}
  const settings = settingsResult.rows[0] || {}
  const useGlobalAi = profile.use_global_ai ?? true
  const userAiKey = String(profile.ai_api_key || '').trim()
  const globalAiKey = String(settings.global_ai_api_key || '').trim()

  if (!useGlobalAi && userAiKey) return { apiKey: userAiKey }
  
  const pooled = await db.query(
    `SELECT api_key FROM public.gemini_api_keys WHERE status = 'ativa' AND requests_count < 20 ORDER BY requests_count ASC LIMIT 1`
  )
  if (pooled.rows[0]?.api_key) return { apiKey: pooled.rows[0].api_key }
  
  if (useGlobalAi && globalAiKey) return { apiKey: globalAiKey }
  return { apiKey: String(env.GEMINI_API_KEY || '').trim() }
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

async function getTableColumns(db: ReturnType<typeof getDb>, tableName: string) {
  const cacheKey = `public.${tableName}`
  const cached = tableColumnsCache.get(cacheKey)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.columns
  }

  const result = await db.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1`,
    [tableName]
  )

  const columns = new Set<string>(result.rows.map((row: any) => String(row.column_name)))
  tableColumnsCache.set(cacheKey, {
    columns,
    expiresAt: now + COLUMN_CACHE_TTL_MS,
  })

  return columns
}

function hasColumn(columns: Set<string>, columnName: string) {
  return columns.has(columnName)
}

async function tableExists(db: ReturnType<typeof getDb>, tableName: string) {
  const result = await db.query(`SELECT to_regclass($1) AS table_name`, [`public.${tableName}`])
  return Boolean(result.rows[0]?.table_name)
}

async function ensureInstanceLabSchema(db: ReturnType<typeof getDb>) {
  const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)"
  
  // Proteção total contra falhas de permissão de schema no Hyperdrive/Workers
  await runSchemaBestEffort(async () => {
    // 1. Configs
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_configs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID,
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

    // 2. Runs
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_runs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        warmer_id UUID NOT NULL REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
        initiated_by UUID,
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

    // 3. Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_logs (
        id BIGSERIAL PRIMARY KEY,
        warmer_id UUID NOT NULL REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        content_summary TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        run_id UUID REFERENCES public.warmer_runs(id) ON DELETE SET NULL,
        from_instance TEXT,
        to_instance TEXT,
        payload_type TEXT,
        ok BOOLEAN DEFAULT true,
        provider_status INTEGER,
        response_time_ms INTEGER,
        error_detail TEXT
      )
    `)
  }, 'instanceLabSchemaInitial')

  // Updates e Indices
  await runSchemaBestEffort(async () => {
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS name TEXT`)
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS notes TEXT`)
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS ai_persona TEXT`)
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS night_mode_enabled BOOLEAN DEFAULT true`)
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS night_mode_start TEXT DEFAULT '22:00'`)
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS night_mode_end TEXT DEFAULT '07:00'`)
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`)

    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_configs_status ON public.warmer_configs(status)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_logs_warmer_id_sent_at ON public.warmer_logs(warmer_id, sent_at DESC)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_warmer_created_at ON public.warmer_runs(warmer_id, created_at DESC)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_status_created_at ON public.warmer_runs(status, created_at DESC)`)
  }, 'instanceLabUpdatesV2')
}

async function getGlobalEvolutionConfig(db: ReturnType<typeof getDb>) {
  const result = await db.query(
    `SELECT evolution_api_url, evolution_api_key
       FROM public.app_settings
       ORDER BY id DESC
       LIMIT 1`
  )

  const row = result.rows[0] || {}
  return {
    url: normalizeEvolutionBaseUrl(row.evolution_api_url),
    apiKey: safeTrim(row.evolution_api_key),
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

  return postEvolutionWithRetry(fetch, `${evolutionUrl}/message/sendText/${safeTrim(instanceName)}`, apiKey, {
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
  baseUrl,
}: {
  evolutionUrl: string
  apiKey: string
  instanceName: string
  toPhone: string
  mediaUrl: string
  mediaType: 'image' | 'document'
  caption: string
  baseUrl?: string
}) {
  const number = toEvolutionNumber(toPhone)
  if (!number) throw new Error('Telefone de destino invalido para o laboratorio.')

  const rawUrl = baseUrl ? ensureAbsoluteUrl(mediaUrl, baseUrl) : mediaUrl
  const finalMediaUrl = ensureValidMediaUrl(rawUrl)

  console.log(`[InstanceLab] Enviando media (${mediaType}) de ${instanceName} para ${toPhone}. URL: ${finalMediaUrl.substring(0, 100)}`)

  return postEvolutionWithRetry(fetch, `${evolutionUrl}/message/sendMedia/${safeTrim(instanceName)}`, apiKey, {
    number,
    mediatype: mediaType,
    mimetype: inferMimeTypeFromUrl(finalMediaUrl, mediaType),
    fileName: inferFileNameFromUrl(finalMediaUrl, mediaType === 'document' ? 'documento' : 'imagem'),
    caption: safeTrim(caption),
    media: finalMediaUrl,
  })
}

async function sendAudio({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  audioUrl,
  baseUrl,
}: {
  evolutionUrl: string
  apiKey: string
  instanceName: string
  toPhone: string
  audioUrl: string
  baseUrl?: string
}) {
  const number = toEvolutionNumber(toPhone)
  if (!number) throw new Error('Telefone de destino invalido para o laboratorio.')

  const rawUrl = baseUrl ? ensureAbsoluteUrl(audioUrl, baseUrl) : audioUrl
  const finalAudioUrl = ensureValidMediaUrl(rawUrl)

  console.log(`[InstanceLab] Enviando audio de ${instanceName} para ${toPhone}. URL: ${finalAudioUrl.substring(0, 100)}`)

  return postEvolutionWithRetry(fetch, `${evolutionUrl}/message/sendWhatsAppAudio/${safeTrim(instanceName)}`, apiKey, {
    number,
    audio: finalAudioUrl,
  })
}

type PairRecord = {
  id: string
  user_id: string
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
  const columns = await getTableColumns(db, 'warmer_logs')
  const values: unknown[] = []
  const fields: string[] = []

  const add = (field: string, value: unknown) => {
    if (!hasColumn(columns, field)) return
    fields.push(field)
    values.push(value)
  }

  add('warmer_id', pairId)
  add('run_id', runId)
  add('from_phone', direction.fromPhone)
  add('to_phone', direction.toPhone)
  add('from_instance', direction.fromInstance)
  add('to_instance', direction.toInstance)
  add('message_type', payloadType === 'audio' ? 'audio' : 'text')
  add('payload_type', payloadType)
  add('content_summary', contentSummary)
  add('ok', ok)
  add('provider_status', providerStatus || null)
  add('response_time_ms', responseTimeMs || null)
  add('error_detail', errorDetail || null)

  if (fields.length === 0) {
    throw new Error('Tabela public.warmer_logs sem colunas compatíveis para inserção.')
  }

  const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ')
  await db.query(`INSERT INTO public.warmer_logs (${fields.join(', ')}) VALUES (${placeholders})`, values)
}

async function executeRunStep({
  db,
  runId,
  pair,
  evolutionUrl,
  apiKey,
  env,
  stepIndex,
  stepsTotal,
  preferredStartSide,
  baseUrl,
}: {
  db: ReturnType<typeof getDb>
  runId: string
  pair: PairRecord
  evolutionUrl: string
  apiKey: string
  env: Bindings
  stepIndex: number
  stepsTotal: number
  preferredStartSide: 'a' | 'b' | null
  baseUrl?: string
}) {
  const payloads = buildStepPayloads(pair)
  const direction = resolveDirection(pair, preferredStartSide, stepIndex)
  const payload = payloads[stepIndex % payloads.length]
  const textContent = pickTextMessage(stepIndex)

  try {
    let responseMeta: { status: number; responseTimeMs: number } | null = null
    let contentSummary = ''

    if (payload.type === 'text') {
      const runData = await db.query('SELECT initiated_by FROM public.warmer_runs WHERE id = $1', [runId])
      const userId = runData.rows[0]?.initiated_by || pair.user_id || ''

      const dynamicMessage = await generateLabMessage({
        db,
        userId,
        env,
        fromPhone: direction.fromPhone,
        toPhone: direction.toPhone,
        pairId: pair.id
      })

      contentSummary = dynamicMessage
      
      // Simula digitacao antes de enviar texto
      await sendPresence({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        presence: 'composing'
      })
      // Aguarda um tempo proporcional ao tamanho da mensagem (ex: 150ms por caractere, min 1.5s, max 8s)
      const typingTime = Math.min(8000, Math.max(1500, dynamicMessage.length * 150))
      await wait(typingTime)

      const meta = await sendText({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        text: dynamicMessage,
      })
      responseMeta = { status: meta.status, responseTimeMs: meta.responseTimeMs }
    } else if (payload.type === 'audio') {
      contentSummary = `Audio de teste: ${inferFileNameFromUrl(payload.url, 'audio.mp3')}`
      
      // Simula gravacao de audio
      await sendPresence({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        presence: 'recording'
      })
      await wait(Math.random() * 3000 + 2000) // 2 a 5 segundos de "gravacao"

      const meta = await sendAudio({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        audioUrl: String(payload.url || ''),
        baseUrl,
      })
      responseMeta = { status: meta.status, responseTimeMs: meta.responseTimeMs }
    } else {
      const isDocument = payload.type === 'document'
      const mType = payload.type === 'document' ? 'document' : 'image'
      contentSummary = `${isDocument ? 'Documento' : 'Imagem'} de teste: ${inferFileNameFromUrl(payload.url, 'arquivo')}`
      
      const meta = await sendMedia({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        mediaUrl: String(payload.url || ''),
        mediaType: mType,
        caption: isDocument ? '' : `Laboratorio de instancias ${stepIndex + 1}/${stepsTotal}`,
        baseUrl,
      })
      responseMeta = { status: meta.status, responseTimeMs: meta.responseTimeMs }
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

async function executeLabRun(env: Bindings, runId: string, baseUrl?: string) {
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
         w.user_id,
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
       FROM public.warmer_runs r
       JOIN public.warmer_configs w ON w.id = r.warmer_id
       WHERE r.id = $1
       LIMIT 1`,
      [runId]
    )

    const row = runResult.rows[0]
    if (!row) throw new Error('Rodada do laboratorio nao encontrada.')

    // CHECAGEM DE MODO NOTURNO (Horário de Brasília UTC-3)
    const now = new Date()
    const hourBR = (now.getUTCHours() - 3 + 24) % 24
    const isNight = hourBR >= 22 || hourBR < 7

    // Se for noite e a rodada não foi "forçada" manualmente (initiated_by != sys_cron), poderíamos pausar.
    // Mas para simplificar, vamos apenas avisar no log e aumentar os delays.
    const nightModeDelayMultiplier = isNight ? 2.5 : 1.0
    if (isNight) {
      console.log(`[InstanceLab] Rodando em MODO NOTURNO (Hora BR: ${hourBR}h). Simulando trafego reduzido.`)
    }

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
      user_id: String(row.user_id || ''),
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
      `UPDATE public.warmer_runs
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
    const baseDelay = clampNumber(
      run.step_delay_seconds || pair.default_delay_seconds || DEFAULT_DELAY_SECONDS,
      1,
      120,
      DEFAULT_DELAY_SECONDS
    )
    
    // Aplica multiplicador de modo noturno ao delay base
    const delaySeconds = baseDelay * nightModeDelayMultiplier

    for (let stepIndex = clampNumber(run.steps_completed, 0, MAX_MESSAGES_PER_RUN, 0); stepIndex < totalSteps; stepIndex++) {
      await executeRunStep({
        db,
        runId: run.id,
        pair,
        evolutionUrl: config.url,
        apiKey: config.apiKey,
        env,
        stepIndex,
        stepsTotal: totalSteps,
        preferredStartSide: run.preferred_start_side,
        baseUrl,
      })

      await db.query('UPDATE public.warmer_runs SET steps_completed = $1 WHERE id = $2', [stepIndex + 1, run.id])
      if (stepIndex < totalSteps - 1) {
        // Atraso randomizado entre etapas (80% a 120% do configurado) para parecer mais humano
        const randomizedDelay = delaySeconds * (0.8 + Math.random() * 0.4)
        await wait(randomizedDelay * 1000)
      }
    }

    await db.query(
      `UPDATE public.warmer_runs
          SET status = 'completed',
              finished_at = CURRENT_TIMESTAMP,
              last_error = NULL
        WHERE id = $1`,
      [run.id]
    )

    await db.query(
      `UPDATE public.warmer_configs
          SET last_run_status = 'completed',
              last_run_error = NULL,
              last_run_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [pair.id]
    )
  } catch (error) {
    const errorMessage = toErrorMessage(error)
    const runInfo = await db.query('SELECT warmer_id FROM public.warmer_runs WHERE id = $1 LIMIT 1', [runId])
    const pairId = String(runInfo.rows[0]?.warmer_id || '')

    await db.query(
      `UPDATE public.warmer_runs
          SET status = 'failed',
              finished_at = CURRENT_TIMESTAMP,
              last_error = $2
        WHERE id = $1`,
      [runId, errorMessage]
    )

    if (pairId) {
      await db.query(
        `UPDATE public.warmer_configs
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
  const pairResult = await db.query('SELECT * FROM public.warmer_configs WHERE id = $1 LIMIT 1', [pairId])
  const pair = pairResult.rows[0]

  if (!pair) throw new Error('Par de instancias nao encontrado.')
  if (pair.status === 'paused') throw new Error('Este par esta pausado. Ative-o antes de iniciar uma rodada.')

  const activeRunResult = await db.query(
    `SELECT id
       FROM public.warmer_runs
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

  const runId = crypto.randomUUID()
  const insertResult = await db.query(
    `INSERT INTO public.warmer_runs (
      id, warmer_id, initiated_by, status, steps_total, step_delay_seconds, preferred_start_side
    ) VALUES ($1, $2, $3, 'queued', $4, $5, $6)
    RETURNING *`,
    [runId, pairId, initiatedBy || null, stepsTotal, stepDelaySeconds, preferredStartSide]
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

export async function handleScheduledWarming(env: Bindings) {
  const db = getDb(env)
  await ensureInstanceLabSchema(db)

  // 1. Busca todos os pares ativos
  const activePairsResult = await db.query(
    "SELECT * FROM public.warmer_configs WHERE status = 'active'"
  )
  const activePairs = activePairsResult.rows

  if (activePairs.length === 0) return

  const now = new Date()
  const currentTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })

  for (const pair of activePairs) {
    try {
      // 2. Filtro de Night Mode configurável por par
      if (pair.night_mode_enabled) {
        const start = pair.night_mode_start || '22:00'
        const end = pair.night_mode_end || '07:00'
        
        // Verifica se o horário atual está dentro do intervalo de repouso (handles overnight span)
        const isNight = start <= end 
          ? (currentTimeStr >= start && currentTimeStr <= end)
          : (currentTimeStr >= start || currentTimeStr <= end)

        if (isNight) {
          // console.log(`[ScheduledWarming] Par ${pair.name || pair.id} em modo noturno (${currentTimeStr}). Pulando...`)
          continue
        }
      }
      // 3. Verifica se ja existe uma rodada em execucao
      const activeRun = await db.query(
        "SELECT id FROM public.warmer_runs WHERE warmer_id = $1 AND status IN ('queued', 'running') LIMIT 1",
        [pair.id]
      )
      if (activeRun.rows.length > 0) continue

      // 4. Verifica se passou o tempo de delay desde o ultimo disparo
      const lastRunAt = pair.last_run_at ? new Date(pair.last_run_at) : new Date(0)
      const diffSeconds = (now.getTime() - lastRunAt.getTime()) / 1000
      
      // Adiciona uma margem aleatoria de 0 a 50% do delay para nao ser mecanico
      const baseDelay = pair.default_delay_seconds || DEFAULT_DELAY_SECONDS
      const randomJitter = Math.random() * (baseDelay * 0.5)
      const targetDelay = baseDelay + randomJitter

      if (diffSeconds < targetDelay) {
        // console.log(`[ScheduledWarming] Par ${pair.id} ainda no intervalo. ${Math.round(diffSeconds)}s < ${Math.round(targetDelay)}s`)
        continue
      }

      console.log(`[ScheduledWarming] Iniciando passo automatico para par: ${pair.name || pair.id}`)

      // 5. Cria uma rodada de apenas 1 PASSO (aquele "ping-pong" basico)
      const run = await createRunRecord(db, String(pair.id), null, {
        stepsTotal: 1,
        // Delay do passo na rodada manual nao importa muito aqui pois eh so 1 passo
        stepDelaySeconds: 1 
      })

      // Executa com o env real do Worker para manter todos os bindings ativos.
      await executeLabRun(env, String(run.id), '')
      
    } catch (err) {
      console.error(`[ScheduledWarming] Erro ao processar par ${pair.id}:`, err)
    }
  }
}

export const instanceLabRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

instanceLabRoutes.get('/admin/warmer', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)
  const [hasWarmerLogs, hasWarmerRuns, warmerLogColumns] = await Promise.all([
    tableExists(db, 'warmer_logs'),
    tableExists(db, 'warmer_runs'),
    getTableColumns(db, 'warmer_logs'),
  ])
  const hasOkColumn = hasWarmerLogs && hasColumn(warmerLogColumns, 'ok')
  const failedEventsExpr = hasOkColumn ? 'COUNT(*) FILTER (WHERE l.ok = false)' : '0'

  const todayJoin = hasWarmerLogs
    ? `LEFT JOIN LATERAL (
      SELECT COUNT(*) AS total_events, ${failedEventsExpr} AS failed_events
       FROM public.warmer_logs l
      WHERE l.warmer_id = w.id
        AND l.sent_at >= CURRENT_DATE
    ) today ON TRUE`
    : `LEFT JOIN LATERAL (
      SELECT 0::bigint AS total_events, 0::bigint AS failed_events
    ) today ON TRUE`

  const recentRunJoin = hasWarmerRuns
    ? `LEFT JOIN LATERAL (
      SELECT * FROM public.warmer_runs r
      WHERE r.warmer_id = w.id
        AND r.status IN ('queued', 'running')
      ORDER BY r.created_at DESC
      LIMIT 1
    ) recent_run ON TRUE`
    : `LEFT JOIN LATERAL (
      SELECT NULL::uuid AS id, NULL::text AS status, NULL::int AS steps_total, NULL::int AS steps_completed
    ) recent_run ON TRUE`

  const lastRunJoin = hasWarmerRuns
    ? `LEFT JOIN LATERAL (
      SELECT * FROM public.warmer_runs r
      WHERE r.warmer_id = w.id
      ORDER BY r.created_at DESC
      LIMIT 1
    ) last_run ON TRUE`
    : `LEFT JOIN LATERAL (
      SELECT NULL::text AS status, NULL::timestamptz AS finished_at, NULL::text AS last_error
    ) last_run ON TRUE`

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
    FROM public.warmer_configs w
    ${todayJoin}
    ${recentRunJoin}
    ${lastRunJoin}
    ORDER BY w.created_at DESC
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

  const pairId = crypto.randomUUID()
  const result = await db.query(
    `INSERT INTO public.warmer_configs (
      id, user_id, name, instance_a_id, instance_b_id, phone_a, phone_b, status,
      default_delay_seconds, default_messages_per_run,
      sample_image_url, sample_document_url, sample_audio_url, notes,
      ai_persona, night_mode_enabled, night_mode_start, night_mode_end
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *`,
    [
      pairId,
      c.get('user')?.id,
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
      safeTrim(body.ai_persona) || null,
      body.night_mode_enabled ?? true,
      safeTrim(body.night_mode_start) || '22:00',
      safeTrim(body.night_mode_end) || '07:00',
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
    `UPDATE public.warmer_configs SET
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
      ai_persona = $12,
      night_mode_enabled = $13,
      night_mode_start = $14,
      night_mode_end = $15,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $16
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
      safeTrim(body.ai_persona) || null,
      body.night_mode_enabled ?? true,
      safeTrim(body.night_mode_start) || '22:00',
      safeTrim(body.night_mode_end) || '07:00',
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
    `UPDATE public.warmer_configs
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
  const hasWarmerLogs = await tableExists(db, 'warmer_logs')
  if (!hasWarmerLogs) {
    return c.json([])
  }

  const warmerLogColumns = await getTableColumns(db, 'warmer_logs')
  const hasRunIdColumn = hasColumn(warmerLogColumns, 'run_id')

  const query = hasRunIdColumn
    ? `SELECT l.*, r.status AS run_status
         FROM public.warmer_logs l
         LEFT JOIN public.warmer_runs r ON r.id = l.run_id
        WHERE l.warmer_id = $1
        ORDER BY l.sent_at DESC
        LIMIT 200`
    : `SELECT l.*, NULL::text AS run_status
         FROM public.warmer_logs l
        WHERE l.warmer_id = $1
        ORDER BY l.sent_at DESC
        LIMIT 200`

  const result = await db.query(query, [c.req.param('id')])
  return c.json(result.rows)
})

instanceLabRoutes.post('/admin/warmer/:id/force', authenticateToken, checkAdmin, async (c) => {
  const user = c.get('user')
  const db = getDb(c.env)
  await ensureInstanceLabSchema(db)

  const warmerId = safeTrim(c.req.param('id'))
  try {
    // Verificacao explicita antes de rodar
    const check = await db.query('SELECT id FROM public.warmer_configs WHERE id = $1 LIMIT 1', [warmerId])
    if (!check.rows[0]) {
      return c.json({ error: `Par de instancia ${warmerId} nao encontrado.` }, 404)
    }

    const run = await createRunRecord(db, warmerId, user?.id || null)
    runInBackground(c, executeLabRun(c.env, String(run.id), new URL(c.req.url).origin))
    return c.json({ success: true, run })
  } catch (error) {
    console.error(`[InstanceLab] Erro ao forcar rodada para ${warmerId}:`, error)
    return c.json({ 
      error: toErrorMessage(error),
      technical: String(error)
    }, 400)
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
    runInBackground(c, executeLabRun(c.env, String(run.id), new URL(c.req.url).origin))
    return c.json({
      success: true,
      run,
      message: `Rodada manual iniciada a partir do lado ${side.toUpperCase()}.`,
    })
  } catch (error) {
    return c.json({ error: toErrorMessage(error) }, 400)
  }
})
