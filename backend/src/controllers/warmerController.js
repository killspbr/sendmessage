import { query } from '../db.js';

export async function listWarmers(req, res) {
  try {
    const result = await query(`
      SELECT * FROM warmer_configs ORDER BY start_date DESC
    `);
    
    // Anexa um sumário rápido de desempenho de hoje
    const enriched = [];
    for (const w of result.rows) {
      const logsRes = await query(`
        SELECT count(*)::int as total FROM warmer_logs WHERE warmer_id = $1 AND sent_at >= CURRENT_DATE
      `, [w.id]);
      enriched.push({
        ...w,
        sent_today: logsRes.rows[0].total
      });
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar maturações' });
  }
}

export async function createWarmer(req, res) {
  try {
    const {
      instance_a_id,
      instance_b_id,
      phone_a,
      phone_b,
      base_daily_limit,
      increment_per_day,
      business_hours_start,
      business_hours_end
    } = req.body;

    if (!instance_a_id || !instance_b_id || !phone_a || !phone_b) {
      return res.status(400).json({ error: 'Faltam dados das instâncias / telefones.' });
    }

    const start = business_hours_start || '08:00';
    const end = business_hours_end || '20:00';

    const result = await query(`
      INSERT INTO warmer_configs (
        instance_a_id, instance_b_id, phone_a, phone_b,
        base_daily_limit, increment_per_day,
        business_hours_start, business_hours_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      instance_a_id, instance_b_id, phone_a, phone_b,
      base_daily_limit || 10, increment_per_day || 10,
      start, end
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar agenda de maturação', details: error.message });
  }
}

export async function toggleWarmerStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' ou 'paused'

    const result = await query(`
      UPDATE warmer_configs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Maturação não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status.' });
  }
}

export async function getWarmerLogs(req, res) {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT * FROM warmer_logs WHERE warmer_id = $1 ORDER BY sent_at DESC LIMIT 100
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar logs' });
  }
}

export async function forceWarmerRun(req, res) {
  try {
    const { forceRunWarmer } = await import('../services/warmerService.js');
    const result = await forceRunWarmer(req.params.id);
    
    // Se o service retornou sucesso: false (instância inexistente), 
    // respondemos 200 p/ o front lidar de forma amigável
    if (result?.success === false) {
       return res.json(result);
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[ForceError]', error.message, error.stack);
    res.status(500).json({ 
      error: 'Erro ao forçar disparo', 
      message: error.message 
    });
  }
}

export async function updateWarmer(req, res) {
  try {
    const { id } = req.params;
    const {
      instance_a_id,
      instance_b_id,
      phone_a,
      phone_b,
      base_daily_limit,
      increment_per_day,
      business_hours_start,
      business_hours_end
    } = req.body;

    const result = await query(`
      UPDATE warmer_configs SET
        instance_a_id = $1,
        instance_b_id = $2,
        phone_a = $3,
        phone_b = $4,
        base_daily_limit = $5,
        increment_per_day = $6,
        business_hours_start = $7,
        business_hours_end = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      instance_a_id, instance_b_id, phone_a, phone_b,
      base_daily_limit, increment_per_day,
      business_hours_start, business_hours_end,
      id
    ]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Maturação não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar maturação', details: error.message });
  }
}
