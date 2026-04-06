import { Hono } from 'hono'
import { hashPassword, comparePassword } from '../lib/password'
import { SignJWT } from 'jose'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'
import { toEvolutionNumber } from '../lib/messageUtils'

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

function getJwtSecret(env: Bindings) {
  const candidate = String(env.JWT_SECRET || '').trim()
  if (candidate.length < 32) {
    throw new Error('JWT_SECRET nao configurado ou e muito curto (minimo 32 caracteres). Configure no Cloudflare Workers secrets.')
  }
  return new TextEncoder().encode(candidate)
}

async function signAuthToken(env: Bindings, payload: { id: string; email: string; tv: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret(env))
}

// O CORS agora é tratado globalmente pelo middleware no index.ts

function normalizeEvolutionBaseUrl(url: unknown) {
  return String(url || '').trim().replace(/\/+$/, '')
}

function generateTemporaryPassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*'
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  let output = ''
  for (let index = 0; index < length; index += 1) {
    output += alphabet[values[index] % alphabet.length]
  }
  return output
}

async function sendPasswordResetViaWhatsapp(params: {
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  phone: string
  message: string
}) {
  const response = await fetch(`${params.evolutionUrl}/message/sendText/${params.evolutionInstance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.evolutionApiKey,
    },
    body: JSON.stringify({
      number: params.phone,
      text: params.message,
      linkPreview: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Falha Evolution API (HTTP ${response.status})`)
  }
}

authRoutes.post('/auth/signup', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any))
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const name = String(body?.name || '').trim()

    if (!email || !password) {
      return c.json({ error: 'Email e senha sao obrigatorios.' }, 400)
    }

    const db = getDb(c.env)
    const existing = await db.query('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [email])
    if (existing.rows.length > 0) {
      return c.json({ error: 'Este e-mail ja esta cadastrado.' }, 400)
    }

    const passwordHash = await hashPassword(password)
    const inserted = await db.query(
      `INSERT INTO public.users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, token_version`,
      [email, passwordHash, name || null]
    )

    const user = inserted.rows[0]
    const userCount = await db.query('SELECT COUNT(*)::int AS total FROM public.users')
    const isFirstUser = Number(userCount.rows[0]?.total || 0) === 1

    if (isFirstUser) {
      const adminGroup = await db.query(`SELECT id FROM public.user_groups WHERE name = 'Administrador' LIMIT 1`)
      if (adminGroup.rows[0]?.id) {
        await db.query('INSERT INTO public.user_profiles (id, group_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [user.id, adminGroup.rows[0].id])
      } else {
        await db.query('INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [user.id])
      }
    } else {
      await db.query('INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [user.id])
    }

    const token = await signAuthToken(c.env, {
      id: String(user.id),
      email: String(user.email),
      tv: Number(user.token_version || 0),
    })

    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    }, 201)
  } catch (error) {
    console.error('[Auth.signup] erro:', error)
    return c.json({ error: 'Erro interno ao criar conta.' }, 500)
  }
})

authRoutes.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any))
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    if (!email || !password) {
      return c.json({ error: 'Credenciais invalidas.' }, 400)
    }

    const db = getDb(c.env)
    const result = await db.query('SELECT * FROM public.users WHERE email = $1 LIMIT 1', [email])
    const user = result.rows[0]

    if (!user) {
      return c.json({ error: 'Credenciais invalidas.' }, 401)
    }

    const passwordHash = typeof user.password_hash === 'string' ? user.password_hash : ''
    if (!passwordHash) {
      return c.json({ error: 'Credenciais invalidas.' }, 401)
    }

    const validPassword = await comparePassword(password, passwordHash)
    if (!validPassword) {
      return c.json({ error: 'Credenciais invalidas.' }, 401)
    }

    // Migração de hash progressiva: bcrypt -> sha256
    if (passwordHash.startsWith('$2')) {
      try {
        const { hashPassword: hashPwd } = await import('../lib/password')
        const newHash = await hashPwd(password)
        await db.query(
          'UPDATE public.users SET password_hash = $1 WHERE id = $2',
          [newHash, user.id]
        )
        console.log(`[Auth] Migrated bcrypt hash to sha256 for user ${user.id}`)
      } catch (migrationErr) {
        console.error('[Auth] Failed to migrate hash, continuing login:', migrationErr)
      }
    }

    const token = await signAuthToken(c.env, {
      id: String(user.id),
      email: String(user.email),
      tv: Number(user.token_version || 0),
    })

    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    })
  } catch (error) {
    console.error('[Auth.login] erro interno:', error)
    return c.json(
      {
        error: 'Erro interno no login.',
        technical: typeof (error as any)?.message === 'string' ? (error as any).message : String(error || 'erro'),
      },
      500
    )
  }
})

