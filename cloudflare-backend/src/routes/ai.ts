import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

type GeminiAccess = {
  apiKey: string | null
  source: 'global-pool' | 'legacy-global-settings' | 'user-profile' | 'environment' | 'none'
  keyData: any | null
}

function safeString(value: unknown) {
  return String(value || '').trim()
}

async function parseJsonResponseSafe(response: Response) {
  const raw = await response.text()
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return { error: raw }
  }
}

async function ensureGeminiTables(db: ReturnType<typeof getDb>) {
  await db.query(`
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
  `)

  await db.query(`
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
  `)
}

async function logGeminiUsage(
  db: ReturnType<typeof getDb>,
  {
    keyId = null,
    userId = null,
    module = null,
    resultText = '',
    error = null,
    source = 'global-pool',
    keyLabel = null,
  }: {
    keyId?: number | null
    userId?: string | null
    module?: string | null
    resultText?: string
    error?: unknown
    source?: string
    keyLabel?: string | null
  }
) {
  await db.query(
    'INSERT INTO gemini_api_usage_logs (key_id, user_id, module, resultado, erro, source, key_label) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [
      keyId,
      userId,
      module,
      String(resultText || '').slice(0, 100),
      error ? String(error) : null,
      source,
      keyLabel,
    ]
  )
}

async function incrementPoolKeyUsage(
  db: ReturnType<typeof getDb>,
  keyId: number,
  module: string,
  resultText: string,
  error: unknown,
  userId: string,
  source: string,
  keyLabel?: string | null
) {
  await db.query('UPDATE gemini_api_keys SET requests_count = requests_count + 1, ultimo_uso = NOW() WHERE id = $1', [keyId])
  const keyCheck = await db.query('SELECT requests_count FROM gemini_api_keys WHERE id = $1', [keyId])
  if (Number(keyCheck.rows[0]?.requests_count || 0) >= 20) {
    await db.query('UPDATE gemini_api_keys SET status = $1 WHERE id = $2', ['limite_atingido', keyId])
  }

  await logGeminiUsage(db, { keyId, userId, module, resultText, error, source, keyLabel: keyLabel || null })
}

async function resolveGeminiAccessForUser(userId: string, db: ReturnType<typeof getDb>, env: Bindings): Promise<GeminiAccess> {
  const [profileResult, settingsResult] = await Promise.all([
    db.query('SELECT use_global_ai, ai_api_key FROM user_profiles WHERE id = $1 LIMIT 1', [userId]),
    db.query('SELECT global_ai_api_key FROM app_settings ORDER BY id DESC LIMIT 1'),
  ])

  const profile = profileResult.rows[0] || {}
  const settings = settingsResult.rows[0] || {}
  const useGlobalAi = profile.use_global_ai ?? true
  const userAiKey = safeString(profile.ai_api_key)
  const globalAiKey = safeString(settings.global_ai_api_key)

  if (!useGlobalAi && userAiKey) {
    return { apiKey: userAiKey, source: 'user-profile', keyData: null }
  }

  const pooled = await db.query(
    `SELECT *
       FROM gemini_api_keys
      WHERE status = 'ativa'
        AND requests_count < 20
      ORDER BY requests_count ASC, ultimo_uso ASC
      LIMIT 1`
  )
  if (pooled.rows[0]?.api_key) {
    return { apiKey: pooled.rows[0].api_key, source: 'global-pool', keyData: pooled.rows[0] }
  }

  if (useGlobalAi && globalAiKey) {
    return { apiKey: globalAiKey, source: 'legacy-global-settings', keyData: null }
  }

  const envKey = safeString(env.GEMINI_API_KEY)
  if (envKey) {
    return { apiKey: envKey, source: 'environment', keyData: null }
  }

  return { apiKey: null, source: 'none', keyData: null }
}

function normalizeGeminiModel(model: unknown) {
  const requested = safeString(model)
  if (!requested) return 'gemini-2.5-flash'
  const legacyMap: Record<string, string> = {
    'gemini-1.5-flash-latest': 'gemini-2.5-flash',
    'gemini-1.5-pro-latest': 'gemini-2.5-pro',
    'gemini-1.0-pro': 'gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash-001': 'gemini-2.5-flash',
    'gemini-2.0-flash-lite': 'gemini-2.5-flash-lite',
  }
  return legacyMap[requested] || requested
}

function resolveGeminiApiVersion(model: string, requestedVersion: unknown) {
  const normalizedRequested = requestedVersion === 'v1beta' ? 'v1beta' : 'v1'
  if (/^gemini-2\.5-/i.test(model)) {
    return 'v1beta'
  }
  return normalizedRequested
}

