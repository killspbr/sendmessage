import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

export const extensionRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

extensionRoutes.get('/extension/info', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  const listsResult = await db.query(
    'SELECT id, name FROM lists WHERE user_id = $1 ORDER BY name ASC',
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
})
