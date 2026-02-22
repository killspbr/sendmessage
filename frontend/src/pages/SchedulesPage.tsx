import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Campaign } from '../types'

export type ScheduleStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

type ScheduledJob = {
  id: string
  campaign_id: string
  scheduled_at: string
  status: ScheduleStatus
}

type SchedulesPageProps = {
  campaigns: Campaign[]
  effectiveUserId: string | null
}

export function SchedulesPage({ campaigns, effectiveUserId }: SchedulesPageProps) {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterCampaignId, setFilterCampaignId] = useState<'all' | string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | ScheduleStatus>('all')
  const [newCampaignId, setNewCampaignId] = useState<string>('')
  const [newDate, setNewDate] = useState<string>('')
  const [newTime, setNewTime] = useState<string>('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!effectiveUserId) return
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('scheduled_jobs')
          .select('id, campaign_id, scheduled_at, status')
          .eq('user_id', effectiveUserId)
          .order('scheduled_at', { ascending: true })

        if (cancelled) return

        if (error) {
          console.error('Erro ao carregar scheduled_jobs', error)
          setError('Falha ao carregar agendamentos.')
          return
        }

        setJobs((data ?? []) as ScheduledJob[])
      } catch (e: any) {
        if (!cancelled) {
          console.error('Erro inesperado ao carregar scheduled_jobs', e)
          setError('Erro inesperado ao carregar agendamentos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [effectiveUserId])

  // Realtime: escuta inserts/updates/deletes em scheduled_jobs do usuário atual
  useEffect(() => {
    if (!effectiveUserId) return

    const channel = supabase
      .channel(`scheduled_jobs_realtime_${effectiveUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_jobs',
          filter: `user_id=eq.${effectiveUserId}`,
        },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'

          if (eventType === 'INSERT') {
            const newJob = payload.new as ScheduledJob
            setJobs((prev) => {
              // evita duplicar se já estiver na lista
              if (prev.some((j) => j.id === newJob.id)) return prev
              return [...prev, newJob].sort((a, b) =>
                a.scheduled_at.localeCompare(b.scheduled_at),
              )
            })
          } else if (eventType === 'UPDATE') {
            const updated = payload.new as ScheduledJob
            setJobs((prev) =>
              prev
                .map((j) => (j.id === updated.id ? updated : j))
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
            )
          } else if (eventType === 'DELETE') {
            const old = payload.old as ScheduledJob
            setJobs((prev) => prev.filter((j) => j.id !== old.id))
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [effectiveUserId])

  const jobsWithCampaign = useMemo(
    () =>
      jobs.map((job) => {
        const camp = campaigns.find((c) => c.id === job.campaign_id)
        return {
          ...job,
          campaignName: camp?.name ?? '(Campanha removida)',
        }
      }),
    [jobs, campaigns],
  )

  const filtered = useMemo(
    () =>
      jobsWithCampaign.filter((job) => {
        if (filterCampaignId !== 'all' && job.campaign_id !== filterCampaignId) return false
        if (filterStatus !== 'all' && job.status !== filterStatus) return false
        return true
      }),
    [jobsWithCampaign, filterCampaignId, filterStatus],
  )

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusLabel: Record<ScheduleStatus, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Falhou',
    cancelled: 'Cancelado',
  }

  const statusClass: Record<ScheduleStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-sky-50 text-sky-700 border-sky-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
  }

  const distinctCampaigns = useMemo(
    () => campaigns,
    [campaigns],
  )

  return (
    <section className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-4">
      {/* Bloco: Novo agendamento */}
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-[12px] md:text-[13px] font-semibold text-slate-800">Novo agendamento de campanha</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Escolha uma campanha, data e hora para criar um novo envio programado.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-[11px]">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Campanha para agendar</span>
            <select
              value={newCampaignId}
              onChange={(e) => setNewCampaignId(e.target.value)}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80 min-w-[220px]"
            >
              <option value="">Selecione uma campanha</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Data</span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">Hora</span>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
            />
          </div>

          <button
            type="button"
            className="h-8 px-3 rounded-md text-[11px] font-medium bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={
              !effectiveUserId ||
              !newCampaignId ||
              !newDate ||
              !newTime ||
              creating
            }
            onClick={async () => {
              if (!effectiveUserId || !newCampaignId || !newDate || !newTime) return

              const scheduledAt = new Date(`${newDate}T${newTime}:00`)
              if (Number.isNaN(scheduledAt.getTime())) {
                setError('Data ou hora inválida para o agendamento.')
                return
              }

              setCreating(true)
              setError(null)
              try {
                const { error } = await supabase.from('scheduled_jobs').insert({
                  user_id: effectiveUserId,
                  campaign_id: newCampaignId,
                  scheduled_at: scheduledAt.toISOString(),
                  status: 'pending',
                })

                if (error) {
                  console.error('Erro ao criar agendamento', error)
                  setError('Falha ao criar o agendamento.')
                } else {
                  // limpa data/hora e recarrega
                  setNewDate('')
                  setNewTime('')
                  const { data, error: reloadError } = await supabase
                    .from('scheduled_jobs')
                    .select('id, campaign_id, scheduled_at, status')
                    .eq('user_id', effectiveUserId)
                    .order('scheduled_at', { ascending: true })

                  if (reloadError) {
                    console.error('Erro ao recarregar agendamentos após criar', reloadError)
                  } else {
                    setJobs((data ?? []) as ScheduledJob[])
                  }
                }
              } catch (e: any) {
                console.error('Erro inesperado ao criar agendamento', e)
                setError('Erro inesperado ao criar o agendamento.')
              } finally {
                setCreating(false)
              }
            }}
          >
            Agendar envio
          </button>
        </div>
      </div>

      {/* Bloco: Histórico de agendamentos */}
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h3 className="text-[12px] md:text-[13px] font-semibold text-slate-800">Histórico de agendamentos</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Veja os envios pendentes, concluídos ou cancelados por campanha.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">Campanha</span>
              <select
                value={filterCampaignId}
                onChange={(e) => setFilterCampaignId(e.target.value as any)}
                className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80 min-w-[180px]"
              >
                <option value="all">Todas as campanhas</option>
                {distinctCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="completed">Concluído</option>
                <option value="failed">Falhou</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <button
              type="button"
              className="h-7 px-3 rounded-md text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              disabled={loading}
              onClick={async () => {
                // reload simples
                try {
                  setLoading(true)
                  const { data, error } = await supabase
                    .from('scheduled_jobs')
                    .select('id, campaign_id, scheduled_at, status')
                    .eq('user_id', effectiveUserId || '')
                    .order('scheduled_at', { ascending: true })
                  if (error) {
                    console.error('Erro ao recarregar scheduled_jobs', error)
                    setError('Falha ao recarregar agendamentos.')
                  } else {
                    setJobs((data ?? []) as ScheduledJob[])
                    setError(null)
                  }
                } catch (e: any) {
                  console.error('Erro inesperado ao recarregar scheduled_jobs', e)
                  setError('Erro inesperado ao recarregar agendamentos.')
                } finally {
                  setLoading(false)
                }
              }}
            >
              Recarregar
            </button>
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-1">
            {error}
          </div>
        )}

        <div className="border border-slate-100 rounded-xl overflow-hidden mt-1">
          <table className="w-full text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-3 py-2">Campanha</th>
              <th className="text-left px-3 py-2">Data/Hora agendada</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-[11px] text-slate-400">
                  {loading ? 'Carregando agendamentos...' : 'Nenhum agendamento encontrado.'}
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
                <tr key={job.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-800">{job.campaignName}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDateTime(job.scheduled_at)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${statusClass[job.status]}`}
                    >
                      {statusLabel[job.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {job.status === 'pending' ? (
                      <button
                        type="button"
                        className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!effectiveUserId || loading}
                        onClick={async () => {
                          if (!effectiveUserId) return
                          try {
                            const { error } = await supabase
                              .from('scheduled_jobs')
                              .update({ status: 'cancelled' })
                              .eq('id', job.id)
                              .eq('user_id', effectiveUserId)

                            if (error) {
                              console.error('Erro ao cancelar agendamento', error)
                              setError('Falha ao cancelar o agendamento.')
                            } else {
                              setJobs((prev) =>
                                prev.map((j) =>
                                  j.id === job.id ? { ...j, status: 'cancelled' } : j,
                                ),
                              )
                            }
                          } catch (e: any) {
                            console.error('Erro inesperado ao cancelar agendamento', e)
                            setError('Erro inesperado ao cancelar o agendamento.')
                          }
                        }}
                      >
                        Cancelar
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
