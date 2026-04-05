import { jwtVerify } from 'jose'
import type { MiddlewareHandler } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { getDb } from './db'
import { isSchemaMissingError, isSchemaPermissionError } from './ddl'

function getJwtSecret(env: Bindings) {
  const candidate = String(env.JWT_SECRET || '').trim()
  if (candidate.length < 32) {
    throw new Error('JWT_SECRET nao configurado ou e muito curto (minimo 32 caracteres). Configure no Cloudflare Workers secrets.')
  }
  return new TextEncoder().encode(candidate)
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
  let user: any = null
  try {
    const result = await db.query('SELECT token_version FROM public.users WHERE id = $1 LIMIT 1', [payload.id])
    user = result.rows[0]
  } catch (error) {
    if (isSchemaMissingError(error)) {
      const fallback = await db.query('SELECT id FROM public.users WHERE id = $1 LIMIT 1', [payload.id])
      user = fallback.rows[0] || null
    } else if (isSchemaPermissionError(error)) {
      return c.json({ error: 'Falha de permissao no banco de dados. Tentando autorrecuperacao...' }, 503)
    } else {
      throw error
    }
  }

  if (!user) {
    return c.json({ error: 'Usuario nao encontrado.' }, 401)
  }

  if (
    payload.tv !== undefined &&
    user.token_version !== undefined &&
    Number(payload.tv) !== Number(user.token_version)
  ) {
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
  let result
  try {
    result = await db.query(
      `SELECT 1
         FROM public.user_profiles up
         JOIN public.user_groups ug ON ug.id = up.group_id
        WHERE up.id = $1
          AND ug.name = 'Administrador'
        LIMIT 1`,
      [user.id]
    )
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return c.json({ error: 'Controle de grupos/permissoes indisponivel no banco atual.' }, 503)
    }
    if (isSchemaPermissionError(error)) {
        return c.json({ error: 'Falha de permissao ao validar administrador. Verifique o esquema public do banco.' }, 503)
    }
    throw error
  }

  if (result.rows.length === 0) {
    return c.json({ error: 'Acesso restrito a administradores.' }, 403)
  }

  await next()
}
