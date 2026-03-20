import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

type OperationalStats = {
  enviadas_hoje: number
  enviadas_ultima_hora: number
  fila_pendente: number
  falhas_hoje: number
  campanhas_em_execucao?: number
  ai?: {
    activeKeys?: number
    requestsToday?: number
  }
}

type QueueItem = {
  id: number
  telefone?: string
  status?: string
  data_envio?: string | null
  data_criacao?: string | null
  campaign_name?: string | null
}

export default function SecurityDashboardPage() {
  const [stats, setStats] = useState<OperationalStats | null>(null)
  const [logs, setLogs] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [statsRes, queueRes] = await Promise.all([
        apiFetch('/api/admin/operational-stats'),
        apiFetch('/api/admin/queue'),
      ])
      setStats(statsRes ?? null)
      setLogs(Array.isArray(queueRes?.data) ? queueRes.data.slice(0, 10) : [])
      setError(null)
    } catch (e) {
      console.error('Erro no dashboard de segurança:', e)
      setError('Não foi possível carregar os dados operacionais.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    const interval = window.setInterval(() => void loadData(), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const reputation = useMemo(() => {
    const sent = stats?.enviadas_hoje || 0
    if (sent > 200) return { label: 'Estável', color: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200', progress: 88 }
    if (sent > 50) return { label: 'Aquecendo', color: 'text-amber-700', chip: 'bg-amber-50 border-amber-200', progress: 62 }
    return { label: 'Novo', color: 'text-sky-700', chip: 'bg-sky-50 border-sky-200', progress: 38 }
  }, [stats])

  const errorRate = useMemo(() => {
    const sent = stats?.enviadas_hoje || 0
    const failed = stats?.falhas_hoje || 0
    if (sent <= 0) return 0
    return Number(((failed / sent) * 100).toFixed(1))
  }, [stats])

  if (loading && !stats) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Carregando painel operacional...</div>
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">Operação</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Segurança Operacional</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Acompanhe reputação, ritmo de envio, saúde do pool Gemini e o que está entrando na fila.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 ${reputation.chip}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Reputação atual</div>
            <div className={`mt-1 text-lg font-semibold ${reputation.color}`}>{reputation.label}</div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Enviadas hoje</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{stats?.enviadas_hoje || 0}</div>
          <div className="mt-1 text-sm text-slate-500">mensagens concluídas</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Última hora</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{stats?.enviadas_ultima_hora || 0}</div>
          <div className="mt-1 text-sm text-slate-500">ritmo recente</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fila pendente</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{stats?.fila_pendente || 0}</div>
          <div className="mt-1 text-sm text-slate-500">itens aguardando worker</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Taxa de falha</div>
          <div className="mt-3 text-3xl font-semibold text-red-600">{errorRate}%</div>
          <div className="mt-1 text-sm text-slate-500">{stats?.falhas_hoje || 0} falha(s) no dia</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Indicadores de proteção</h2>
              <p className="text-sm text-slate-500">Resumo do volume atual e da capacidade de IA.</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{stats?.campanhas_em_execucao || 0} campanha(s) em execução</div>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">Reputação operacional</div>
                <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${reputation.chip} ${reputation.color}`}>{reputation.label}</div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${reputation.progress}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">Pool Gemini</div>
                <div className="text-xs text-slate-500">{stats?.ai?.activeKeys || 0} chave(s) ativa(s)</div>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {stats?.ai?.requestsToday || 0} requisição(ões) hoje
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500"
                  style={{ width: `${Math.min(100, ((stats?.ai?.requestsToday || 0) / Math.max(1, (stats?.ai?.activeKeys || 1) * 20)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Fila e últimos eventos</h2>
            <p className="text-sm text-slate-500">Últimos registros da fila operacional retornados pelo backend.</p>
          </div>
          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum evento recente encontrado.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{log.campaign_name || 'Campanha sem nome'}</div>
                      <div className="mt-1 text-xs text-slate-500">{log.telefone || 'Telefone não informado'}</div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {log.status || 'sem status'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {new Date(log.data_envio || log.data_criacao || Date.now()).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
