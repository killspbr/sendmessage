import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[scheduler] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.')
}

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:4000'

async function processScheduledJobs() {
  if (!supabase) return

  const nowIso = new Date().toISOString()

  const { data: jobs, error } = await supabase
    .from('scheduled_jobs')
    .select('id, campaign_id')
    .eq('status', 'pending')
    .lte('scheduled_at', nowIso)
    .limit(10)

  if (error) {
    console.error('[scheduler] Erro ao buscar scheduled_jobs:', error)
    return
  }

  if (!jobs || jobs.length === 0) {
    return
  }

  for (const job of jobs) {
    console.log('[scheduler] Processando job', job.id, 'campanha', job.campaign_id)

    await supabase
      .from('scheduled_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', job.id)

    try {
      const resp = await fetch(
        `${BACKEND_PUBLIC_URL}/api/campaigns/${job.campaign_id}/send`,
        { method: 'POST' },
      )

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }

      await supabase
        .from('scheduled_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      console.log('[scheduler] Job', job.id, 'concluído com sucesso')
    } catch (e) {
      console.error('[scheduler] Erro ao processar job', job.id, e)
      await supabase
        .from('scheduled_jobs')
        .update({
          status: 'failed',
          error_message: String(e),
        })
        .eq('id', job.id)
    }
  }
}

setInterval(processScheduledJobs, 60_000)

console.log('[scheduler] Worker iniciado, processando jobs a cada 60s...')