function parseExtractedContactText(raw: string) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

export const aiRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

aiRoutes.post('/ai/proxy', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  await ensureGeminiTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const access = await resolveGeminiAccessForUser(user.id, db, c.env)
  if (!access.apiKey) {
    return c.json({
      error:
        'Nenhuma chave Gemini disponível para este usuário. Configure uma chave global, uma chave pessoal no perfil ou uma chave ativa no painel administrativo.',
    }, 503)
  }

  const model = normalizeGeminiModel(body.model)
  const apiVersion = resolveGeminiApiVersion(model, body.apiVersion)
  const prompt = safeString(body.prompt)
  const systemInstruction = safeString(body.systemInstruction)
  const temperature = Number(body.temperature ?? 0.7)
  const maxTokens = Number(body.maxTokens ?? 2048)

  const requestBody: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: Number.isFinite(temperature) ? temperature : 0.7,
      maxOutputTokens: Number.isFinite(maxTokens) ? maxTokens : 2048,
    },
  }

  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${access.apiKey}`
  const aiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  const data = await parseJsonResponseSafe(aiRes)

  if (access.keyData?.id) {
    await incrementPoolKeyUsage(
      db,
      Number(access.keyData.id),
      'proxy',
      'AI Response',
      aiRes.ok ? null : data,
      user.id,
      access.source,
      access.keyData.nome || null
    )
  } else {
    const sourceLabel =
      access.source === 'legacy-global-settings'
        ? 'legacy_global_ai_api_key'
        : access.source === 'user-profile'
          ? 'user_ai_api_key'
          : access.source === 'environment'
            ? 'env_gemini_api_key'
            : null

    await logGeminiUsage(db, {
      userId: user.id,
      module: 'proxy',
      resultText: 'AI Response',
      error: aiRes.ok ? null : data,
      source: access.source,
      keyLabel: sourceLabel,
    })
  }

  if (!aiRes.ok) {
    return c.json(data as any, aiRes.status as any)
  }

  return c.json(data as any)
})

aiRoutes.post('/ai/address-from-cep', async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const cep = safeString(body.cep).replace(/\D/g, '')
  if (cep.length !== 8) {
    return c.json({ error: 'CEP inválido. Use formato 00000000 ou 00000-000.' }, 400)
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data) {
    return c.json({ error: 'Falha ao consultar ViaCEP.' }, 500)
  }
  if ((data as any).erro) {
    return c.json({ error: 'CEP não encontrado no ViaCEP.', cep }, 404)
  }

  const logradouro = safeString((data as any).logradouro)
  const bairro = safeString((data as any).bairro)
  const address = [logradouro, bairro].filter(Boolean).join(' - ')
  return c.json({
    ok: true,
    cep,
    address,
    city: safeString((data as any).localidade),
    state: safeString((data as any).uf),
  })
})

aiRoutes.post('/ai/extract-contact', async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const imageBase64 = safeString(body.imageBase64)
  const apiKey = safeString(body.geminiApiKey) || safeString(c.env.GEMINI_API_KEY)

  if (!imageBase64) return c.json({ ok: false, error: 'imageBase64 é obrigatório.' }, 400)
  if (!apiKey) return c.json({ ok: false, error: 'geminiApiKey é obrigatório.' }, 400)

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const mimeType = imageBase64.includes('data:image/png') ? 'image/png' : 'image/jpeg'

  const prompt = `
Extraia os dados de contato da imagem e retorne SOMENTE JSON válido no formato:
{
  "name": "",
  "phone": "",
  "email": "",
  "category": "",
  "address": "",
  "city": ""
}
Se algum campo não existir, retorne string vazia.
`.trim()

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const aiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    }),
  })

  const data = await parseJsonResponseSafe(aiRes)
  if (!aiRes.ok) return c.json({ ok: false, error: data }, aiRes.status as any)

  const text = String((data as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '')
  const extracted = parseExtractedContactText(text)
  if (!extracted || typeof extracted !== 'object') {
    return c.json({ ok: false, error: 'Não foi possível extrair os dados da imagem.' }, 422)
  }

  return c.json({
    ok: true,
    contact: {
      name: safeString((extracted as any).name),
      phone: safeString((extracted as any).phone),
      email: safeString((extracted as any).email),
      category: safeString((extracted as any).category),
      address: safeString((extracted as any).address),
      city: safeString((extracted as any).city),
    },
  })
})

