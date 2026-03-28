import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken, checkAdmin } from '../lib/auth'
import { getDb } from '../lib/db'

export const instanceLabRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

instanceLabRoutes.get('/admin/warmer', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
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
    FROM warmer_configs w
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS total_events, COUNT(*) FILTER (WHERE ok = false) AS failed_events
      FROM warmer_logs l
      WHERE l.warmer_id = w.id
        AND l.sent_at >= CURRENT_DATE
    ) today ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM warmer_runs r
      WHERE r.warmer_id = w.id
        AND r.status IN ('queued', 'running')
      ORDER BY r.created_at DESC
      LIMIT 1
    ) recent_run ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM warmer_runs r
      WHERE r.warmer_id = w.id
      ORDER BY r.created_at DESC
      LIMIT 1
    ) last_run ON TRUE
    ORDER BY COALESCE(w.updated_at, w.created_at) DESC
  `)

  return c.json(result.rows)
})

instanceLabRoutes.post('/admin/warmer', authenticateToken, checkAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const db = getDb(c.env)

  const result = await db.query(
    `INSERT INTO warmer_configs (
      name, instance_a_id, instance_b_id, phone_a, phone_b, status,
      default_delay_seconds, default_messages_per_run,
      sample_image_url, sample_document_url, sample_audio_url, notes
    ) VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      body.name || null,
      body.instance_a_id,
      body.instance_b_id,
      body.phone_a,
      body.phone_b,
      Number(body.default_delay_seconds || 5),
      Number(body.default_messages_per_run || 4),
      body.sample_image_url || null,
      body.sample_document_url || null,
      body.sample_audio_url || null,
      body.notes || null,
    ]
  )

  return c.json(result.rows[0], 201)
})

instanceLabRoutes.put('/admin/warmer/:id/status', authenticateToken, checkAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const db = getDb(c.env)
  const result = await db.query(
    `UPDATE warmer_configs
        SET status = $1, updated_at = NOW()
      WHERE id = $2
    RETURNING *`,
    [body.status, c.req.param('id')]
  )

  if (!result.rows[0]) return c.json({ error: 'Par nao encontrado.' }, 404)
  return c.json(result.rows[0])
})

instanceLabRoutes.get('/admin/warmer/:id/logs', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  const result = await db.query(
    `SELECT l.*, r.status AS run_status
       FROM warmer_logs l
       LEFT JOIN warmer_runs r ON r.id = l.run_id
      WHERE l.warmer_id = $1
      ORDER BY l.sent_at DESC
      LIMIT 200`,
    [c.req.param('id')]
  )
  return c.json(result.rows)
})

instanceLabRoutes.post('/admin/warmer/:id/force', authenticateToken, checkAdmin, async (c) => {
  return c.json({
    ok: false,
    mode: 'cloudflare-foundation',
    message: 'Execucao assíncrona do Laboratorio ainda precisa ser migrada para Workflows/Queues.'
  }, 501)
})

instanceLabRoutes.post('/admin/warmer/:id/manual', authenticateToken, checkAdmin, async (c) => {
  return c.json({
    ok: false,
    mode: 'cloudflare-foundation',
    message: 'Envio manual do Laboratorio ainda precisa ser migrado para Workflows/Queues.'
  }, 501)
})