authRoutes.post('/auth/forgot-password', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any))
    const email = String(body?.email || '').trim().toLowerCase()

    const genericMessage = 'Se o e-mail estiver cadastrado, a nova senha sera enviada para o telefone da conta.'
    if (!email) {
      return c.json({ ok: true, message: genericMessage })
    }

    const db = getDb(c.env)
    const result = await db.query(
      `SELECT u.id, u.email, up.phone
         FROM public.users u
         LEFT JOIN public.user_profiles up ON up.id = u.id
        WHERE u.email = $1
        LIMIT 1`,
      [email]
    )

    const user = result.rows[0]
    if (!user?.id) {
      return c.json({ ok: true, message: genericMessage })
    }

    const phone = toEvolutionNumber(user.phone)
    if (!phone) {
      return c.json({ ok: true, message: genericMessage })
    }

    const settingsResult = await db.query(
      `SELECT evolution_api_url, evolution_api_key, evolution_shared_instance
         FROM public.app_settings
        ORDER BY id DESC
        LIMIT 1`
    )
    const settings = settingsResult.rows[0] || {}
    const evolutionUrl = normalizeEvolutionBaseUrl(settings.evolution_api_url)
    const evolutionApiKey = String(settings.evolution_api_key || '').trim()
    const evolutionInstance = String(settings.evolution_shared_instance || '').trim()

    if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
      return c.json({ ok: true, message: genericMessage })
    }

    const newPassword = generateTemporaryPassword(12)
    const passwordHash = await hashPassword(newPassword)

    await db.query(
      `UPDATE public.users
          SET password_hash = $1,
              reset_password_token = NULL,
              reset_password_expires = NULL,
              token_version = COALESCE(token_version, 0) + 1
        WHERE id = $2`,
      [passwordHash, user.id]
    )

    const whatsappMessage =
      `SendMessage - Recuperacao de acesso\n` +
      `Sua senha temporaria: ${newPassword}\n` +
      `Apos entrar, altere a senha em Perfil > Seguranca.`

    await sendPasswordResetViaWhatsapp({
      evolutionUrl,
      evolutionApiKey,
      evolutionInstance,
      phone,
      message: whatsappMessage,
    })

    return c.json({ ok: true, message: genericMessage })
  } catch (error) {
    console.error('[Auth.forgot-password] erro interno:', error)
    return c.json(
      {
        error: 'Erro interno ao processar recuperacao de senha.',
        technical: typeof (error as any)?.message === 'string' ? (error as any).message : String(error || 'erro'),
      },
      500
    )
  }
})

authRoutes.post('/auth/reset-password', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const token = String(body?.token || '').trim()
  const password = String(body?.password || '')

  if (!token || !password) {
    return c.json({ error: 'Token e senha sao obrigatorios.' }, 400)
  }

  const db = getDb(c.env)
  const result = await db.query(
    `SELECT id
       FROM public.users
      WHERE reset_password_token = $1
        AND reset_password_expires > NOW()
      LIMIT 1`,
    [token]
  )

  const user = result.rows[0]
  if (!user) {
    return c.json({ error: 'Token invalido ou expirado.' }, 400)
  }

  const passwordHash = await hashPassword(password)
  await db.query(
    `UPDATE public.users
        SET password_hash = $1,
            reset_password_token = NULL,
            reset_password_expires = NULL,
            token_version = token_version + 1
      WHERE id = $2`,
    [passwordHash, user.id]
  )

  return c.json({ ok: true, message: 'Senha alterada com sucesso.' })
})

authRoutes.get('/auth/me', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) {
    return c.json({ error: 'Acesso negado.' }, 401)
  }
  const db = getDb(c.env)
  const result = await db.query('SELECT id, email, name FROM public.users WHERE id = $1 LIMIT 1', [user.id])
  return c.json(result.rows[0] || null)
})
