import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

const DEFAULT_JWT_SECRET = 'sendmessage-cloudflare-jwt-secret-change-me-2026'
let warnedWeakJwtSecret = false

function getJwtSecret(env: Bindings) {
  const candidate = String(env.JWT_SECRET || '').trim()
  const secret = candidate.length >= 32 ? candidate : DEFAULT_JWT_SECRET

  if (!warnedWeakJwtSecret && candidate.length < 32) {
    warnedWeakJwtSecret = true
    console.warn('[Auth] JWT_SECRET ausente ou curto no Worker. Usando fallback temporario. Configure um secret forte no Cloudflare.')
  }

  return new TextEncoder().encode(secret)
}

async function signAuthToken(env: Bindings, payload: { id: string; email: string; tv: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret(env))
}

function attachCorsForAllowedOrigin(c: any) {
  c.header('Access-Control-Allow-Origin', '*')
}

authRoutes.post('/auth/signup', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const name = String(body?.name || '').trim()

  if (!email || !password) {
    return c.json({ error: 'Email e senha sao obrigatorios.' }, 400)
  }

  const db = getDb(c.env)
  const existing = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
  if (existing.rows.length > 0) {
    return c.json({ error: 'Este e-mail ja esta cadastrado.' }, 400)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const inserted = await db.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, token_version`,
    [email, passwordHash, name || null]
  )

  const user = inserted.rows[0]
  const userCount = await db.query('SELECT COUNT(*)::int AS total FROM users')
  const isFirstUser = Number(userCount.rows[0]?.total || 0) === 1

  if (isFirstUser) {
    const adminGroup = await db.query(`SELECT id FROM user_groups WHERE name = 'Administrador' LIMIT 1`)
    if (adminGroup.rows[0]?.id) {
      await db.query('INSERT INTO user_profiles (id, group_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [user.id, adminGroup.rows[0].id])
    } else {
      await db.query('INSERT INTO user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [user.id])
    }
  } else {
    await db.query('INSERT INTO user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [user.id])
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
})

authRoutes.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any))
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    if (!email || !password) {
      attachCorsForAllowedOrigin(c)
      return c.json({ error: 'Credenciais invalidas.' }, 400)
    }

    const db = getDb(c.env)
    const result = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
    const user = result.rows[0]

    if (!user) {
      attachCorsForAllowedOrigin(c)
      return c.json({ error: 'Credenciais invalidas.' }, 400)
    }

    const passwordHash = typeof user.password_hash === 'string' ? user.password_hash : ''
    if (!passwordHash) {
      attachCorsForAllowedOrigin(c)
      return c.json({ error: 'Credenciais invalidas.' }, 400)
    }

    const validPassword = await bcrypt.compare(password, passwordHash)
    if (!validPassword) {
      attachCorsForAllowedOrigin(c)
      return c.json({ error: 'Credenciais invalidas.' }, 400)
    }

    const token = await signAuthToken(c.env, {
      id: String(user.id),
      email: String(user.email),
      tv: Number(user.token_version || 0),
    })

    attachCorsForAllowedOrigin(c)
    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    })
  } catch (error) {
    console.error('[Auth.login] erro interno:', error)
    attachCorsForAllowedOrigin(c)
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
  const body = await c.req.json().catch(() => ({} as any))
  const email = String(body?.email || '').trim().toLowerCase()

  if (!email) {
    return c.json({ ok: true, message: 'Se o e-mail estiver cadastrado, as instrucoes serao enviadas.' })
  }

  const db = getDb(c.env)
  const result = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
  const user = result.rows[0]

  if (!user) {
    return c.json({ ok: true, message: 'Se o e-mail estiver cadastrado, as instrucoes serao enviadas.' })
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await db.query(
    `UPDATE users
        SET reset_password_token = $1,
            reset_password_expires = $2
      WHERE id = $3`,
    [token, expires.toISOString(), user.id]
  )

  console.log(`[CloudflareAuth] Link de redefinicao para ${email}: /reset-password/${token}`)
  return c.json({ ok: true, message: 'Se o e-mail estiver cadastrado, as instrucoes serao enviadas.' })
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
       FROM users
      WHERE reset_password_token = $1
        AND reset_password_expires > NOW()
      LIMIT 1`,
    [token]
  )

  const user = result.rows[0]
  if (!user) {
    return c.json({ error: 'Token invalido ou expirado.' }, 400)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await db.query(
    `UPDATE users
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
  const result = await db.query('SELECT id, email, name FROM users WHERE id = $1 LIMIT 1', [user.id])
  return c.json(result.rows[0] || null)
})
