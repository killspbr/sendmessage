import { jwtVerify } from 'jose'
import type { Context, Next } from 'hono'
import type { Bindings, AppVariables } from '../types'

export const authenticateToken = async (c: Context<{ Bindings: Bindings; Variables: AppVariables }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return c.json({ error: 'Acesso negado. Token não fornecido.' }, 401)
  }

  try {
    const rawSecret = String(c.env.JWT_SECRET || '').trim()
    const secret = new TextEncoder().encode(rawSecret)
    const { payload } = await jwtVerify(token, secret)
    
    c.set('user', { id: payload.id as string })
    await next()
  } catch (err: any) {
    return c.json({ error: 'Token inválido ou expirado.', technical: err.message }, 401)
  }
}

export const checkAdmin = async (c: Context<{ Bindings: Bindings; Variables: AppVariables }>, next: Next) => {
  const user = c.get('user')
  if (!user || !user.id) return c.json({ error: 'Não autorizado' }, 401)

  try {
    const db = c.get('db')
    const result = await db.query(
      `SELECT up.id 
         FROM public.user_profiles up
         JOIN public.user_groups ug ON ug.id = up.group_id
        WHERE up.id = $1
          AND ug.name = 'Administrador'
        LIMIT 1`,
      [user.id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Acesso restrito a administradores.' }, 403)
    }

    await next()
  } catch (error: any) {
    return c.json({ error: 'Falha na verificação de privilégios', technical: error.message }, 500)
  }
}
