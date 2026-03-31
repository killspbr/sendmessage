import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

export const extensionRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

extensionRoutes.get('/extension/info', authenticateToken, async (c) => {
  try {
    const user = c.get('user')
    if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)

    const db = getDb(c.env)
    const listsResult = await db.query(
      'SELECT id, name FROM public.lists WHERE user_id = $1 ORDER BY name ASC',
      [user.id]
    )

    return c.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email || null,
      },
      lists: listsResult.rows,
    })
  } catch (error) {
    console.error('[ExtensionAPI] Erro em /extension/info:', error)
    return c.json({ error: 'Falha interna ao buscar informações do usuário.' }, 500)
  }
})
