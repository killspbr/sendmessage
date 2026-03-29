import { jwtVerify } from 'jose'
import type { MiddlewareHandler } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { getDb } from './db'

const DEFAULT_JWT_SECRET = 'sendmessage-cloudflare-jwt-secret-change-me-2026'
let warnedWeakJwtSecret = false

function getJwtSecret(env: Bindings) {
  const candidate = String(env.JWT_SECRET || '').trim()
  const secret = candidate.length >= 32 ? candidate : DEFAULT_JWT_SECRET

  if (!warnedWeakJwtSecret && candidate.length < 32) {
    warnedWeakJwtSecret = true
    console.warn('[AuthMiddleware] JWT_SECRET ausente ou curto no Worker. Usando fallback temporario. Configure um secret forte no Cloudflare.')
  }

  return new TextEncoder().encode(secret)
}

export const authenticateToken: MiddlewareHandler<{ Bindings: Bindings; Variables: AppVariables }> = async (c, next) => {
  const authHeader = c.req.header('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return c.json({ error: 'Acesso negado. Token nao fornecido.' }, 401)
  }

  let payload: any
  try {
    const verified = await jwtVerify(token, getJwtSecret(c.env))
    payload = verified.payload
  } catch {
    return c.json({ error: 'Token invalido ou expirado.' }, 403)
  }

  const db = getDb(c.env)
  const result = await db.query('SELECT token_version FROM users WHERE id = $1 LIMIT 1', [payload.id])
  const user = result.rows[0]

  if (!user) {
    return c.json({ error: 'Usuario nao encontrado.' }, 401)
  }

  if (payload.tv !== undefined && Number(payload.tv) !== Number(user.token_version)) {
    return c.json({ error: 'Sessao invalidada. Faca login novamente.' }, 401)
  }

  c.set('user', {
    id: String(payload.id),
    email: payload.email ? String(payload.email) : undefined,
    tv: payload.tv ? Number(payload.tv) : undefined,
  })

  await next()
}

export const checkAdmin: MiddlewareHandler<{ Bindings: Bindings; Variables: AppVariables }> = async (c, next) => {
  const user = c.get('user')
  if (!user?.id) {
    return c.json({ error: 'Acesso negado.' }, 401)
  }

  const db = getDb(c.env)
  const result = await db.query(
    `SELECT 1
       FROM user_profiles up
       JOIN user_groups ug ON ug.id = up.group_id
      WHERE up.id = $1
        AND ug.name = 'Administrador'
      LIMIT 1`,
    [user.id]
  )

  if (result.rows.length === 0) {
    return c.json({ error: 'Acesso restrito a administradores.' }, 403)
  }

  await next()
}
