import { query } from '../db.js'
import { forceRunWarmer, performManualSend } from '../services/warmerService.js'

async function ensureWarmerRoutesSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS warmer_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
      initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
      steps_total INTEGER NOT NULL DEFAULT 1,
      steps_completed INTEGER NOT NULL DEFAULT 0,
      step_delay_seconds INTEGER NOT NULL DEFAULT 5,
      preferred_start_side TEXT CHECK (preferred_start_side IN ('a', 'b')),
      last_error TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      finished_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await query(`
    ALTER TABLE warmer_configs
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS default_delay_seconds INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS default_messages_per_run INTEGER DEFAULT 4,
      ADD COLUMN IF NOT EXISTS sample_image_url TEXT,
      ADD COLUMN IF NOT EXISTS sample_document_url TEXT,
      ADD COLUMN IF NOT EXISTS sample_audio_url TEXT,
      ADD COLUMN IF NOT EXISTS last_run_status TEXT,
      ADD COLUMN IF NOT EXISTS last_run_error TEXT,
      ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE
  `)

  await query(`
    ALTER TABLE warmer_logs
      ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES warmer_runs(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS from_instance TEXT,
      ADD COLUMN IF NOT EXISTS to_instance TEXT,
      ADD COLUMN IF NOT EXISTS payload_type TEXT,
      ADD COLUMN IF NOT EXISTS ok BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS provider_status INTEGER,
      ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
      ADD COLUMN IF NOT EXISTS error_detail TEXT
  `)
}

export async function listWarmers(_req, res) {
  try {
    await ensureWarmerRoutesSchema()

    const result = await query(`
      SELECT
        w.*,
        COALESCE(today.total_events, 0)::int AS sent_today,
        COALESCE(today.failed_events, 0)::int AS failed_today,
        recent_run.id AS active_run_id,
        recent_run.status AS active_run_status,
        recent_run.steps_total AS active_run_steps_total,
        recent_run.steps_completed AS active_run_steps_completed,
        last_run.id AS last_run_id,
        last_run.status AS last_run_status_actual,
        last_run.finished_at AS last_run_finished_at,
        last_run.last_error AS last_run_error_actual
      FROM warmer_configs w
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total_events,
          COUNT(*) FILTER (WHERE ok = false) AS failed_events
        FROM warmer_logs l
        WHERE l.warmer_id = w.id
          AND l.sent_at >= CURRENT_DATE
      ) today ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM warmer_runs r
        WHERE r.warmer_id = w.id
          AND r.status IN ('queued', 'running')
        ORDER BY r.created_at DESC
        LIMIT 1
      ) recent_run ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM warmer_runs r
        WHERE r.warmer_id = w.id
        ORDER BY r.created_at DESC
        LIMIT 1
      ) last_run ON TRUE
      ORDER BY COALESCE(w.updated_at, w.created_at) DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('[InstanceLab] Erro ao listar pares:', error)
    res.status(500).json({ error: 'Erro ao listar pares do laboratório.' })
  }
}

export async function createWarmer(req, res) {
  try {
    await ensureWarmerRoutesSchema()

    const {
      name,
      instance_a_id,
      instance_b_id,
      phone_a,
      phone_b,
      default_delay_seconds,
      default_messages_per_run,
      sample_image_url,
      sample_document_url,
      sample_audio_url,
      notes,
    } = req.body || {}

    if (!instance_a_id || !instance_b_id || !phone_a || !phone_b) {
      return res.status(400).json({ error: 'Preencha instâncias e telefones dos dois lados.' })
    }

    const result = await query(
      `INSERT INTO warmer_configs (
        name, instance_a_id, instance_b_id, phone_a, phone_b, status,
        default_delay_seconds, default_messages_per_run,
        sample_image_url, sample_document_url, sample_audio_url, notes
      ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        name || null,
        instance_a_id,
        instance_b_id,
        phone_a,
        phone_b,
        Number(default_delay_seconds || 5),
        Number(default_messages_per_run || 4),
        sample_image_url || null,
        sample_document_url || null,
        sample_audio_url || null,
        notes || null,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('[InstanceLab] Erro ao criar par:', error)
    res.status(500).json({ error: 'Erro ao criar par do laboratório.', details: error.message })
  }
}

export async function updateWarmer(req, res) {
  try {
    await ensureWarmerRoutesSchema()

    const { id } = req.params
    const {
      name,
      instance_a_id,
      instance_b_id,
      phone_a,
      phone_b,
      default_delay_seconds,
      default_messages_per_run,
      sample_image_url,
      sample_document_url,
      sample_audio_url,
      notes,
    } = req.body || {}

    const result = await query(
      `UPDATE warmer_configs SET
        name = $1,
        instance_a_id = $2,
        instance_b_id = $3,
        phone_a = $4,
        phone_b = $5,
        default_delay_seconds = $6,
        default_messages_per_run = $7,
        sample_image_url = $8,
        sample_document_url = $9,
        sample_audio_url = $10,
        notes = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *`,
      [
        name || null,
        instance_a_id,
        instance_b_id,
        phone_a,
        phone_b,
        Number(default_delay_seconds || 5),
        Number(default_messages_per_run || 4),
        sample_image_url || null,
        sample_document_url || null,
        sample_audio_url || null,
        notes || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Par do laboratório não encontrado.' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('[InstanceLab] Erro ao atualizar par:', error)
    res.status(500).json({ error: 'Erro ao atualizar par do laboratório.', details: error.message })
  }
}

export async function toggleWarmerStatus(req, res) {
  try {
    await ensureWarmerRoutesSchema()
    const { id } = req.params
    const { status } = req.body || {}

    if (!['active', 'paused'].includes(String(status || ''))) {
      return res.status(400).json({ error: 'Status inválido para o laboratório.' })
    }

    const result = await query(
      `UPDATE warmer_configs
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Par do laboratório não encontrado.' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('[InstanceLab] Erro ao alterar status:', error)
    res.status(500).json({ error: 'Erro ao alterar status do laboratório.' })
  }
}

export async function getWarmerLogs(req, res) {
  try {
    await ensureWarmerRoutesSchema()
    const { id } = req.params

    const result = await query(
      `SELECT
         l.*,
         r.status AS run_status
       FROM warmer_logs l
       LEFT JOIN warmer_runs r ON r.id = l.run_id
       WHERE l.warmer_id = $1
       ORDER BY l.sent_at DESC
       LIMIT 200`,
      [id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('[InstanceLab] Erro ao listar logs:', error)
    res.status(500).json({ error: 'Erro ao listar logs do laboratório.' })
  }
}

export async function forceWarmerRun(req, res) {
  try {
    const result = await forceRunWarmer(req.params.id, req.user?.id || null)
    res.json(result)
  } catch (error) {
    console.error('[InstanceLab] Erro ao iniciar rodada:', error)
    res.status(500).json({ error: 'Erro ao iniciar rodada de teste.', message: error.message })
  }
}

export async function sendManualMessage(req, res) {
  try {
    const { side } = req.body || {}
    const result = await performManualSend(req.params.id, side, req.user?.id || null)
    res.json(result)
  } catch (error) {
    console.error('[InstanceLab] Erro no envio manual:', error)
    res.status(500).json({ error: 'Erro ao iniciar envio manual.', message: error.message })
  }
}

