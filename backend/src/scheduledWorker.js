import 'dotenv/config'
import { query } from './db.js'

const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:4000'

async function processScheduledJobs() {
  const nowIso = new Date().toISOString()

  try {
    const jobsResult = await query(
      'SELECT id, campaign_id FROM scheduled_jobs WHERE status = $1 AND scheduled_at <= $2 LIMIT 10',
      ['pending', nowIso]
    )
    const jobs = jobsResult.rows;

    if (!jobs || jobs.length === 0) {
      return
    }

    for (const job of jobs) {
      console.log('[scheduler] Processando job', job.id, 'campanha', job.campaign_id)

      await query(
        'UPDATE scheduled_jobs SET status = $1, started_at = $2 WHERE id = $3',
        ['processing', new Date().toISOString(), job.id]
      )

      try {
        const resp = await fetch(
          `${BACKEND_PUBLIC_URL}/api/campaigns/${job.campaign_id}/send`,
          { method: 'POST' },
        )

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`)
        }

        await query(
          'UPDATE scheduled_jobs SET status = $1, completed_at = $2 WHERE id = $3',
          ['completed', new Date().toISOString(), job.id]
        )

        console.log('[scheduler] Job', job.id, 'concluído com sucesso')
      } catch (e) {
        console.error('[scheduler] Erro ao processar job', job.id, e)
        await query(
          'UPDATE scheduled_jobs SET status = $1, error_message = $2 WHERE id = $3',
          ['failed', String(e), job.id]
        )
      }
    }
  } catch (error) {
    console.error('[scheduler] Erro ao buscar scheduled_jobs:', error)
  }
}

setInterval(processScheduledJobs, 60_000)

console.log('[scheduler] Worker iniciado, processando jobs a cada 60s...')
