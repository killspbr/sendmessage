import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken, checkAdmin } from '../lib/auth'
import { getDb } from '../lib/db'

export const presenceRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

presenceRoutes.post('/auth/presence', authenticateToken, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any))
    const sessionId = String(body?.sessionId || '').trim()
    const currentPage = String(body?.currentPage || '').trim()
    const user = c.get('user')

    if (sessionId && user?.id) {
      const db = getDb(c.env)
      // Execução em background/fogo-e-esqueça para não atrasar o response
      void db.query(
        `INSERT INTO public.active_user_sessions (session_id, user_id, current_page, user_agent, last_seen_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (session_id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           current_page = EXCLUDED.current_page,
           user_agent = EXCLUDED.user_agent,
           last_seen_at = CURRENT_TIMESTAMP`,
        [sessionId, user.id, currentPage || null, c.req.header('user-agent') || null]
      ).catch(() => {})
      
      // Limpeza ocasional (1% das requisições)
      if (Math.random() < 0.01) {
        void db.query(`DELETE FROM public.active_user_sessions WHERE last_seen_at < CURRENT_TIMESTAMP - INTERVAL '1 day'`).catch(() => {})
      }
    }
  } catch (err) {
    // Silencio absoluto - presença não deve quebrar o sistema
  }

  return c.json({ ok: true })
})

presenceRoutes.get('/auth/presence', authenticateToken, async (c) => {
  return c.json({ ok: true })
})

presenceRoutes.post('/auth/presence/logout', authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const sessionId = String(body?.sessionId || '').trim()
  const user = c.get('user')

  if (!sessionId || !user?.id) {
    return c.json({ error: 'sessionId e obrigatorio.' }, 400)
  }

  const db = getDb(c.env)
  await db.query(`DELETE FROM public.active_user_sessions WHERE session_id = $1 AND user_id = $2`, [sessionId, user.id])
  return c.json({ ok: true })
})

presenceRoutes.get('/admin/active-users', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  const windowSeconds = Number(c.env.ACTIVE_USER_WINDOW_SECONDS || '120')

  const sessionsResult = await db.query(
    `SELECT
       s.session_id,
       s.user_id,
       s.current_page,
       s.last_seen_at,
       u.email,
       u.name
     FROM public.active_user_sessions s
     JOIN public.users u ON u.id = s.user_id
     WHERE s.last_seen_at >= CURRENT_TIMESTAMP - ($1::text || ' seconds')::interval
     ORDER BY s.last_seen_at DESC`,
    [String(windowSeconds)]
  )

  const latestByUser = new Map<string, any>()
  for (const row of sessionsResult.rows) {
    if (!latestByUser.has(row.user_id)) latestByUser.set(row.user_id, row)
  }

  const users = Array.from(latestByUser.values()).map((row) => ({
    userId: row.user_id,
    sessionId: row.session_id,
    email: row.email,
    name: row.name || row.email,
    currentPage: row.current_page || null,
    lastSeenAt: row.last_seen_at,
  }))

  return c.json({
    totalUsers: users.length,
    totalSessions: sessionsResult.rows.length,
    windowSeconds,
    generatedAt: new Date().toISOString(),
    users,
  })
})
